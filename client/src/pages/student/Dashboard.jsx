import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabaseClient";
import { Timeline } from "../../components/ui/Timeline";
// IMPORTANTE: Agregamos RefreshCcw para el icono de corregir
import {
  AlertTriangle,
  FileText,
  UploadCloud,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import BankUploadModal from "../../components/student/BankUploadModal";
import { downloadContract } from "../../utils/generateContract";
import ContractUploadModal from "../../components/student/ContractUploadModal";
import { FileSignature, Download } from "lucide-react"; // Iconos nuevos

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado para controlar el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  useEffect(() => {
    if (!user?.email) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Obtener datos personales (Perfil Estudiante)
        const { data: student, error: stuError } = await supabase
          .from("students")
          .select("*")
          .eq("university_email", user.email)
          .single();

        if (stuError) throw stuError;
        setStudentData(student);

        // 2. Obtener Beca Activa
        const { data: selection, error: selError } = await supabase
          .from("scholarship_selections")
          .select("*, academic_periods(name), careers(name)")
          .eq("student_id", student.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!selError) setScholarship(selection);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary-600 h-8 w-8" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-primary-900">
                UCE Becas
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {studentData?.first_name} {studentData?.last_name}
              </span>
              <button
                onClick={signOut}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Panel del Estudiante
          </h1>
          <p className="mt-1 text-gray-500">
            Periodo Académico:{" "}
            <span className="font-semibold">
              {scholarship?.academic_periods?.name || "N/A"}
            </span>
          </p>
        </div>

        {scholarship ? (
          <div className="bg-white overflow-hidden shadow rounded-lg mb-8 border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              {/* --- NUEVO: ALERTA ROJA SI FUE RECHAZADO --- */}
              {scholarship.status?.toUpperCase() === "CHANGES_REQUESTED" && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-md animate-pulse">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Se requiere corrección en tu documento
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p className="font-bold">
                          Motivo: "{scholarship.rejection_reason}"
                        </p>
                        <p>Por favor, sube un nuevo PDF legible.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* --------------------------------------------- */}

              {scholarship.status?.toUpperCase() === 'CONTRACT_REJECTED' && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-md animate-pulse">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Error en el Contrato
                      </h3>
                      <p className="mt-1 text-sm text-red-700">
                        Motivo: "{scholarship.rejection_reason}". Descarga,
                        firma y sube de nuevo.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                Progreso de tu Solicitud
              </h3>

              {/* TIMELINE */}
              <Timeline currentStatus={scholarship.status} />

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Datos Académicos */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-bold text-blue-800">
                        Información Académica
                      </h4>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Carrera: {scholarship.careers?.name}</p>
                        <p>
                          Promedio:{" "}
                          <span className="font-bold">
                            {scholarship.average_grade}
                          </span>
                        </p>
                        <p>Condición: {scholarship.academic_condition}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Datos Bancarios (Si existen) */}
                {scholarship.bank_account_number && (
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-bold text-green-800">
                          Datos Bancarios Registrados
                        </h4>
                        <div className="mt-2 text-sm text-green-700">
                          <p>
                            Cuenta detectada:{" "}
                            <span className="font-mono font-bold">
                              {scholarship.bank_account_number}
                            </span>
                          </p>
                          <p className="text-xs mt-1">
                            Documento cargado correctamente.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer de Acciones */}
            <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-end items-center border-t border-gray-200">
              {/* LÓGICA COMBINADA: Subida Inicial O Corrección */}
              {(scholarship.status?.toUpperCase() === "SELECTED" ||
                scholarship.status?.toUpperCase() === "NOTIFIED" ||
                scholarship.status?.toUpperCase() === "CHANGES_REQUESTED") && ( // Agregamos CHANGES_REQUESTED aquí
                <button
                  onClick={() => setIsModalOpen(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md shadow-sm transition-all text-white
                    ${
                      scholarship.status?.toUpperCase() === "CHANGES_REQUESTED"
                        ? "bg-red-600 hover:bg-red-700" // Rojo si es corrección
                        : "bg-primary-600 hover:bg-primary-700" // Azul normal
                    }`}
                >
                  {scholarship.status?.toUpperCase() === "CHANGES_REQUESTED" ? (
                    <>
                      <RefreshCcw size={18} /> Corregir Documento
                    </>
                  ) : (
                    <>
                      <UploadCloud size={18} /> Subir Certificado Bancario
                    </>
                  )}
                </button>
              )}

              {scholarship.status?.toUpperCase() === "DOCS_UPLOADED" && (
                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                  <Clock size={18} />
                  <span className="font-medium text-sm">
                    Esperando revisión del Staff
                  </span>
                </div>
              )}

              {/* FASE CONTRATO: Aprobado por banco o Rechazado por firma */}
              {(scholarship.status?.toUpperCase() === "CONTRACT_GENERATED" ||
                scholarship.status?.toUpperCase() === "CONTRACT_REJECTED") && (
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      downloadContract(
                        studentData,
                        scholarship,
                        scholarship.academic_periods,
                      )
                    }
                    className="flex items-center gap-2 bg-white text-primary-700 border border-primary-200 px-4 py-2 rounded-md hover:bg-gray-50 shadow-sm"
                  >
                    <Download size={18} /> Descargar Contrato
                  </button>

                  <button
                    onClick={() => setIsContractModalOpen(true)}
                    className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-md hover:bg-primary-800 shadow-sm"
                  >
                    <FileSignature size={18} /> Subir Firmado
                  </button>
                </div>
              )}

              {scholarship.status?.toUpperCase() === "CONTRACT_UPLOADED" && (
                <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                  <Clock size={18} />
                  <span className="font-medium text-sm">
                    Contrato en revisión legal
                  </span>
                </div>
              )}

              {scholarship.status?.toUpperCase() === "READY_FOR_PAYMENT" && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  <CheckCircle size={18} />
                  <span className="font-medium text-sm">
                    Contrato Aceptado. Esperando desembolso.
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-10 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No seleccionado
            </h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              Actualmente no tienes una beca asignada para este periodo
              académico. Si crees que es un error, contacta a bienestar
              estudiantil.
            </p>
          </div>
        )}

        {/* MODAL DE SUBIDA */}
        {isModalOpen && scholarship && (
          <BankUploadModal
            studentId={studentData.id}
            selectionId={scholarship.id}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => {
              window.location.reload();
            }}
          />
        )}

        {isContractModalOpen && scholarship && (
          <ContractUploadModal
            selectionId={scholarship.id}
            onClose={() => setIsContractModalOpen(false)}
            onSuccess={() => window.location.reload()}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
