import jsPDF from "jspdf";

/**
 * Genera el PDF del Contrato de Beca.
 * @param {Object} student - Datos del estudiante
 * @param {Object} scholarship - Datos de la beca y carrera
 * @param {Object} period - Datos del periodo académico
 * @returns {Blob} - El archivo PDF generado
 */
export const generateContractPDF = (student, scholarship, period) => {
  const doc = new jsPDF();
  const margin = 20;
  let cursorY = 20;

  // --- HEADER ---
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("UNIVERSIDAD CENTRAL DEL ECUADOR", 105, cursorY, {
    align: "center",
  });
  cursorY += 10;

  doc.setFontSize(12);
  doc.text("CONTRATO DE ADJUDICACIÓN DE BECA", 105, cursorY, {
    align: "center",
  });
  cursorY += 20;

  // --- CUERPO ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const today = new Date().toLocaleDateString("es-EC", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const text = `
    En la ciudad de Quito, a los ${today}, comparecen por una parte la Universidad Central del Ecuador, y por otra parte el/la estudiante ${student.first_name} ${student.last_name}, portador de la cédula de identidad Nro. ${student.national_id}.

    CLÁUSULA PRIMERA: ANTECEDENTES
    El estudiante se encuentra matriculado en la carrera de ${scholarship.careers?.name || "su carrera"}, en el ${scholarship.semester} semestre, con un promedio de ${scholarship.average_grade}, cumpliendo con los requisitos académicos para la beca del periodo ${period?.name || "actual"}.

    CLÁUSULA SEGUNDA: OBJETO
    La Universidad adjudica la Beca de Excelencia Académica, consistente en un apoyo económico que será depositado en la cuenta bancaria Nro. ${scholarship.bank_account_number || "______________"} registrada por el beneficiario.

    CLÁUSULA TERCERA: COMPROMISO
    El becario se compromete a mantener su rendimiento académico y destinar los fondos a fines educativos.

    Para constancia, firman las partes.
  `;

  // Función para justificar texto manualmente o usando splitTextToSize
  const splitText = doc.splitTextToSize(text, 170);
  doc.text(splitText, margin, cursorY);

  cursorY += 80;

  // --- FIRMAS ---
  doc.line(margin, cursorY, 80, cursorY); // Línea Izq
  doc.line(130, cursorY, 190, cursorY); // Línea Der

  doc.setFontSize(10);
  doc.text("EL BECARIO", 50, cursorY + 5, { align: "center" });
  doc.text(`${student.first_name} ${student.last_name}`, 50, cursorY + 10, {
    align: "center",
  });
  doc.text(`C.I: ${student.national_id}`, 50, cursorY + 15, {
    align: "center",
  });

  doc.text("BIENESTAR ESTUDIANTIL", 160, cursorY + 5, { align: "center" });
  doc.text("Director(a)", 160, cursorY + 10, { align: "center" });

  // Retornar como Blob para descarga o subida
  return doc.output("blob");
};

/**
 * Función auxiliar para descargar el PDF directamente en el navegador
 */
export const downloadContract = (student, scholarship, period) => {
  const blob = generateContractPDF(student, scholarship, period);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Contrato_Beca_${student.national_id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
