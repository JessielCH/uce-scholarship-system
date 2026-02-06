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
      academic_condition: row["Condicion"] || "Regular", // Regular / No Regular (default: Regular)
    };

    const key = `${faculty}:::${career}`;
    if (!studentsByCareer[key]) studentsByCareer[key] = [];
    studentsByCareer[key].push(studentObj);
  });

  // Debug: Log primeros 3 estudiantes para verificar estructura
  logger.debug("Ingestion", "Primeros estudiantes cargados:", {
    sample: Object.values(studentsByCareer)[0]?.slice(0, 3),
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

    // Debug: Show selection results
    const selectedStudents = processedStudents.filter((s) => s.is_selected);
    logger.debug("Ingestion", `Resultados de selección para ${careerName}`, {
      totalProcessed: processedStudents.length,
      selected: selectedStudents.length,
      excluded: processedStudents.length - selectedStudents.length,
      topGrades: selectedStudents.slice(0, 3).map((s) => ({
        name: s.first_name,
        grade: s.average_grade,
      })),
    });

    // C. Database Operations (Atomic per student usually, but lets batch for speed)
    let selectedCount = 0;

    for (const student of processedStudents) {
      // C.1 Check if student exists by email
      const { data: existingStudent, error: checkError } = await supabase
        .from("students")
        .select("id, university_email, first_name, last_name, national_id")
        .eq("university_email", student.university_email)
        .maybeSingle();

      let studentDB = existingStudent;
      let stuError = null;

      // Only insert if student doesn't exist - NEVER UPDATE
      if (!existingStudent) {
        const { data, error } = await supabase
          .from("students")
          .insert({
            national_id: String(student.national_id),
            university_email: student.university_email,
            first_name: student.first_name,
            last_name: student.last_name,
          })
          .select()
          .single();
        studentDB = data;
        stuError = error;

        if (stuError) {
          // Handle duplicate key error (race condition)
          if (stuError.code === "23505" || stuError.message?.includes("duplicate key")) {
            logger.warn("Ingestion", `Email duplicado detectado (race condition), buscando estudiante`, {
              email: student.university_email,
            });

            const { data: duplicateStudent } = await supabase
              .from("students")
              .select("id")
              .eq("university_email", student.university_email)
              .maybeSingle();

            if (duplicateStudent) {
              studentDB = duplicateStudent;
              stuError = null;
            } else {
              logger.error("Ingestion", `No se pudo resolver email duplicado`, stuError, {
                email: student.university_email,
              });
              continue;
            }
          } else {
            logger.error("Ingestion", `Error insertando estudiante`, stuError, {
              email: student.university_email,
            });
            continue;
          }
        } else {
          logger.debug("Ingestion", `Estudiante nuevo creado`, {
            email: student.university_email,
            id: studentDB.id,
          });
        }
      } else {
        logger.debug("Ingestion", `Estudiante existente reutilizado`, {
          email: student.university_email,
          id: existingStudent.id,
        });
      }

      // C.2 Create Scholarship Selection for ALL students (selected or excluded)
      // This allows the system to track all students' status (SELECTED vs EXCLUDED)
      const scholarshipStatus = student.is_selected ? "SELECTED" : "EXCLUDED";

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
            status: scholarshipStatus, // SELECTED or EXCLUDED
          },
          { onConflict: "student_id, period_id" },
        ); // Prevent duplicates

      if (!selError && student.is_selected) selectedCount++;
      else if (selError)
        logger.error("Ingestion", "Error creando selección", selError, {
          studentId: studentDB.id,
          carreerId: carData.id,
        });
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
