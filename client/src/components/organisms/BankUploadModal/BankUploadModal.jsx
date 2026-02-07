import React, { useState } from "react";
import { extractBankAccount } from "../../../utils/ocrLogic";
import { supabase } from "../../../services/supabaseClient";
import { useAuth } from "../../../context/AuthContext";
import { logger } from "../../../utils/logger";
import { Check, Loader2 } from "lucide-react";
import ModalHeader from "../../molecules/ModalHeader";
import FileUploadZone from "../../molecules/FileUploadZone";
import Button from "../../atoms/Button";
import Alert from "../../atoms/Alert";

/**
 * ORGANISM: BankUploadModal
 */
const BankUploadModal = ({ studentId, selectionId, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setError(null);

    // Validation
    if (selectedFile.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }

    setFile(selectedFile);
    setIsScanning(true);

    try {
      const detectedAccount = await extractBankAccount(selectedFile);
      if (detectedAccount) setAccountNumber(detectedAccount);
    } catch (error) {
      console.error("OCR Error", error);
      setError("Error scanning document. Please enter account manually.");
    } finally {
      setIsScanning(false);
      setStep(2);
    }
  };

  const handleConfirmUpload = async () => {
    if (!accountNumber) {
      setError("Please enter a valid account number.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const fileName = `${Date.now()}_certificate.pdf`;
      const filePath = `${user.id}/${fileName}`;

      // 1. Upload to Storage
      const { data, error: uploadError } = await supabase.storage
        .from("scholarship-docs")
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // 2. Register in Database
      const { error: docError } = await supabase.from("documents").insert({
        selection_id: selectionId,
        document_type: "BANK_CERT",
        file_path: filePath,
        version: 1,
      });

      if (docError) {
        throw new Error(`Database reference failed: ${docError.message}`);
      }

      // 3. Update Scholarship Status
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

      onSuccess();
      onClose();
    } catch (error) {
      logger.error("BankUploadModal", "Error en upload", error, {
        fileName: file?.name,
        selectionId,
      });
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
        <ModalHeader title="Upload Bank Certificate" onClose={onClose} />

        <div className="p-6">
          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError(null)}
              className="mb-4"
            />
          )}

          {/* STEP 1: Upload & Scan */}
          {step === 1 && (
            <div className="space-y-4">
              <FileUploadZone
                onFileSelect={handleFileSelect}
                accept="application/pdf"
                acceptLabel="PDF"
                isScanning={isScanning}
              />
            </div>
          )}

          {/* STEP 2: Confirm Account Number */}
          {step === 2 && (
            <div className="space-y-6 animate-in-delayed">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter account number if not auto-detected"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep(1);
                    setFile(null);
                    setAccountNumber("");
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmUpload}
                  isLoading={isUploading}
                  icon={isUploading ? null : Check}
                  className="flex-1"
                >
                  {isUploading ? "Uploading..." : "Confirm & Upload"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankUploadModal;
