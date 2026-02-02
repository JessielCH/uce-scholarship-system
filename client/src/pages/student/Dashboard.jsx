import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Timeline } from "../../components/ui/Timeline";
import BankUploadModal from "../../components/student/BankUploadModal";
import ContractUploadModal from "../../components/student/ContractUploadModal";
import { downloadContract } from "../../utils/generateContract";

import {
  AlertTriangle,
  FileText,
  UploadCloud,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCcw,
  FileSignature,
  Download,
  LogOut,
  User,
} from "lucide-react";

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  // 1. QUERY: Obtener datos del estudiante y su beca
  const {
    data,
    isLoading: queryLoading,
    refetch,
  } = useQuery({
    queryKey: ["student-dashboard", user?.id],
    queryFn: async () => {
      // a. Fetch Student Profile
      const { data: student, error: stuError } = await supabase
        .from("students")
        .select("*")
        .eq("university_email", user.email)
        .single();

      if (stuError) throw stuError;

      // b. Fetch Active Scholarship Selection
      const { data: selection, error: selError } = await supabase
        .from("scholarship_selections")
        .select("*, academic_periods(name), careers(name), documents(*)")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // LOG DE AUDITORÍA EN CONSOLA
      console.group("🎓 [AUDIT LOG] Acceso Estudiante");
      console.log(`Usuario: ${user.email}`);
      console.log(`Estado Beca: ${selection?.status || "SIN REGISTRO"}`);
      console.log(`Timestamp: ${new Date().toLocaleString()}`);
      console.groupEnd();

      return { student, scholarship: selection };
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 1000 * 60 * 5,
  });

  const studentData = data?.student;
  const scholarship = data?.scholarship;
  const loading = authLoading || queryLoading;

  // Function to download payment receipt
  const downloadReceipt = async (docs) => {
    const receipt = docs?.find((d) => d.document_type === "PAYMENT_RECEIPT");
    if (!receipt) return alert("Receipt not found.");

    try {
      console.log(
        `📂 [AUDIT LOG] Estudiante descargando recibo: ${receipt.file_path}`,
      );
      const { data: urlData, error } = await supabase.storage
        .from("scholarship-docs")
        .createSignedUrl(receipt.file_path, 60);
      if (error) throw error;
      window.open(urlData.signedUrl, "_blank");
    } catch (e) {
      console.error("❌ Error descargando recibo:", e);
      alert("Error downloading receipt.");
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-brand-blue h-10 w-10" />
        <span className="ml-3 text-brand-blue font-medium">
          Loading Dashboard...
        </span>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 font-sans animate-fade-in">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-brand-blue rounded-lg p-1">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 14l9-5-9-5-9 5 9 5z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  ></path>
                </svg>
              </div>
              <span className="text-xl font-bold text-brand-blue tracking-tight">
                Scholarship Portal
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <User size={16} className="text-gray-400" />
                {studentData?.first_name} {studentData?.last_name}
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-red font-medium transition-colors"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-blue">
              Student Dashboard
            </h1>
            <p className="mt-2 text-gray-500 flex items-center gap-2">
              Academic Period:{" "}
              <span className="font-semibold bg-blue-50 text-brand-blue px-2 py-0.5 rounded border border-blue-100">
                {scholarship?.academic_periods?.name || "N/A"}
              </span>
            </p>
          </div>
        </div>

        {scholarship ? (
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
            <div className="px-6 py-8">
              {(scholarship.status?.toUpperCase() === "CHANGES_REQUESTED" ||
                scholarship.status?.toUpperCase() === "CONTRACT_REJECTED") && (
                <div className="bg-red-50 border-l-4 border-brand-red p-4 mb-8 rounded-r-lg animate-pulse">
                  <div className="flex">
                    <AlertTriangle className="h-6 w-6 text-brand-red" />
                    <div className="ml-4">
                      <h3 className="text-base font-bold text-red-800">
                        Action Required
                      </h3>
                      <p className="mt-1 text-sm text-red-700">
                        Reason: "{scholarship.rejection_reason}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Clock className="text-brand-blue" size={20} /> Application
                Progress
              </h3>

              <div className="mb-10">
                <Timeline currentStatus={scholarship.status} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-xl">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-brand-blue" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-base font-bold text-gray-900">
                        Academic Information
                      </h4>
                      <div className="mt-3 text-sm text-gray-600 space-y-1">
                        <p>
                          Career:{" "}
                          <span className="font-medium text-gray-900">
                            {scholarship.careers?.name}
                          </span>
                        </p>
                        <p>
                          Average Grade:{" "}
                          <span className="font-bold text-brand-blue text-lg">
                            {scholarship.average_grade}
                          </span>
                        </p>
                        <p>
                          Condition:{" "}
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {scholarship.academic_condition}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {scholarship.bank_account_number && (
                  <div className="bg-green-50/50 border border-green-100 p-6 rounded-xl">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-green-100 p-3 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-base font-bold text-gray-900">
                          Registered Bank Details
                        </h4>
                        <p className="mt-3 text-sm text-gray-600 font-mono font-bold">
                          Acct: {scholarship.bank_account_number}
                        </p>
                        <p className="text-xs mt-2 text-green-700 flex items-center gap-1">
                          <CheckCircle size={12} /> Verified via OCR
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-5 flex flex-wrap justify-end items-center border-t border-gray-100 gap-3">
              {["SELECTED", "NOTIFIED", "CHANGES_REQUESTED"].includes(
                scholarship.status?.toUpperCase(),
              ) && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg shadow-md font-semibold text-white ${scholarship.status === "CHANGES_REQUESTED" ? "bg-brand-red" : "bg-brand-blue"}`}
                >
                  {scholarship.status === "CHANGES_REQUESTED" ? (
                    <>
                      <RefreshCcw size={18} /> Fix Document
                    </>
                  ) : (
                    <>
                      <UploadCloud size={18} /> Upload Bank Cert
                    </>
                  )}
                </button>
              )}

              {["CONTRACT_GENERATED", "CONTRACT_REJECTED"].includes(
                scholarship.status?.toUpperCase(),
              ) && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      console.log(
                        "📥 [AUDIT LOG] Descargando contrato sin firmar...",
                      );
                      downloadContract(
                        studentData,
                        scholarship,
                        scholarship.academic_periods,
                      );
                    }}
                    className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    <Download size={18} /> Download
                  </button>
                  <button
                    onClick={() => setIsContractModalOpen(true)}
                    className="flex items-center gap-2 bg-brand-blue text-white px-5 py-2.5 rounded-lg shadow-md font-semibold"
                  >
                    <FileSignature size={18} /> Upload Signed
                  </button>
                </div>
              )}

              {scholarship.status?.toUpperCase() === "PAID" && (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg border border-green-200 font-bold">
                    <CheckCircle size={20} /> Payment Complete!
                  </div>
                  <button
                    onClick={() => downloadReceipt(scholarship.documents)}
                    className="text-sm text-brand-blue font-semibold underline flex items-center gap-1"
                  >
                    <Download size={16} /> Download Receipt
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-xl p-12 text-center border border-gray-100">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Active Scholarship
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Contact Student Welfare if you believe this is an error.
            </p>
          </div>
        )}

        {isModalOpen && scholarship && (
          <BankUploadModal
            studentId={studentData.id}
            selectionId={scholarship.id}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => {
              console.log("✅ [AUDIT LOG] Certificado bancario subido");
              refetch();
            }}
          />
        )}

        {isContractModalOpen && scholarship && (
          <ContractUploadModal
            selectionId={scholarship.id}
            onClose={() => setIsContractModalOpen(false)}
            onSuccess={() => {
              console.log("✅ [AUDIT LOG] Contrato firmado subido");
              refetch();
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
