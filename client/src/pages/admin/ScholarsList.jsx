import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../services/supabaseClient";
import { sendNotification } from "../../utils/emailService";
import { useAuth } from "../../context/AuthContext";
import {
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  ExternalLink,
  Loader2,
} from "lucide-react";

const fetchScholars = async () => {
  // Traemos también los documentos subidos
  const { data, error } = await supabase
    .from("scholarship_selections")
    .select(
      `
      *,
      students (first_name, last_name, national_id, university_email),
      careers (name),
      documents (*)
    `,
    )
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
};

const ScholarsList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState(null);

  const {
    data: scholars,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["scholars"],
    queryFn: fetchScholars,
  });

  // MUTATION: Actualizar Estado (Aprobar/Rechazar/Pagar)
  const statusMutation = useMutation({
    mutationFn: async ({ id, newStatus, student, reason = "" }) => {
      setProcessingId(id);

      // 1. Actualizar BD
      const { error: updateError } = await supabase
        .from("scholarship_selections")
        .update({
          status: newStatus,
          rejection_reason: reason,
          // Si pagamos, guardamos fecha
          payment_date: newStatus === "PAID" ? new Date() : null,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // 2. Audit Log
      await supabase.from("audit_logs").insert({
        action: `CHANGE_STATUS_${newStatus}`,
        target_entity: "scholarship_selections",
        target_id: id,
        details: { reason },
      });

      // 3. Enviar Correo
      await sendNotification(
        `${student.first_name} ${student.last_name}`,
        student.university_email,
        newStatus,
        reason,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["scholars"]);
      setProcessingId(null);
    },
    onError: (err) => {
      alert("Error: " + err.message);
      setProcessingId(null);
    },
  });

  // Función auxiliar para obtener URL del PDF
  const getDocUrl = (docs) => {
    const cert = docs?.find((d) => d.document_type === "BANK_CERT");
    if (!cert) return null;
    // Obtener URL pública (o firmada si es privado, aquí usamos getPublicUrl por simplicidad en demo)
    const { data } = supabase.storage
      .from("scholarship-docs")
      .getPublicUrl(cert.file_path);
    return data.publicUrl;
  };

  // Función para abrir documentos privados de forma segura
  const handleOpenDocument = async (filePath) => {
    try {
      // Generar URL firmada válida por 60 segundos
      const { data, error } = await supabase.storage
        .from("scholarship-docs")
        .createSignedUrl(filePath, 60);

      if (error) throw error;

      // Abrir en nueva pestaña
      window.open(data.signedUrl, "_blank");
    } catch (error) {
      alert("Error al abrir documento: " + error.message);
    }
  };

  if (isLoading)
    return <div className="p-10 text-center">Cargando datos...</div>;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* ... Header de la tabla ... */}
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Gestión de Becarios
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estudiante
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Detalles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Documentos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {scholars?.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {item.students?.first_name} {item.students?.last_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.students?.university_email}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700">
                    {item.careers?.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    Prom: {item.average_grade} | Cond: {item.academic_condition}
                  </div>
                  {item.bank_account_number && (
                    <div className="text-xs font-mono bg-green-50 text-green-700 px-2 py-1 rounded mt-1 w-fit">
                      Cta: {item.bank_account_number}
                    </div>
                  )}
                </td>

                <td className="px-6 py-4">
                  {/* Buscamos si hay un certificado bancario */}
                  {item.documents?.find(
                    (d) => d.document_type === "BANK_CERT",
                  ) ? (
                    <button
                      onClick={() =>
                        handleOpenDocument(
                          item.documents.find(
                            (d) => d.document_type === "BANK_CERT",
                          ).file_path,
                        )
                      }
                      className="flex items-center text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium transition-colors"
                    >
                      <FileText size={16} className="mr-1" /> Ver Certificado
                    </button>
                  ) : (
                    <span className="flex items-center text-xs text-gray-400">
                      <XCircle size={14} className="mr-1" /> Sin archivo
                    </span>
                  )}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${
                      item.status === "PAID"
                        ? "bg-green-100 text-green-800"
                        : item.status === "DOCS_UPLOADED"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {processingId === item.id ? (
                    <Loader2 className="animate-spin ml-auto text-primary-600" />
                  ) : (
                    <div className="flex justify-end gap-2">
                      {/* ACCIONES PARA ESTADO: DOCS_UPLOADED */}
                      {item.status === "DOCS_UPLOADED" && (
                        <>
                          <button
                            onClick={() =>
                              statusMutation.mutate({
                                id: item.id,
                                newStatus: "CHANGES_REQUESTED",
                                student: item.students,
                                reason: "Documento ilegible",
                              })
                            }
                            className="text-red-600 hover:text-red-900"
                            title="Rechazar Documento"
                          >
                            <XCircle size={20} />
                          </button>
                          <button
                            onClick={() =>
                              statusMutation.mutate({
                                id: item.id,
                                newStatus: "APPROVED",
                                student: item.students,
                              })
                            }
                            className="text-green-600 hover:text-green-900"
                            title="Aprobar Beca"
                          >
                            <CheckCircle size={20} />
                          </button>
                        </>
                      )}

                      {/* ACCIONES PARA ESTADO: APPROVED */}
                      {item.status === "APPROVED" && (
                        <button
                          onClick={() =>
                            statusMutation.mutate({
                              id: item.id,
                              newStatus: "PAID",
                              student: item.students,
                            })
                          }
                          className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          <DollarSign size={16} /> Pagar
                        </button>
                      )}

                      {item.status === "PAID" && (
                        <span className="text-gray-400 text-xs">
                          Finalizado
                        </span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScholarsList;
