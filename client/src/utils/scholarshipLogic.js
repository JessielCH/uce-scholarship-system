// client/src/utils/scholarshipLogic.js
import { logger } from "./logger";

export const processScholarshipFile = (rawData) => {
  logger.info("ScholarshipLogic", "Starting algorithm execution", {
    rowCount: rawData.length,
  });

  // 1. Normalize Data (Map Excel columns to clean variables)
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
    .filter((s) => {
      const isValid = s.university_email.includes("@uce.edu.ec");
      if (!isValid && s.university_email) {
        logger.warn("ScholarshipLogic", "Email discarded (not institutional)", {
          email: s.university_email,
        });
      }
      return isValid;
    });

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

  logger.debug("ScholarshipLogic", "Careers detected", {
    count: stats.careers,
  });

  // 3. Apply Algorithm per Career
  Object.keys(studentsByCareer).forEach((career) => {
    const group = studentsByCareer[career];

    logger.info("ScholarshipLogic", `Processing career: ${career}`, {
      totalStudents: group.length,
    });

    // A. Filter Regular Students
    const regulars = group.filter(
      (s) => s.academic_condition.toLowerCase() === "regular",
    );
    logger.debug("ScholarshipLogic", "Regular students", {
      count: regulars.length,
    });

    // B. Sort Descending by Grade
    regulars.sort((a, b) => b.average_grade - a.average_grade);

    // C. Calculate Cutoff (Math.ceil to round up)
    const cutoffCount = Math.ceil(regulars.length * 0.1);
    const cutoffGrade =
      regulars.length > 0 && regulars[cutoffCount - 1]
        ? regulars[cutoffCount - 1].average_grade
        : 999;

    logger.debug("ScholarshipLogic", "Cutoff calculation", {
      targetCount: cutoffCount,
      cutoffGrade,
    });

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

      if (isSelected) {
        stats.selected++;
        logger.debug("ScholarshipLogic", "Student selected", {
          name: `${student.first_name} ${student.last_name}`,
          grade: student.average_grade,
        });
      }
      stats.total++;

      finalList.push({
        ...student,
        is_selected: isSelected,
        rejection_reason: rejectionReason,
        cutoff_used: cutoffGrade,
      });
    });
  });

  logger.info("ScholarshipLogic", "Process summary", {
    totalProcessed: stats.total,
    totalSelected: stats.selected,
    selectionRate: `${((stats.selected / stats.total) * 100).toFixed(2)}%`,
  });

  return { processedData: finalList, stats };
};
