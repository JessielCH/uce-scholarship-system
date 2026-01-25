import React, { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { UploadCloud, FileText, Loader2, Check, X } from "lucide-react";

const ContractUploadModal = ({ selectionId, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      alert("Only PDF files are allowed.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);

    try {
      // Use standard naming convention
      const fileName = `${Date.now()}_signed_contract.pdf`;
      // CRITICAL: Maintain user folder structure for RLS policies
      const filePath = `${user.id}/${fileName}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from("scholarship-docs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Register in 'documents' table
      const { error: docError } = await supabase.from("documents").insert({
        selection_id: selectionId,
        document_type: "CONTRACT_SIGNED",
        file_path: filePath,
        version: 1,
      });

      if (docError) throw docError;

      // 3. Update Scholarship Status
      // Transitions to CONTRACT_UPLOADED for Staff review
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
      alert("Error uploading contract: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl transform transition-all">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-brand-blue">
            Upload Signed Contract
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {!file ? (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:bg-blue-50 hover:border-brand-blue transition-all relative group cursor-pointer">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="bg-blue-100 p-4 rounded-full inline-flex mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="h-8 w-8 text-brand-blue" />
            </div>
            <p className="text-gray-700 font-semibold text-lg">
              Select Signed PDF
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Ensure your signature is clearly visible.
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-in-delayed">
            <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="bg-white p-2 rounded shadow-sm">
                <FileText className="text-brand-blue" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 py-3 bg-brand-blue text-white rounded-lg font-bold shadow-md hover:bg-blue-800 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Uploading...
                  </>
                ) : (
                  <>
                    <Check size={20} /> Upload Contract
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
