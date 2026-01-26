import jsPDF from "jspdf";

/**
 * Generates the Payment Receipt PDF.
 * @param {Object} student - Student data
 * @param {Object} scholarship - Scholarship data (amount, account, etc.)
 * @returns {Blob} - The PDF file ready for upload
 */
export const generateReceiptPDF = (student, scholarship) => {
  const doc = new jsPDF();

  // Corporate Colors (Visily Brand Blue: #0F4C81)
  // Converted to RGB: 15, 76, 129
  const primaryColor = [15, 76, 129];

  // --- HEADER ---
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, "F"); // Top Blue Bar

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT RECEIPT", 105, 20, { align: "center" });
  doc.setFontSize(10);
  doc.text("Scholarship System - Central University of Ecuador", 105, 30, {
    align: "center",
  });

  // --- TRANSACTION INFO ---
  doc.setTextColor(0, 0, 0);
  let cursorY = 60;
  const margin = 20;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  doc.text(`Issue Date: ${today}`, margin, cursorY);

  // Generate a fictitious Transaction ID based on Scholarship ID
  const txId = `TX-${new Date().getFullYear()}-${(scholarship.id || "GEN").split("-")[0].toUpperCase()}`;
  doc.text(`Transaction ID: ${txId}`, 130, cursorY);

  cursorY += 15;
  doc.line(margin, cursorY, 190, cursorY); // Separator Line
  cursorY += 15;

  // --- BENEFICIARY DETAILS ---
  doc.setFontSize(14);
  doc.text("BENEFICIARY DETAILS", margin, cursorY);
  cursorY += 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${student.first_name} ${student.last_name}`, margin, cursorY);
  cursorY += 8;
  doc.text(`National ID: ${student.national_id}`, margin, cursorY);
  cursorY += 8;
  doc.text(`Email: ${student.university_email}`, margin, cursorY);
  cursorY += 8;
  doc.text(`Career: ${scholarship.careers?.name || "N/A"}`, margin, cursorY);

  cursorY += 15;

  // --- PAYMENT DETAILS ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("TRANSFER DETAILS", margin, cursorY);
  cursorY += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(
    `Bank Institution: BANCO PICHINCHA (Per certificate)`,
    margin,
    cursorY,
  );
  cursorY += 8;
  doc.text(
    `Destination Account: ${scholarship.bank_account_number}`,
    margin,
    cursorY,
  );
  cursorY += 8;
  // Standard amount placeholder
  doc.text(
    `Description: Academic Excellence Scholarship - Period ${scholarship.academic_periods?.name || "Current"}`,
    margin,
    cursorY,
  );

  cursorY += 20;

  // --- TOTAL ---
  doc.setFillColor(245, 247, 250); // Light Gray Background (Matches App BG)
  doc.rect(margin, cursorY, 170, 20, "F");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 76, 129); // Brand Blue Text
  doc.text("AMOUNT TRANSFERRED:", margin + 5, cursorY + 13);
  doc.text("$ 400.00 USD", 130, cursorY + 13);

  // --- FOOTER ---
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150); // Gray text
  doc.text(
    "This document is an automatically generated electronic receipt.",
    105,
    280,
    { align: "center" },
  );

  return doc.output("blob");
};
