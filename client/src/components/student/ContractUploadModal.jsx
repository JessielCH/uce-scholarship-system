import React, { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { UploadCloud, FileText, Loader2, Check } from "lucide-react";

const ContractUploadModal = ({ selectionId, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      alert("Solo se permiten archivos PDF");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);

    try {
      const fileName = `${Date.now()}_contrato_firmado.pdf`;
      const filePath = `${user.id}/${fileName}`;

      // 1. Subir al Storage
      const { error: uploadError } = await supabase.storage
        .from("scholarship-docs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Registrar en tabla documents
      const { error: docError } = await supabase.from("documents").insert({
        selection_id: selectionId,
        document_type: "CONTRACT_SIGNED", // Tipo específico para contrato
        file_path: filePath,
        version: 1,
      });

      if (docError) throw docError;

      // 3. Actualizar Estado de la Beca
      // Pasa a CONTRACT_UPLOADED para que el Staff lo revise
      const { error: statusError } = await supabase
        .from("scholarship_selections")
        .update({ status: "CONTRACT_UPLOADED" })
        .eq("id", selectionId);

      if (statusError) throw statusError;

      // 4. Audit Log
      await supabase.from("audit_logs").insert({
        action: "UPLOAD_CONTRACT",
        target_entity: "scholarship_selections",
        target_id: selectionId,
        details: { filename: fileName },
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al subir contrato: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Subir Contrato Firmado
        </h2>

        {!file ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 relative">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <UploadCloud className="mx-auto h-12 w-12 text-primary-400 mb-2" />
            <p className="text-gray-600 font-medium">Seleccionar PDF Firmado</p>
            <p className="text-xs text-gray-400 mt-2">
              Asegúrate de que la firma sea visible.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md">
              <FileText className="text-blue-600" />
              <span className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setFile(null)}
                className="flex-1 py-2 border rounded text-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 py-2 bg-primary-900 text-white rounded flex justify-center items-center gap-2 hover:bg-primary-800"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Check size={18} /> Subir Contrato
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractUploadModal;
