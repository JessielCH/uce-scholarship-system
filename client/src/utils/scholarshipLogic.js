// client/src/utils/scholarshipLogic.js

export const processScholarshipFile = (rawData) => {
  // 1. Normalize Data (Map Excel columns to clean variables)
  // Note: Input keys match the Spanish headers from the university Excel file
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
    .filter((s) => s.university_email.includes("@uce.edu.ec")); // Filter empty or invalid rows

  // 2. Group by Career (Top 10% rule applies per career, not globally)
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

  // 3. Apply Algorithm per Career
  Object.keys(studentsByCareer).forEach((career) => {
    const group = studentsByCareer[career];

    // A. Filter Regular Students
    const regulars = group.filter(
      (s) => s.academic_condition.toLowerCase() === "regular",
    );

    // B. Sort Descending by Grade
    regulars.sort((a, b) => b.average_grade - a.average_grade);

    // C. Calculate Cutoff (Math.ceil to round up)
    const cutoffCount = Math.ceil(regulars.length * 0.1);
    const cutoffGrade =
      regulars.length > 0 && regulars[cutoffCount - 1]
        ? regulars[cutoffCount - 1].average_grade
        : 999; // If no students, logic defaults to unreachable grade

    // D. Mark Selected (Including ties)
    group.forEach((student) => {
      let isSelected = false;
      let rejectionReason = null;

      if (student.academic_condition.toLowerCase() !== "regular") {
        rejectionReason = "Academic Condition Not Regular";
      } else if (student.average_grade >= cutoffGrade) {
        isSelected = true;
      } else {
        rejectionReason = "Below Grade Cutoff";
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
