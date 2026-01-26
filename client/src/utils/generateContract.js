import jsPDF from "jspdf";

/**
 * Generates the Scholarship Contract PDF.
 * @param {Object} student - Student data
 * @param {Object} scholarship - Scholarship and career data
 * @param {Object} period - Academic period data
 * @returns {Blob} - The generated PDF file as a Blob
 */
export const generateContractPDF = (student, scholarship, period) => {
  const doc = new jsPDF();
  const margin = 20;
  let cursorY = 20;

  // --- HEADER (Styled with Brand Blue) ---
  doc.setTextColor(15, 76, 129); // #0F4C81 (Visily Brand Blue)
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("CENTRAL UNIVERSITY OF ECUADOR", 105, cursorY, {
    align: "center",
  });
  cursorY += 10;

  doc.setFontSize(12);
  doc.text("SCHOLARSHIP ADJUDICATION CONTRACT", 105, cursorY, {
    align: "center",
  });
  cursorY += 20;

  // --- BODY ---
  doc.setTextColor(0, 0, 0); // Reset to Black
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Contract Text in English
  const text = `
    In the city of Quito, on ${today}, appearing on one part the Central University of Ecuador, and on the other part the student ${student.first_name} ${student.last_name}, holder of National ID No. ${student.national_id}.

    CLAUSE ONE: BACKGROUND
    The student is currently enrolled in the ${scholarship.careers?.name || "assigned"} career, in the ${scholarship.semester || "current"} semester, maintaining a grade point average of ${scholarship.average_grade}, thereby meeting the academic requirements for the scholarship of the ${period?.name || "current"} period.

    CLAUSE TWO: PURPOSE
    The University adjudicates the Academic Excellence Scholarship, consisting of financial support that will be deposited into the bank account No. ${scholarship.bank_account_number || "____________________"} registered by the beneficiary.

    CLAUSE THREE: COMMITMENT
    The scholar commits to maintaining their academic performance and utilizing the funds strictly for educational purposes.

    In witness whereof, the parties sign below.
  `;

  // Justify text logic
  const splitText = doc.splitTextToSize(text, 170);
  doc.text(splitText, margin, cursorY);

  cursorY += 90;

  // --- SIGNATURES ---
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);

  // Left Signature (Student)
  doc.line(margin, cursorY, 80, cursorY);

  // Right Signature (Admin)
  doc.line(130, cursorY, 190, cursorY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");

  // Student Details
  doc.text("THE SCHOLAR", 50, cursorY + 5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(`${student.first_name} ${student.last_name}`, 50, cursorY + 10, {
    align: "center",
  });
  doc.text(`ID: ${student.national_id}`, 50, cursorY + 15, {
    align: "center",
  });

  // Admin Details
  doc.setFont("helvetica", "bold");
  doc.text("STUDENT WELFARE", 160, cursorY + 5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("Director", 160, cursorY + 10, { align: "center" });

  // Return as Blob for upload or download
  return doc.output("blob");
};

/**
 * Helper function to download the PDF directly in the browser
 */
export const downloadContract = (student, scholarship, period) => {
  const blob = generateContractPDF(student, scholarship, period);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Contract_${student.national_id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
