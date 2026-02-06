import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabaseClient";
import { useStudentDashboardData } from "../../hooks/useScholarshipQueries";
import { downloadContract } from "../../utils/generateContract";
import { AlertTriangle } from "lucide-react";

// Componentes Atomic Design
import BankUploadModal from "../../components/organisms/BankUploadModal";
import ContractUploadModal from "../../components/organisms/ContractUploadModal";
import StudentDashboardNavbar from "../../components/organisms/StudentDashboardNavbar";
import ScholarshipStatusCard from "../../components/organisms/ScholarshipStatusCard";
import StatusAlert from "../../components/organisms/StatusAlert";
import ScholarshipProgressTimeline from "../../components/organisms/ScholarshipProgressTimeline";
import ScholarshipSuccessAlert from "../../components/organisms/ScholarshipSuccessAlert";
import SkeletonLoader from "../../components/ui/SkeletonLoader";

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  // Custom hook para obtener datos
  const {
    data,
    isLoading: queryLoading,
    refetch,
  } = useStudentDashboardData(user?.email, !authLoading);

  // REALTIME: Escuchar cambios de estado en vivo
  useEffect(() => {
    if (!data?.scholarship?.id) return;

    const channel = supabase
      .channel(`status-update-${data.scholarship.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "scholarship_selections",
          filter: `id=eq.${data.scholarship.id}`,
        },
        (payload) => {
          console.log(
            "🔔 Cambio en tiempo real detectado:",
            payload.new.status,
          );
          refetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [data?.scholarship?.id, refetch]);

  const studentData = data?.student;
  const scholarship = data?.scholarship;
  const loading = authLoading || queryLoading;
  const currentStatus = scholarship?.status?.toUpperCase() || "SELECTED";

  // Download helpers
  const downloadReceipt = async (docs) => {
    const receipt = docs?.find((d) => d.document_type === "PAYMENT_RECEIPT");
    if (!receipt) return alert("Receipt not found.");

    try {
      const { data: urlData, error } = await supabase.storage
        .from("scholarship-docs")
        .createSignedUrl(receipt.file_path, 60);
      if (error) throw error;
      window.open(urlData.signedUrl, "_blank");
    } catch (e) {
      console.error("❌ Error:", e);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navbar Skeleton */}
        <div className="bg-white border-b border-gray-200 py-4 px-6">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <SkeletonLoader className="h-8 w-40" />
            <SkeletonLoader className="h-8 w-20" />
          </div>
        </div>

        {/* Content Skeleton */}
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          {/* Status Alert Skeleton */}
          <div className="mb-8">
            <SkeletonLoader className="h-20 rounded-xl" />
          </div>

          {/* Status Card Skeleton */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 mb-8">
            <SkeletonLoader className="h-12 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <SkeletonLoader key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Timeline Skeleton */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <SkeletonLoader className="h-12 w-48 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonLoader key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 font-sans animate-fade-in">
      {/* NAVBAR ORGANISM */}
      <StudentDashboardNavbar studentData={studentData} onLogout={signOut} />

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* STATUS ALERT ORGANISM */}
        <StatusAlert
          currentStatus={currentStatus}
          rejectionReason={scholarship?.rejection_reason}
          onReupload={() => setIsModalOpen(true)}
          onDownloadReceipt={() => downloadReceipt(scholarship?.documents)}
        />

        {/* SCHOLARSHIP STATUS CARD ORGANISM */}
        {scholarship ? (
          <div className="space-y-8">
            <ScholarshipStatusCard
              scholarship={scholarship}
              currentStatus={currentStatus}
              statusInfo={{ label: "Beca Activa" }}
              onUploadBank={() => setIsModalOpen(true)}
              onUploadContract={() => setIsContractModalOpen(true)}
              onDownloadContract={() =>
                downloadContract(
                  studentData,
                  scholarship,
                  scholarship.academic_periods,
                )
              }
              onDownloadReceipt={() => downloadReceipt(scholarship?.documents)}
            />

            {/* PROGRESS TIMELINE ORGANISM */}
            <ScholarshipProgressTimeline
              scholarshipStatus={scholarship.status}
            />

            {/* SUCCESS ALERT ORGANISM - BECA PAGADA */}
            {currentStatus === "PAID" && <ScholarshipSuccessAlert />}
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-xl p-12 text-center border border-gray-100">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No tienes una beca activa
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Contacta con Bienestar Estudiantil si crees que esto es un error.
            </p>
          </div>
        )}

        {/* MODALES ORGANISMS */}
        {isModalOpen && scholarship && (
          <BankUploadModal
            studentId={studentData.id}
            selectionId={scholarship.id}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => refetch()}
          />
        )}
        {isContractModalOpen && scholarship && (
          <ContractUploadModal
            selectionId={scholarship.id}
            onClose={() => setIsContractModalOpen(false)}
            onSuccess={() => refetch()}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
