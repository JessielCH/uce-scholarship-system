import jsPDF from 'jspdf';

/**
 * Genera el PDF del Comprobante de Pago.
 * @param {Object} student - Datos del estudiante
 * @param {Object} scholarship - Datos de la beca (monto, cuenta, etc)
 * @returns {Blob} - El archivo PDF listo para subir
 */
export const generateReceiptPDF = (student, scholarship) => {
  const doc = new jsPDF();

  // Colores corporativos (Gris y Azul UCE)
  const primaryColor = [0, 56, 118];

  // --- HEADER ---
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F'); // Barra superior azul

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("COMPROBANTE DE PAGO", 105, 20, { align: "center" });
  doc.setFontSize(10);
  doc.text("Sistema de Becas - Universidad Central del Ecuador", 105, 30, { align: "center" });

  // --- INFO TRANSACCIÓN ---
  doc.setTextColor(0, 0, 0);
  let cursorY = 60;
  const margin = 20;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, margin, cursorY);

  // Generar un ID de transacción ficticio basado en el ID de la beca
  const txId = `TX-${new Date().getFullYear()}-${scholarship.id.split('-')[0].toUpperCase()}`;
  doc.text(`Nro. Transacción: ${txId}`, 130, cursorY);

  cursorY += 15;
  doc.line(margin, cursorY, 190, cursorY); // Línea separadora
  cursorY += 15;

  // --- DETALLES DEL BENEFICIARIO ---
  doc.setFontSize(14);
  doc.text("DATOS DEL BENEFICIARIO", margin, cursorY);
  cursorY += 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Nombre: ${student.first_name} ${student.last_name}`, margin, cursorY);
  cursorY += 8;
  doc.text(`Cédula: ${student.national_id}`, margin, cursorY);
  cursorY += 8;
  doc.text(`Correo: ${student.university_email}`, margin, cursorY);
  cursorY += 8;
  doc.text(`Carrera: ${scholarship.careers?.name || 'N/A'}`, margin, cursorY);

  cursorY += 15;

  // --- DETALLES DEL PAGO ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("DETALLES DE LA TRANSFERENCIA", margin, cursorY);
  cursorY += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Institución Bancaria: BANCO PICHINCHA (Según certificado)`, margin, cursorY);
  cursorY += 8;
  doc.text(`Cuenta Destino: ${scholarship.bank_account_number}`, margin, cursorY);
  cursorY += 8;
  // Asumimos un monto fijo si no está en BD, o lo pasamos. Por ahora pondremos un placeholder
  doc.text(`Concepto: Beca de Excelencia Académica - Periodo ${scholarship.academic_periods?.name}`, margin, cursorY);

  cursorY += 20;

  // --- TOTAL ---
  doc.setFillColor(240, 240, 240); // Fondo gris claro
  doc.rect(margin, cursorY, 170, 20, 'F');

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("MONTO TRANSFERIDO:", margin + 5, cursorY + 13);
  doc.text("$ 400.00 USD", 130, cursorY + 13); // Monto ejemplo

  // --- FOOTER ---
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Este documento es un comprobante electrónico generado automáticamente.", 105, 280, { align: "center" });

  return doc.output('blob');
};