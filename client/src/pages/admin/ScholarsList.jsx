import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../services/supabaseClient";
import { sendNotification } from "../../utils/emailService";
import { generateContractPDF } from "../../utils/generateContract";
import { generateReceiptPDF } from "../../utils/generateReceipt";
import { useAuth } from "../../context/AuthContext";
import { useDebounce } from "../../hooks/useDebounce";
import {
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  Loader2,
  Eye,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import SkeletonLoader from "../../components/ui/SkeletonLoader";

const fetchScholars = async ({ queryKey }) => {
  const [_key, page, searchTerm] = queryKey;
  const ITEMS_PER_PAGE = 20;
  const from = page * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let query = supabase.from("scholarship_selections").select(
    `
      *,
      students!inner (first_name, last_name, national_id, university_email),
      careers (name),
      documents (*)
    `,
    { count: "exact" },
  );

  if (searchTerm) {
    query = query.or(
      `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,national_id.ilike.%${searchTerm}%`,
      { foreignTable: "students" },
    );
  }

  const { data, error, count } = await query
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data, count };
};

const ScholarsList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data, isLoading } = useQuery({
    queryKey: ["scholars", page, debouncedSearch],
    queryFn: fetchScholars,
    placeholderData: (previousData) => previousData,
  });

  const scholars = data?.data;
  const totalCount = data?.count;

  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      newStatus,
      student,
      scholarshipData,
      reason = "",
    }) => {
      setProcessingId(id);
      console.group(`🚀 [AUDIT] Acción: ${newStatus}`);
      console.log(`Operador: ${user?.email}`);
      console.log(`Beneficiario: ${student.first_name} ${student.last_name}`);

      try {
        if (newStatus === "PAID") {
          const pdfBlob = generateReceiptPDF(student, scholarshipData);
          const filePath = `receipts/${Date.now()}_comprobante.pdf`;
          await supabase.storage
            .from("scholarship-docs")
            .upload(filePath, pdfBlob);
          await supabase.from("documents").insert({
            selection_id: id,
            document_type: "PAYMENT_RECEIPT",
            file_path: filePath,
            version: 1,
          });
          console.log("✅ Recibo generado");
        }

        await supabase
          .from("scholarship_selections")
          .update({
            status: newStatus,
            rejection_reason: reason,
            payment_date: newStatus === "PAID" ? new Date() : null,
          })
          .eq("id", id);

        console.log("✅ Actualización en Base de Datos exitosa");
        console.groupEnd();
        await sendNotification(
          `${student.first_name} ${student.last_name}`,
          student.university_email,
          newStatus,
          reason,
        );
      } catch (err) {
        console.error("❌ Error:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["scholars"]);
      setProcessingId(null);
    },
  });

  const generateContractMutation = useMutation({
    mutationFn: async ({ selection, student }) => {
      setProcessingId(selection.id);
      console.group("📝 [AUDIT] Generando Contrato");
      try {
        const contractBlob = await generateContractPDF(
          student,
          selection,
          selection.academic_periods,
        );
        const filePath = `contracts/cnt_${selection.id}_${Date.now()}.pdf`;
        await supabase.storage
          .from("scholarship-docs")
          .upload(filePath, contractBlob);
        await supabase.from("documents").insert({
          selection_id: selection.id,
          document_type: "CONTRACT_UNSIGNED",
          file_path: filePath,
          version: 1,
        });
        await supabase
          .from("scholarship_selections")
          .update({ status: "CONTRACT_GENERATED" })
          .eq("id", selection.id);
        console.log("✅ Contrato subido correctamente");
        console.groupEnd();
        await sendNotification(
          `${student.first_name} ${student.last_name}`,
          student.university_email,
          "CONTRACT_GENERATED",
          "",
        );
      } catch (err) {
        console.error("❌ Error en contrato:", err);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["scholars"]);
      setProcessingId(null);
    },
  });

  const handleOpenDocument = async (filePath) => {
    const { data } = await supabase.storage
      .from("scholarship-docs")
      .createSignedUrl(filePath, 60);
    window.open(data.signedUrl, "_blank");
  };

  if (isLoading)
    return (
      <div className="p-8">
        <SkeletonLoader className="h-64 w-full" />
      </div>
    );

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 animate-fade-in">
      <div className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center bg-gray-50/50 gap-4">
        <h3 className="text-lg font-bold text-brand-blue">
          Gestión de Becarios
        </h3>
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por nombre o ID..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-brand-blue/20"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded border shadow-sm">
          Total: {totalCount || 0}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                Estudiante
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                Carrera
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                Documentos
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {scholars?.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-blue-50/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold">
                    {item.students?.first_name} {item.students?.last_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.students?.national_id}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-gray-700">
                  {item.careers?.name}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {item.documents?.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleOpenDocument(doc.file_path)}
                        className="text-blue-600 flex items-center gap-1 text-[10px] hover:underline"
                      >
                        <Eye size={10} /> {doc.document_type.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${item.status === "PAID" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
                  >
                    {item.status?.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {processingId === item.id ? (
                    <Loader2
                      className="animate-spin ml-auto text-brand-blue"
                      size={20}
                    />
                  ) : (
                    <div className="flex justify-end gap-2 items-center">
                      {/* BOTONES DE ACCIÓN COMPLETOS */}
                      {item.status?.toUpperCase() === "DOCS_UPLOADED" && (
                        <>
                          <button
                            onClick={() =>
                              statusMutation.mutate({
                                id: item.id,
                                newStatus: "CHANGES_REQUESTED",
                                student: item.students,
                                reason: "Doc. ilegible",
                              })
                            }
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Rechazar"
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
                            className="p-1 text-green-500 hover:bg-green-50 rounded"
                            title="Aprobar"
                          >
                            <CheckCircle size={20} />
                          </button>
                        </>
                      )}

                      {item.status?.toUpperCase() === "APPROVED" && (
                        <button
                          onClick={() =>
                            generateContractMutation.mutate({
                              selection: item,
                              student: item.students,
                            })
                          }
                          className="bg-brand-blue text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-1 hover:bg-blue-800"
                        >
                          <FileText size={14} /> Contrato
                        </button>
                      )}

                      {item.status?.toUpperCase() === "CONTRACT_UPLOADED" && (
                        <>
                          <button
                            onClick={() =>
                              statusMutation.mutate({
                                id: item.id,
                                newStatus: "CONTRACT_REJECTED",
                                student: item.students,
                                reason: "Firma inválida",
                              })
                            }
                            className="p-1 text-red-500"
                            title="Rechazar Contrato"
                          >
                            <XCircle size={20} />
                          </button>
                          <button
                            onClick={() =>
                              statusMutation.mutate({
                                id: item.id,
                                newStatus: "READY_FOR_PAYMENT",
                                student: item.students,
                              })
                            }
                            className="p-1 text-green-500"
                            title="Validar Contrato"
                          >
                            <CheckCircle size={20} />
                          </button>
                        </>
                      )}

                      {item.status?.toUpperCase() === "READY_FOR_PAYMENT" && (
                        <button
                          onClick={() =>
                            statusMutation.mutate({
                              id: item.id,
                              newStatus: "PAID",
                              student: item.students,
                              scholarshipData: item,
                            })
                          }
                          className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-1 hover:bg-green-700"
                        >
                          <DollarSign size={14} /> Pagar
                        </button>
                      )}

                      {item.status?.toUpperCase() === "PAID" && (
                        <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                          <CheckCircle size={14} /> Pagado
                        </span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación */}
        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 text-sm bg-white border rounded disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold text-brand-blue">
            Página {page + 1}
          </span>
          <button
            onClick={() => {
              if (scholars?.length === 20) setPage((p) => p + 1);
            }}
            disabled={!scholars || scholars.length < 20}
            className="px-4 py-2 text-sm bg-white border rounded disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScholarsList;
