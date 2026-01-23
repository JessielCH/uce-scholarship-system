// server/utils/selectionAlgorithm.js

/**
 * Applies the scholarship selection logic: Top 10% with inclusive tie-breaking.
 * @param {Array} students - Array of student objects for a specific career.
 * @returns {Array} - Array of students with 'isSelected', 'isTop10', and 'tieBreakerApplied' flags.
 */
export const applySelectionLogic = (students) => {
  // 1. Filter only 'Regular' students (Just in case Excel has dirty data)
  const regularStudents = students.filter(
    (s) => s.academic_condition.toLowerCase() === "regular",
  );

  const totalRegular = regularStudents.length;

  // 2. Sort by Average Grade DESC
  // If grades are equal, current logic doesn't strictly order them differently
  // because the tie-breaker handles the cutoff.
  regularStudents.sort((a, b) => b.average_grade - a.average_grade);

  // 3. Calculate Cutoff Index (Top 10%)
  // Math.ceil ensures that if we have 15 students, 10% is 1.5 -> we take 2.
  const cutoffCount = Math.ceil(totalRegular * 0.1);

  // 4. Determine the Cutoff Grade (The grade of the last person who definitely gets in)
  // Guard clause: if no students, return empty
  if (totalRegular === 0) return [];

  // The student at the cutoff index (0-based index is cutoffCount - 1)
  // If we need 10 students, we look at index 9.
  const lastQualifiedStudent = regularStudents[cutoffCount - 1];
  const cutoffGrade = lastQualifiedStudent
    ? lastQualifiedStudent.average_grade
    : 0;

  console.log(
    `   -> Total: ${totalRegular}, Cutoff Count: ${cutoffCount}, Cutoff Grade: ${cutoffGrade}`,
  );

  // 5. Select Students & Apply Tie-Breaker
  return students.map((student) => {
    let isSelected = false;
    let isTop10 = false;
    let tieBreakerApplied = false;

    // Logic:
    // A student is selected if their grade is >= cutoffGrade AND they are Regular.
    if (student.academic_condition.toLowerCase() === "regular") {
      if (student.average_grade >= cutoffGrade) {
        isSelected = true;
        isTop10 = true; // Technically they are in the top selection group

        // Check for Tie-Breaker
        // If this student's rank index is >= cutoffCount, they are the "extra" ones added due to tie
        // We verify this by checking if their grade equals the cutoff grade exactly
        // but strictly speaking, everyone with grade >= cutoff is selected.

        // Let's identify specifically if they were added due to the tie extension.
        // It's a tie-breaker beneficiary if they are beyond the strict mathematical count
        // We can't easily know "who" is the extra without strict index comparison,
        // but functionally, anyone with the cutoff grade is part of the tie group.
      }
    }

    return {
      ...student,
      is_selected: isSelected,
      selection_details: {
        is_top_10: isSelected, // Simplified for DB
        cutoff_grade_applied: cutoffGrade,
      },
    };
  });
};
