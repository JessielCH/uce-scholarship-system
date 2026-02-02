import * as pdfjsLib from "pdfjs-dist";

// --- CRITICAL FIX ---
// Se utiliza unpkg para asegurar compatibilidad con la versión instalada.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Lee un archivo PDF y busca patrones de números de cuenta bancaria.
 * @param {File} file - El archivo PDF subido por el usuario.
 * @returns {Promise<string|null>} - El número de cuenta encontrado o null.
 */
export const extractBankAccount = async (file) => {
  console.group("🔍 [AUDIT LOG] Proceso OCR: Certificado Bancario");
  console.log(`Archivo: ${file.name}`);
  console.log(`Tamaño: ${(file.size / 1024).toFixed(2)} KB`);

  try {
    console.log(`Iniciando motor PDF.js v${pdfjsLib.version}`);

    // 1. Convertir archivo a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // 2. Cargar documento PDF
    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;
    console.log(`Páginas detectadas: ${pdf.numPages}`);

    let fullText = "";

    // 3. Leer la primera página (donde suele estar la información principal)
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();

    // Unir todos los fragmentos de texto encontrados
    fullText = textContent.items.map((item) => item.str).join(" ");

    // LOG DEL TEXTO EXTRAÍDO (Clave para auditoría técnica)
    console.groupCollapsed("📄 Texto Bruto Extraído (OCR Raw Text)");
    console.log(fullText);
    console.groupEnd();

    // 4. Búsqueda con REGEX Estricto
    // Busca: "Cta", "Cuenta", "Acct", etc., seguido de 9 a 12 dígitos.
    const accountRegex =
      /(?:cta|cuenta|ahorros|corriente|nro|número|no\.?|acct|account|savings|current|number)[\s\.:-]*(\d{9,12})/i;

    const match = fullText.match(accountRegex);

    if (match && match[1]) {
      console.log(`✅ [AUDIT] Cuenta encontrada (Regex Estricto): ${match[1]}`);
      console.groupEnd();
      return match[1];
    }

    // 5. Intento Secundario: Cualquier secuencia larga de 10-12 dígitos
    // Útil si el PDF no tiene etiquetas claras como "Cuenta: XXXXXX"
    console.log(
      "⚠️ No se halló patrón con etiquetas. Probando búsqueda de secuencias largas...",
    );
    const fallbackRegex = /\b(\d{10,12})\b/;
    const fallbackMatch = fullText.match(fallbackRegex);

    if (fallbackMatch) {
      console.log(
        `✅ [AUDIT] Cuenta encontrada (Secuencia numérica): ${fallbackMatch[1]}`,
      );
      console.groupEnd();
      return fallbackMatch[1];
    }

    console.warn(
      "❌ [AUDIT] No se detectó ningún número de cuenta válido en el documento.",
    );
    console.groupEnd();
    return null;
  } catch (error) {
    console.error("❌ [AUDIT LOG] Error fatal en proceso OCR:", error);
    console.groupEnd();
    // No lanzamos el error para no romper la UI, solo retornamos null
    return null;
  }
};
