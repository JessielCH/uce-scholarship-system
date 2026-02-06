import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Timeline } from "../../components/ui/Timeline";
import BankUploadModal from "../../components/student/BankUploadModal";
import ContractUploadModal from "../../components/student/ContractUploadModal";
import { downloadContract } from "../../utils/generateContract";

import {
  AlertCircle,
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
  XCircle,
  FileCheck,
  Search,
} from "lucide-react";

// Configuración de los 7 estados claros para el estudiante
const STATUS_MAP = {
  SELECTED: { label: "Seleccionado", color: "text-blue-500", icon: Clock },
  DOCS_UPLOADED: {
    label: "Documentos en Revisión",
    color: "text-yellow-500",
    icon: Search,
  },
  CHANGES_REQUESTED: {
    label: "Acción Requerida: Corregir Doc",
    color: "text-red-500",
    icon: AlertCircle,
  },
  APPROVED: {
    label: "Aprobado - Esperando Contrato",
    color: "text-green-500",
    icon: CheckCircle,
  },
  CONTRACT_GENERATED: {
    label: "Contrato Listo para Firmar",
    color: "text-brand-blue",
    icon: FileSignature,
  },
  READY_FOR_PAYMENT: {
    label: "Validando Firma",
    color: "text-purple-500",
    icon: FileCheck,
  },
  PAID: {
    label: "BECA PAGADA",
    color: "text-white font-black", // BLANCO Y NEGRITA AQUÍ
    icon: CheckCircle,
  },
};

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
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
      const { data: student, error: stuError } = await supabase
        .from("students")
        .select("*")
        .eq("university_email", user.email)
        .single();

      if (stuError) throw stuError;

      const { data: selection, error: selError } = await supabase
        .from("scholarship_selections")
        .select("*, academic_periods(name), careers(name), documents(*)")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return { student, scholarship: selection };
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 1000 * 60 * 5,
  });

  // 2. REALTIME: Escuchar cambios de estado en vivo
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
  const statusInfo = STATUS_MAP[currentStatus] || STATUS_MAP.SELECTED;

  // Función para descargar recibo de pago
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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-brand-blue h-10 w-10" />
        <span className="ml-3 text-brand-blue font-medium">
          Cargando Panel...
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
                <FileCheck className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold text-brand-blue tracking-tight italic">
                Portal de Becas UCE
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 font-bold">
                <User size={16} className="text-gray-400" />
                {studentData?.first_name} {studentData?.last_name}
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-red font-bold transition-colors"
              >
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Notificación de Acción Requerida (Rechazo) */}
        {["CHANGES_REQUESTED", "CONTRACT_REJECTED"].includes(currentStatus) && (
          <div className="bg-red-50 border-l-4 border-brand-red p-5 mb-8 rounded-r-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-4">
              <XCircle className="text-brand-red" size={32} />
              <div>
                <h3 className="text-lg font-bold text-red-800">
                  ¡Acción Requerida! Documento Rechazado
                </h3>
                <p className="text-sm text-red-700 font-medium">
                  Motivo: "{scholarship.rejection_reason}"
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                currentStatus === "CHANGES_REQUESTED"
                  ? setIsModalOpen(true)
                  : setIsContractModalOpen(true)
              }
              className="bg-brand-red text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-red-700 flex items-center gap-2 transition"
            >
              <RefreshCcw size={18} /> Subir de Nuevo
            </button>
          </div>
        )}

        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-blue">
              Dashboard del Estudiante
            </h1>
            <p className="mt-2 text-gray-500 flex items-center gap-2 font-medium">
              Periodo Académico:{" "}
              <span className="bg-blue-50 text-brand-blue px-2 py-0.5 rounded border border-blue-100">
                {scholarship?.academic_periods?.name || "N/A"}
              </span>
            </p>
          </div>
          {/* Badge de Estado Dinámico */}
          <div
            className={`inline-flex items-center gap-2 font-bold px-4 py-2 rounded-full border shadow-sm ${currentStatus === "PAID" ? "bg-green-600 border-green-700 shadow-md" : statusInfo.color.replace("text", "bg").replace("500", "100")} ${statusInfo.color}`}
          >
            <statusInfo.icon
              size={20}
              className={currentStatus === "PAID" ? "text-white" : ""}
            />
            <span
              className={
                currentStatus === "PAID" ? "text-white font-black" : ""
              }
            >
              {statusInfo.label}
            </span>
          </div>
        </div>

        {scholarship ? (
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
            <div className="px-6 py-8">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Clock className="text-brand-blue" size={20} /> Progreso de la
                Solicitud
              </h3>

              <div className="mb-10">
                <Timeline currentStatus={scholarship.status} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Datos Académicos */}
                <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-xl">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-brand-blue" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-base font-bold text-gray-900">
                        Datos Académicos
                      </h4>
                      <div className="mt-3 text-sm text-gray-600 space-y-1">
                        <p>
                          Carrera:{" "}
                          <span className="font-medium text-gray-900">
                            {scholarship.careers?.name}
                          </span>
                        </p>
                        <p>
                          Promedio:{" "}
                          <span className="font-bold text-brand-blue text-lg">
                            {scholarship.average_grade}
                          </span>
                        </p>
                        <p>
                          Condición:{" "}
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {scholarship.academic_condition}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cuenta Bancaria */}
                {scholarship.bank_account_number && (
                  <div className="bg-green-50/50 border border-green-100 p-6 rounded-xl">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-green-100 p-3 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-base font-bold text-gray-900">
                          Cuenta Bancaria Registrada
                        </h4>
                        <p className="mt-3 text-sm text-gray-600 font-mono font-bold">
                          N°: {scholarship.bank_account_number}
                        </p>
                        <p className="text-xs mt-2 text-green-700 flex items-center gap-1 font-bold">
                          <CheckCircle size={12} /> Verificado vía OCR
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN FINAL DE ÉXITO (CUADRO VERDE) */}
            {currentStatus === "PAID" && (
              <div className="mx-6 mb-8 bg-green-600 rounded-2xl p-8 text-white shadow-2xl border-4 border-green-700 animate-fade-in">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="bg-white/20 p-4 rounded-full">
                      <CheckCircle size={40} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                        BECA PAGADA
                      </h2>
                      <p className="text-green-50 font-semibold opacity-90">
                        El proceso ha finalizado satisfactoriamente.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadReceipt(scholarship.documents)}
                    className="bg-white text-green-700 px-8 py-4 rounded-xl font-black hover:bg-green-50 transition-all flex items-center gap-2 shadow-lg uppercase"
                  >
                    <Download size={20} /> Comprobante de Pago
                  </button>
                </div>
              </div>
            )}

            {/* BOTONES DE ACCIÓN PARA OTROS ESTADOS */}
            <div className="bg-gray-50 px-6 py-5 flex flex-wrap justify-end items-center border-t border-gray-100 gap-3">
              {["SELECTED", "NOTIFIED", "CHANGES_REQUESTED"].includes(
                currentStatus,
              ) && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg shadow-md font-bold text-white transition-all hover:scale-105 ${currentStatus === "CHANGES_REQUESTED" ? "bg-brand-red" : "bg-brand-blue"}`}
                >
                  {currentStatus === "CHANGES_REQUESTED" ? (
                    <>
                      <RefreshCcw size={18} /> Corregir Documento
                    </>
                  ) : (
                    <>
                      <UploadCloud size={18} /> Subir Certificado
                    </>
                  )}
                </button>
              )}

              {["CONTRACT_GENERATED", "CONTRACT_REJECTED"].includes(
                currentStatus,
              ) && (
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      downloadContract(
                        studentData,
                        scholarship,
                        scholarship.academic_periods,
                      )
                    }
                    className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 font-bold shadow-sm"
                  >
                    <Download size={18} /> 1. Descargar Contrato
                  </button>
                  <button
                    onClick={() => setIsContractModalOpen(true)}
                    className="flex items-center gap-2 bg-brand-blue text-white px-5 py-2.5 rounded-lg shadow-md font-bold hover:bg-blue-800 transition-all"
                  >
                    <FileSignature size={18} /> 2. Subir Firmado
                  </button>
                </div>
              )}
            </div>
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

        {/* Modales */}
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
