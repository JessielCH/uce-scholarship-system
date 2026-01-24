import * as pdfjsLib from "pdfjs-dist";

// Configurar el worker desde CDN para evitar problemas de bundler en Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Lee un archivo PDF y busca patrones de cuenta bancaria.
 * @param {File} file - El archivo PDF subido por el usuario
 * @returns {Promise<string|null>} - El número de cuenta encontrado o null
 */
export const extractBankAccount = async (file) => {
  try {
    // 1. Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // 2. Cargar documento PDF
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = "";

    // 3. Leer solo la primera página (usualmente ahí está la cuenta)
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();

    // Unir todo el texto encontrado
    fullText = textContent.items.map((item) => item.str).join(" ");

    console.log("Texto extraído (Debug):", fullText);

    // 4. Buscar patrones con REGEX (Mejorado)
    // Busca: "cta", "cuenta", "ahorros", "no.", "número" seguido de 9-12 dígitos
    const accountRegex =
      /(?:cta|cuenta|ahorros|corriente|nro|número|no\.?)[\s\.:-]*(\d{9,12})/i;

    const match = fullText.match(accountRegex);

    if (match && match[1]) {
      return match[1]; // Retorna el número capturado con precisión
    }

    // Intento secundario: Buscar cualquier secuencia larga de números (Plan B)
    const fallbackRegex = /\b(\d{10,12})\b/;
    const fallbackMatch = fullText.match(fallbackRegex);

    return fallbackMatch ? fallbackMatch[1] : null;
  } catch (error) {
    console.error("Error en OCR:", error);
    return null;
  }
};
