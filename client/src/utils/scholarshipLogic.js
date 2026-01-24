// client/src/utils/scholarshipLogic.js

export const processScholarshipFile = (rawData) => {
  // 1. Normalizar Datos (Mapear columnas del Excel a variables limpias)
  const students = rawData
    .map((row) => ({
      national_id: String(row["Cedula"] || ""),
      first_name: row["Nombres"] || "",
      last_name: row["Apellidos"] || "",
      university_email: row["Correo"] || "",
      faculty: row["Facultad"] || "Unknown",
      career: row["Carrera"] || "Unknown",
      semester: parseInt(row["Semestre"] || 0),
      average_grade: parseFloat(row["Promedio"] || 0),
      academic_condition: row["Condicion"] || "Regular",
    }))
    .filter((s) => s.university_email.includes("@uce.edu.ec")); // Filtrar filas vacías o inválidas

  // 2. Agrupar por Carrera (El Top 10% es por carrera, no global)
  const studentsByCareer = {};
  students.forEach((s) => {
    if (!studentsByCareer[s.career]) studentsByCareer[s.career] = [];
    studentsByCareer[s.career].push(s);
  });

  let finalList = [];
  let stats = {
    total: 0,
    selected: 0,
    careers: Object.keys(studentsByCareer).length,
  };

  // 3. Aplicar Algoritmo por cada Carrera
  Object.keys(studentsByCareer).forEach((career) => {
    const group = studentsByCareer[career];

    // A. Filtrar Regulares
    const regulars = group.filter(
      (s) => s.academic_condition.toLowerCase() === "regular",
    );

    // B. Ordenar Descendente
    regulars.sort((a, b) => b.average_grade - a.average_grade);

    // C. Calcular Corte (Math.ceil para redondear hacia arriba)
    const cutoffCount = Math.ceil(regulars.length * 0.1);
    const cutoffGrade =
      regulars.length > 0 && regulars[cutoffCount - 1]
        ? regulars[cutoffCount - 1].average_grade
        : 999; // Si no hay alumnos, nadie entra

    // D. Marcar Seleccionados (Incluyendo empates)
    group.forEach((student) => {
      let isSelected = false;
      let rejectionReason = null;

      if (student.academic_condition.toLowerCase() !== "regular") {
        rejectionReason = "No Regular";
      } else if (student.average_grade >= cutoffGrade) {
        isSelected = true;
      } else {
        rejectionReason = "Promedio insuficiente";
      }

      if (isSelected) stats.selected++;
      stats.total++;

      finalList.push({
        ...student,
        is_selected: isSelected,
        rejection_reason: rejectionReason,
        cutoff_used: cutoffGrade,
      });
    });
  });

  return { processedData: finalList, stats };
};
