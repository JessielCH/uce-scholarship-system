// server/scripts/ingestData.js
import XLSX from "xlsx";
import { supabase } from "../config/supabase.js";
import { applySelectionLogic } from "../utils/selectionAlgorithm.js";
import { logger } from "../utils/logger.js";
import path from "path";
import { fileURLToPath } from "url";

// Helper for ESM directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_NAME = "../data/students_mock.xlsx"; // Ensure this file exists

async function runIngestion() {
  logger.info("Ingestion", "Iniciando proceso de ingesta de becas");

  // 1. SETUP ACADEMIC PERIOD
  // In a real app, this comes from UI. Here we hardcode or find active.
  const PERIOD_NAME = "2025-2026 Semestre 1";

  logger.debug("Ingestion", "Buscando período académico", {
    periodName: PERIOD_NAME,
  });
  let { data: period, error: periodError } = await supabase
    .from("academic_periods")
    .select("id")
    .eq("name", PERIOD_NAME)
    .single();

  if (!period) {
    logger.info("Ingestion", "Creando nuevo período académico", {
      periodName: PERIOD_NAME,
    });
    const { data: newPeriod } = await supabase
      .from("academic_periods")
      .insert({
        name: PERIOD_NAME,
        start_date: "2025-09-01",
        end_date: "2026-02-01",
        is_active: true,
      })
      .select()
      .single();
    period = newPeriod;
  }
  const PERIOD_ID = period.id;

  // 2. READ EXCEL
  const filePath = path.join(__dirname, FILE_NAME);
  logger.info("Ingestion", "Leyendo archivo de datos", { filePath });
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  logger.info("Ingestion", "Datos cargados del Excel", {
    rowCount: rawData.length,
  });

  // 3. GROUP BY CAREER
  // Format required: Faculty -> Career -> Students
  const studentsByCareer = {};

  rawData.forEach((row) => {
    // Map Excel columns to our variables (Adjust keys based on your Excel header)
    const career = row["Carrera"] || "Unknown Career";
    const faculty = row["Facultad"] || "Unknown Faculty";

    const studentObj = {
      national_id: row["Cedula"],
      first_name: row["Nombres"],
      last_name: row["Apellidos"],
      university_email: row["Correo"],
      faculty: faculty,
      career: career,
      average_grade: parseFloat(row["Promedio"]),
      semester: parseInt(row["Semestre"]),
      academic_condition: row["Condicion"], // Regular / No Regular
    };

    const key = `${faculty}:::${career}`;
    if (!studentsByCareer[key]) studentsByCareer[key] = [];
    studentsByCareer[key].push(studentObj);
  });

  // 4. PROCESS EACH CAREER
  for (const key of Object.keys(studentsByCareer)) {
    const [facultyName, careerName] = key.split(":::");
    logger.info("Ingestion", `Procesando carrera: ${careerName}`, {
      faculty: facultyName,
      studentCount: studentsByCareer[key].length,
    });

    // A. Ensure Faculty & Career exist in DB (Find or Create)
    // (Simplified for brevity: In prod, cache these IDs to avoid N+1 queries)
    let { data: facData } = await supabase
      .from("faculties")
      .select("id")
      .eq("name", facultyName)
      .single();
    if (!facData) {
      const { data: newFac } = await supabase
        .from("faculties")
        .insert({ name: facultyName })
        .select()
        .single();
      facData = newFac;
    }

    let { data: carData } = await supabase
      .from("careers")
      .select("id")
      .eq("name", careerName)
      .single();
    if (!carData) {
      const { data: newCar } = await supabase
        .from("careers")
        .insert({ name: careerName, faculty_id: facData.id })
        .select()
        .single();
      carData = newCar;
    }

    // B. Apply Algorithm
    const studentsInCareer = studentsByCareer[key];
    const processedStudents = applySelectionLogic(studentsInCareer);

    // C. Database Operations (Atomic per student usually, but lets batch for speed)
    let selectedCount = 0;

    for (const student of processedStudents) {
      // C.1 Upsert Student (Permanent Record)
      const { data: studentDB, error: stuError } = await supabase
        .from("students")
        .upsert(
          {
            national_id: String(student.national_id), // Ensure string
            university_email: student.university_email,
            first_name: student.first_name,
            last_name: student.last_name,
          },
          { onConflict: "university_email" },
        ) // Unique constraint
        .select()
        .single();

      if (stuError) {
        logger.error("Ingestion", `Error insertando estudiante`, stuError, {
          email: student.university_email,
        });
        continue;
      }

      // C.2 Create Scholarship Selection (Only if selected or keep history of application?)
      // Requirement says "Selection of Top 10%". Usually we only store the winners in the active process table
      // OR we store everyone with a status "REJECTED_BY_SCORE".
      // Let's store ONLY the SELECTED ones to keep the scholarship table clean,
      // as per "El sistema NO recibe postulaciones... Seleccion del Top 10%".

      if (student.is_selected) {
        const { error: selError } = await supabase
          .from("scholarship_selections")
          .upsert(
            {
              student_id: studentDB.id,
              period_id: PERIOD_ID,
              career_id: carData.id,
              average_grade: student.average_grade,
              semester: student.semester,
              academic_condition: student.academic_condition,
              is_top_10: student.selection_details.is_top_10,
              status: "SELECTED", // Initial status
            },
            { onConflict: "student_id, period_id" },
          ); // Prevent duplicates

        if (!selError) selectedCount++;
        else
          logger.error("Ingestion", "Error creando selección", selError, {
            studentId: studentDB.id,
            carreerId: carData.id,
          });
      }
    }
    logger.info("Ingestion", `Resumen de carrera: ${careerName}`, {
      selected: selectedCount,
      total: studentsInCareer.length,
    });
  }

  // 5. AUDIT LOG
  await supabase.from("audit_logs").insert({
    action: "UPLOAD_EXCEL",
    target_entity: "scholarship_selections",
    target_id: PERIOD_ID, // Logging the Period ID as the target
    details: { filename: FILE_NAME, timestamp: new Date() },
  });

  logger.info("Ingestion", "Proceso de ingesta completado exitosamente", {
    periodId: PERIOD_ID,
    periodName: PERIOD_NAME,
  });
}

runIngestion();
