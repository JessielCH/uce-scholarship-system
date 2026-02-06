import * as pdfjsLib from "pdfjs-dist";
import { logger } from "./logger";

// --- CRITICAL FIX ---
// Se utiliza unpkg para asegurar compatibilidad con la versión instalada.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Lee un archivo PDF y busca patrones de números de cuenta bancaria.
 * @param {File} file - El archivo PDF subido por el usuario.
 * @returns {Promise<string|null>} - El número de cuenta encontrado o null.
 */
export const extractBankAccount = async (file) => {
  logger.info("OCRLogic", "Iniciando extracción de cuenta bancaria (OCR)", {
    fileName: file.name,
    fileSizeKB: (file.size / 1024).toFixed(2),
  });

  try {
    logger.debug("OCRLogic", `Motor PDF.js v${pdfjsLib.version}`);

    // 1. Convertir archivo a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // 2. Cargar documento PDF
    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;
    logger.debug("OCRLogic", "Páginas detectadas en PDF", {
      pageCount: pdf.numPages,
    });

    let fullText = "";

    // 3. Leer la primera página (donde suele estar la información principal)
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();

    // Unir todos los fragmentos de texto encontrados
    fullText = textContent.items.map((item) => item.str).join(" ");

    // Log de texto extraído para auditoría
    logger.debug("OCRLogic", "Texto extraído del PDF", {
      textLength: fullText.length,
    });

    // 4. Búsqueda con REGEX Estricto
    // Busca: "Cta", "Cuenta", "Acct", etc., seguido de 9 a 12 dígitos.
    const accountRegex =
      /(?:cta|cuenta|ahorros|corriente|nro|número|no\.?|acct|account|savings|current|number)[\s\.:-]*(\d{9,12})/i;

    const match = fullText.match(accountRegex);

    if (match && match[1]) {
      logger.info(
        "OCRLogic",
        "Número de cuenta detectado (búsqueda estricta)",
        {
          accountNumber: match[1],
        },
      );
      return match[1];
    }

    // 5. Intento Secundario: Cualquier secuencia larga de 10-12 dígitos
    logger.debug("OCRLogic", "Probando búsqueda de secuencias largas");
    const fallbackRegex = /\b(\d{10,12})\b/;
    const fallbackMatch = fullText.match(fallbackRegex);

    if (fallbackMatch) {
      logger.info(
        "OCRLogic",
        "Número de cuenta detectado (búsqueda flexible)",
        {
          accountNumber: fallbackMatch[1],
        },
      );
      return fallbackMatch[1];
    }

    logger.warn(
      "OCRLogic",
      "No se detectó ningún número de cuenta válido en el documento",
      { textLength: fullText.length },
    );
    return null;
  } catch (error) {
    logger.error("OCRLogic", "Error fatal en proceso OCR", error, {
      fileName: file.name,
    });
    return null;
  }
};
