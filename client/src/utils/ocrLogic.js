import * as pdfjsLib from "pdfjs-dist";

// --- CORRECCIÓN CRÍTICA ---
// Usamos unpkg en lugar de cdnjs para asegurar compatibilidad con la versión instalada.
// Apuntamos a 'pdf.worker.min.mjs' (Módulo) en lugar de .js clásico.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Lee un archivo PDF y busca patrones de cuenta bancaria.
 * @param {File} file - El archivo PDF subido por el usuario
 * @returns {Promise<string|null>} - El número de cuenta encontrado o null
 */
export const extractBankAccount = async (file) => {
  try {
    console.log(`🔍 Iniciando OCR con PDF.js v${pdfjsLib.version}`);

    // 1. Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // 2. Cargar documento PDF
    // Nota: En versiones nuevas, getDocument devuelve un objeto con .promise
    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;

    let fullText = "";

    // 3. Leer la primera página (usualmente ahí está la cuenta)
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();

    // Unir todo el texto encontrado
    fullText = textContent.items.map((item) => item.str).join(" ");

    console.log("📄 Texto extraído:", fullText);

    // 4. Buscar patrones con REGEX (Mejorado)
    // Busca: "Cta", "Cuenta", "Nro", "No.", seguido de 9-12 dígitos
    const accountRegex =
      /(?:cta|cuenta|ahorros|corriente|nro|número|no\.?)[\s\.:-]*(\d{9,12})/i;

    const match = fullText.match(accountRegex);

    if (match && match[1]) {
      console.log("✅ Cuenta encontrada por Regex Estricto:", match[1]);
      return match[1];
    }

    // Intento secundario: Buscar cualquier secuencia larga de 10-12 dígitos
    // (Útil si el PDF solo dice el número sin etiqueta)
    const fallbackRegex = /\b(\d{10,12})\b/;
    const fallbackMatch = fullText.match(fallbackRegex);

    if (fallbackMatch) {
      console.log(
        "⚠️ Cuenta encontrada por Regex Secundario:",
        fallbackMatch[1],
      );
      return fallbackMatch[1];
    }

    console.warn("❌ No se detectó patrón de cuenta bancaria.");
    return null;
  } catch (error) {
    console.error("❌ Error Fatal en OCR:", error);
    // No lanzamos error para que la UI no explote, solo retornamos null
    return null;
  }
};
