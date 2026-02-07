import React, { useState } from "react";
import { supabase } from "../../../services/supabaseClient";
import { useAuth } from "../../../context/AuthContext";
import { Check } from "lucide-react";
import ModalHeader from "../../molecules/ModalHeader";
import FileUploadZone from "../../molecules/FileUploadZone";
import Button from "../../atoms/Button";
import Alert from "../../atoms/Alert";

/**
 * ORGANISM: ContractUploadModal
 */
const ContractUploadModal = ({ selectionId, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    const maxSize = 5 * 1024 * 1024; // 5 MB

    setError(null);

    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }

    if (selectedFile.size > maxSize) {
      setError("File size must be less than 5 MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    try {
      const fileName = `${Date.now()}_signed_contract.pdf`;
      const filePath = `${user.id}/${fileName}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from("scholarship-docs")
        .upload(filePath, file);

      if (uploadError) throw new Error(uploadError.message);

      // 2. Register in 'documents' table
      const { error: docError } = await supabase.from("documents").insert({
        selection_id: selectionId,
        document_type: "CONTRACT_SIGNED",
        file_path: filePath,
        version: 1,
      });

      if (docError) throw new Error(docError.message);

      // 3. Update Scholarship Status
      const { error: statusError } = await supabase
        .from("scholarship_selections")
        .update({ status: "CONTRACT_UPLOADED" })
        .eq("id", selectionId);

      if (statusError) throw new Error(statusError.message);

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
      setError(error.message || "Error uploading contract");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl transform transition-all overflow-hidden">
        <ModalHeader title="Upload Signed Contract" onClose={onClose} />

        <div className="p-6">
          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError(null)}
              className="mb-4"
            />
          )}

          <div className="space-y-6">
            <FileUploadZone
              onFileSelect={handleFileSelect}
              accept="application/pdf"
              acceptLabel="Signed PDF"
              selectedFile={file}
              onRemoveFile={() => setFile(null)}
            />

            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpload}
                isLoading={isUploading}
                disabled={!file || isUploading}
                icon={isUploading ? null : Check}
                className="flex-1"
              >
                {isUploading ? "Uploading..." : "Upload Contract"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractUploadModal;
