import React, { useState } from "react";
import { extractBankAccount } from "../../utils/ocrLogic";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import {
  UploadCloud,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  X,
} from "lucide-react";

const BankUploadModal = ({ studentId, selectionId, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState(1);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validation
    if (selectedFile.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      return;
    }

    setFile(selectedFile);
    setIsScanning(true);

    try {
      // OCR Logic
      const detectedAccount = await extractBankAccount(selectedFile);
      if (detectedAccount) setAccountNumber(detectedAccount);
    } catch (error) {
      console.error("OCR Error", error);
    } finally {
      setIsScanning(false);
      setStep(2);
    }
  };

  const handleConfirmUpload = async () => {
    if (!accountNumber) {
      alert("Please enter a valid account number.");
      return;
    }

    setIsUploading(true);

    try {
      // CRITICAL FIX: Use user.id instead of studentId for folder security policies
      // RLS Policy: (storage.foldername(name))[1] = auth.uid()
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

      // Success Feedback
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Upload process error:", error);
      alert(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-brand-blue">
            Upload Bank Certificate
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* STEP 1: Upload & Scan */}
          {step === 1 && (
            <div className="group relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-blue-50 hover:border-brand-blue transition-all cursor-pointer">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-blue-100 text-brand-blue rounded-full group-hover:scale-110 transition-transform">
                  <UploadCloud size={32} />
                </div>
                <div>
                  <p className="text-gray-700 font-medium text-lg">
                    Click to upload PDF
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Bank certificate or statement
                  </p>
                </div>
              </div>

              {isScanning && (
                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-20 backdrop-blur-[2px]">
                  <Loader2
                    className="animate-spin text-brand-blue mb-2"
                    size={32}
                  />
                  <span className="text-sm font-semibold text-brand-blue animate-pulse">
                    Scanning document...
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Confirm */}
          {step === 2 && (
            <div className="space-y-6 animate-in-delayed">
              <div className="bg-green-50 p-4 rounded-lg flex items-start gap-3 border border-green-100">
                <FileText className="text-green-600 mt-1" size={20} />
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    File Ready
                  </p>
                  <p className="text-xs text-green-600 break-all">
                    {file?.name}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detected Account Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition-shadow font-mono text-lg"
                    placeholder="Enter account number"
                  />
                  {accountNumber && (
                    <div className="absolute right-3 top-3.5 text-green-500">
                      <Check size={18} />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Please verify that the number matches your document exactly.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  className="flex-1 py-3 px-4 bg-brand-blue text-white font-bold rounded-lg hover:bg-blue-800 transition-all shadow-md hover:shadow-lg flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={18} />{" "}
                      Uploading...
                    </>
                  ) : (
                    "Confirm & Upload"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankUploadModal;
