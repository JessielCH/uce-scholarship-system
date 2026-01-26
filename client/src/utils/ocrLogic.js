import * as pdfjsLib from "pdfjs-dist";

// --- CRITICAL FIX ---
// We use unpkg instead of cdnjs to ensure compatibility with the installed version.
// Pointing to 'pdf.worker.min.mjs' (Module) instead of the classic .js.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Reads a PDF file and searches for bank account number patterns.
 * @param {File} file - The PDF file uploaded by the user
 * @returns {Promise<string|null>} - The found account number or null
 */
export const extractBankAccount = async (file) => {
  try {
    console.log(`🔍 Starting OCR with PDF.js v${pdfjsLib.version}`);

    // 1. Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // 2. Load PDF Document
    // Note: In newer versions, getDocument returns an object with a .promise property
    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;

    let fullText = "";

    // 3. Read the first page (usually where the account info is located)
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();

    // Join all found text items
    fullText = textContent.items.map((item) => item.str).join(" ");

    console.log("📄 Extracted Text:", fullText);

    // 4. Search patterns with REGEX (Enhanced)
    // Looks for: "Acct", "Account", "No.", "Cta", "Cuenta" followed by 9-12 digits.
    // We keep Spanish terms because the bank document might be local.
    const accountRegex =
      /(?:cta|cuenta|ahorros|corriente|nro|número|no\.?|acct|account|savings|current|number)[\s\.:-]*(\d{9,12})/i;

    const match = fullText.match(accountRegex);

    if (match && match[1]) {
      console.log("✅ Account found via Strict Regex:", match[1]);
      return match[1];
    }

    // Secondary Attempt: Look for any long sequence of 10-12 digits
    // (Useful if the PDF lists the number without a clear label)
    const fallbackRegex = /\b(\d{10,12})\b/;
    const fallbackMatch = fullText.match(fallbackRegex);

    if (fallbackMatch) {
      console.log("⚠️ Account found via Secondary Regex:", fallbackMatch[1]);
      return fallbackMatch[1];
    }

    console.warn("❌ No bank account pattern detected.");
    return null;
  } catch (error) {
    console.error("❌ Fatal OCR Error:", error);
    // Do not throw error to prevent UI crash, just return null
    return null;
  }
};
