import * as pdfjsLib from "pdfjs-dist";
import { logger } from "./logger";

// --- CRITICAL FIX ---
// Uses unpkg to ensure compatibility with installed version.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Reads a PDF file and searches for bank account number patterns.
 * @param {File} file - The PDF file uploaded by the user.
 * @returns {Promise<string|null>} - The detected account number or null.
 */
export const extractBankAccount = async (file) => {
  logger.info("OCRLogic", "Starting bank account extraction (OCR)", {
    fileName: file.name,
    fileSizeKB: (file.size / 1024).toFixed(2),
  });

  try {
    logger.debug("OCRLogic", `Motor PDF.js v${pdfjsLib.version}`);

    // 1. Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // 2. Load PDF document
    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;
    logger.debug("OCRLogic", "Pages detected in PDF", {
      pageCount: pdf.numPages,
    });

    let fullText = "";

    // 3. Read the first page (where main information is usually located)
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();

    // Join all text fragments found
    fullText = textContent.items.map((item) => item.str).join(" ");

    // Log extracted text for audit
    logger.debug("OCRLogic", "Text extracted from PDF", {
      textLength: fullText.length,
    });

    // 4. Search with Strict REGEX
    // Search for: "Cta", "Cuenta", "Acct", etc., followed by 9 to 12 digits.
    const accountRegex =
      /(?:cta|cuenta|ahorros|corriente|nro|número|no\.?|acct|account|savings|current|number)[\s\.:-]*(\d{9,12})/i;

    const match = fullText.match(accountRegex);

    if (match && match[1]) {
      logger.info("OCRLogic", "Account number detected (strict search)", {
        accountNumber: match[1],
      });
      return match[1];
    }

    // 5. Secondary attempt: Any long sequence of 10-12 digits
    logger.debug("OCRLogic", "Trying long sequence search");
    const fallbackRegex = /\b(\d{10,12})\b/;
    const fallbackMatch = fullText.match(fallbackRegex);

    if (fallbackMatch) {
      logger.info("OCRLogic", "Account number detected (flexible search)", {
        accountNumber: fallbackMatch[1],
      });
      return fallbackMatch[1];
    }

    logger.warn(
      "OCRLogic",
      "No valid account number detected in the document",
      { textLength: fullText.length },
    );
    return null;
  } catch (error) {
    logger.error("OCRLogic", "Fatal error in OCR process", error, {
      fileName: file.name,
    });
    return null;
  }
};
