import React, { useState } from "react";
import { extractBankAccount } from "../../utils/ocrLogic";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../context/AuthContext"; // <--- IMPORTAR ESTO
import {
  UploadCloud,
  Check,
  AlertCircle,
  Loader2,
  FileText,
} from "lucide-react";

const BankUploadModal = ({ studentId, selectionId, onClose, onSuccess }) => {
  const { user } = useAuth(); // <--- OBTENER USUARIO ACTUAL
  const [file, setFile] = useState(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState(1);

  // ... (handleFileSelect se mantiene igual) ...
  const handleFileSelect = async (e) => {
    // ... mismo código de antes ...
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf") {
      alert("Solo se permiten archivos PDF");
      return;
    }
    setFile(selectedFile);
    setIsScanning(true);
    const detectedAccount = await extractBankAccount(selectedFile);
    if (detectedAccount) setAccountNumber(detectedAccount);
    setIsScanning(false);
    setStep(2);
  };

  const handleConfirmUpload = async () => {
    if (!accountNumber) {
      alert("Por favor ingresa un número de cuenta válido");
      return;
    }

    setIsUploading(true);
    console.log("Iniciando subida..."); // Debug

    try {
      // CORRECCIÓN CRÍTICA: Usar user.id en lugar de studentId para la carpeta
      // Esto satisface la política RLS: (storage.foldername(name))[1] = auth.uid()
      const fileName = `${Date.now()}_certificado.pdf`;
      const filePath = `${user.id}/${fileName}`;

      console.log("Subiendo a:", filePath); // Debug

      // 1. Subir a Storage
      const { data, error: uploadError } = await supabase.storage
        .from("scholarship-docs")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error Storage:", uploadError);
        throw new Error(`Error subiendo archivo: ${uploadError.message}`);
      }

      // 2. Registrar en BD
      // Ojo: Obtenemos la URL pública o path para referencia
      const { error: docError } = await supabase.from("documents").insert({
        selection_id: selectionId,
        document_type: "BANK_CERT",
        file_path: filePath,
        version: 1,
      });

      if (docError) {
        console.error("Error BD Document:", docError);
        throw new Error(`Error guardando referencia: ${docError.message}`);
      }

      // 3. Actualizar Estado Beca
      const { error: updateError } = await supabase
        .from("scholarship_selections")
        .update({
          status: "DOCS_UPLOADED",
          bank_account_number: accountNumber,
        })
        .eq("id", selectionId);

      if (updateError) throw updateError;

      // 4. Audit Log
      await supabase.from("audit_logs").insert({
        action: "UPLOAD_DOC",
        target_entity: "scholarship_selections",
        target_id: selectionId,
        details: { file: fileName, detected_account: accountNumber },
      });

      alert("¡Documento subido correctamente!"); // Feedback explícito
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Catch Error:", error);
      alert(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ... (El return del render se mantiene igual) ...
  return (
    // ... tu código JSX anterior ...
    // Asegúrate de usar el código JSX que ya tenías
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* ... contenido del modal ... */}
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        {/* RENDERIZADO CONDICIONAL DE PASOS (Igual que antes) */}
        {step === 1 && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 relative">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <UploadCloud className="mx-auto h-12 w-12 text-primary-400 mb-2" />
            <p className="text-gray-600 font-medium">
              Toca para seleccionar PDF
            </p>
            {isScanning && (
              <div className="mt-4 text-primary-600 flex justify-center items-center gap-2">
                <Loader2 className="animate-spin" /> Escaneando...
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="font-bold text-gray-800">Confirmar Datos</p>
            <div>
              <label className="block text-sm text-gray-600">
                Cuenta Detectada:
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2 border rounded"
              >
                Atrás
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={isUploading}
                className="flex-1 py-2 bg-primary-600 text-white rounded flex justify-center"
              >
                {isUploading ? <Loader2 className="animate-spin" /> : "Subir"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankUploadModal;
