import React, { useState, useEffect } from "react";
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
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import SkeletonLoader from "../../components/ui/SkeletonLoader";

const ITEMS_PER_PAGE = 20;

const fetchScholars = async ({ queryKey }) => {
  const [_key, page, searchTerm, statusFilter, careerFilter] = queryKey;
  const from = page * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // Filtros Reales Server-Side
  let query = supabase.from("scholarship_selections").select(
    `
      *,
      students!inner (first_name, last_name, national_id, university_email),
      careers!inner (name),
      documents (*)
    `,
    { count: "exact" },
  );

  // Filtro por Estado
  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  // Filtro por Carrera (Usando ID de carrera si es necesario)
  if (careerFilter) {
    query = query.eq("career_id", careerFilter);
  }

  // Búsqueda Textual (ilike)
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
  const [statusFilter, setStatusFilter] = useState("");
  const [careerFilter, setCareerFilter] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Obtener lista de carreras para el filtro (solo una vez)
  const { data: careersData } = useQuery({
    queryKey: ["careers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("careers")
        .select("id, name")
        .order("name");
      return data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["scholars", page, debouncedSearch, statusFilter, careerFilter],
    queryFn: fetchScholars,
    placeholderData: (previousData) => previousData,
    keepPreviousData: true,
  });

  // --- SPRINT 12: REALTIME MANTENIDO ---
  useEffect(() => {
    const channel = supabase
      .channel("admin-scholars-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scholarship_selections" },
        () => queryClient.invalidateQueries(["scholars"]),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const scholars = data?.data;
  const totalCount = data?.count;

  // --- MUTACIONES MANTENIDAS (statusMutation, generateContractMutation) ---
  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      newStatus,
      student,
      scholarshipData,
      reason = "",
    }) => {
      setProcessingId(id);
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
        }
        await supabase
          .from("scholarship_selections")
          .update({
            status: newStatus,
            rejection_reason: reason,
            payment_date: newStatus === "PAID" ? new Date() : null,
          })
          .eq("id", id);
        await sendNotification(
          `${student.first_name} ${student.last_name}`,
          student.university_email,
          newStatus,
          reason,
        );
      } catch (err) {
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
        await sendNotification(
          `${student.first_name} ${student.last_name}`,
          student.university_email,
          "CONTRACT_GENERATED",
          "",
        );
      } catch (err) {
        console.error(err);
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

  if (isLoading && !data)
    return (
      <div className="p-8">
        <SkeletonLoader className="h-64 w-full" />
      </div>
    );

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 animate-fade-in">
      {/* Header con Filtros */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-brand-blue">
              Gestión de Becarios
            </h3>
            <p className="text-xs text-gray-500">
              Mostrando {scholars?.length || 0} de {totalCount || 0} registros
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full lg:w-auto">
            {/* Buscador */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Nombre o ID..."
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            {/* Filtro Estado */}
            <select
              className="px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-brand-blue/20"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Todos los estados</option>
              <option value="DOCS_UPLOADED">Documentos Subidos</option>
              <option value="APPROVED">Aprobados</option>
              <option value="CONTRACT_GENERATED">Contrato Generado</option>
              <option value="CONTRACT_UPLOADED">Contrato Firmado</option>
              <option value="READY_FOR_PAYMENT">Listo para Pago</option>
              <option value="PAID">Pagados</option>
            </select>

            {/* Filtro Carrera */}
            <select
              className="px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-brand-blue/20"
              value={careerFilter}
              onChange={(e) => {
                setCareerFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Todas las Carreras</option>
              {careersData?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Estudiante
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Carrera
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Documentos
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
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
                  <div className="text-sm font-semibold text-gray-900">
                    {item.students?.first_name} {item.students?.last_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.students?.national_id}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-gray-600">
                  {item.careers?.name}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {item.documents?.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleOpenDocument(doc.file_path)}
                        className="text-blue-600 flex items-center gap-1 text-[10px] hover:underline font-medium"
                      >
                        <Eye size={10} /> {doc.document_type.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-full border ${
                      item.status === "PAID"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-blue-100 text-blue-800 border-blue-200"
                    }`}
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
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border rounded shadow-sm disabled:opacity-50 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Página</span>
            <span className="px-3 py-1 bg-brand-blue text-white rounded-md text-sm font-bold">
              {page + 1}
            </span>
          </div>
          <button
            onClick={() => {
              if (scholars?.length === ITEMS_PER_PAGE) setPage((p) => p + 1);
            }}
            disabled={!scholars || scholars.length < ITEMS_PER_PAGE}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border rounded shadow-sm disabled:opacity-50 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Siguiente <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScholarsList;
