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
  User,
  BookOpen,
} from "lucide-react";
import SkeletonLoader from "../../components/ui/SkeletonLoader";

const ITEMS_PER_PAGE = 20;

const fetchScholars = async ({ queryKey }) => {
  const [_key, page, searchTerm, statusFilter, careerFilter] = queryKey;
  const from = page * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let query = supabase.from("scholarship_selections").select(
    `
      *,
      students!inner (first_name, last_name, national_id, university_email),
      careers!inner (name),
      documents (*)
    `,
    { count: "exact" },
  );

  if (statusFilter) query = query.eq("status", statusFilter);
  if (careerFilter) query = query.eq("career_id", careerFilter);

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
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [careerFilter, setCareerFilter] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const debouncedSearch = useDebounce(searchTerm, 500);

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
  });

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

  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      newStatus,
      student,
      scholarshipData,
      reason = "",
    }) => {
      setProcessingId(id);
      if (newStatus === "PAID") {
        const pdfBlob = generateReceiptPDF(student, scholarshipData);
        const filePath = `receipts/${Date.now()}_comprobante.pdf`;
        await supabase.storage
          .from("scholarship-docs")
          .upload(filePath, pdfBlob);
        await supabase
          .from("documents")
          .insert({
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["scholars"]);
      setProcessingId(null);
    },
  });

  const generateContractMutation = useMutation({
    mutationFn: async ({ selection, student }) => {
      setProcessingId(selection.id);
      const contractBlob = await generateContractPDF(
        student,
        selection,
        selection.academic_periods,
      );
      const filePath = `contracts/cnt_${selection.id}_${Date.now()}.pdf`;
      await supabase.storage
        .from("scholarship-docs")
        .upload(filePath, contractBlob);
      await supabase
        .from("documents")
        .insert({
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

  const renderActions = (item) => (
    <div className="flex justify-end gap-2 items-center">
      {item.status === "DOCS_UPLOADED" && (
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
            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <XCircle size={22} />
          </button>
          <button
            onClick={() =>
              statusMutation.mutate({
                id: item.id,
                newStatus: "APPROVED",
                student: item.students,
              })
            }
            className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-colors"
          >
            <CheckCircle size={22} />
          </button>
        </>
      )}
      {item.status === "APPROVED" && (
        <button
          onClick={() =>
            generateContractMutation.mutate({
              selection: item,
              student: item.students,
            })
          }
          className="bg-brand-blue text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-800 transition-transform active:scale-95"
        >
          <FileText size={16} /> Generar Contrato
        </button>
      )}
      {item.status === "CONTRACT_UPLOADED" && (
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
            className="p-2 text-red-500"
          >
            <XCircle size={22} />
          </button>
          <button
            onClick={() =>
              statusMutation.mutate({
                id: item.id,
                newStatus: "READY_FOR_PAYMENT",
                student: item.students,
              })
            }
            className="p-2 text-green-500"
          >
            <CheckCircle size={22} />
          </button>
        </>
      )}
      {item.status === "READY_FOR_PAYMENT" && (
        <button
          onClick={() =>
            statusMutation.mutate({
              id: item.id,
              newStatus: "PAID",
              student: item.students,
              scholarshipData: item,
            })
          }
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-green-700 transition-transform active:scale-95"
        >
          <DollarSign size={16} /> Procesar Pago
        </button>
      )}
      {item.status === "PAID" && (
        <span className="text-xs text-green-600 font-black flex items-center gap-1">
          <CheckCircle size={16} /> PAGADO
        </span>
      )}
    </div>
  );

  if (isLoading && !data)
    return (
      <div className="p-8">
        <SkeletonLoader className="h-64 w-full" />
      </div>
    );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header con Filtros Responsivos */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 lg:p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-black text-brand-blue uppercase italic tracking-tight">
                Gestión de Becarios
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Registros:{" "}
                <span className="text-brand-blue font-bold">
                  {totalCount || 0}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por nombre o ID..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <select
              className="px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-blue/20 font-medium"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Todos los Estados</option>
              <option value="DOCS_UPLOADED">Documentos Recibidos</option>
              <option value="APPROVED">Aprobados</option>
              <option value="CONTRACT_GENERATED">Contrato por Firmar</option>
              <option value="CONTRACT_UPLOADED">Firma Recibida</option>
              <option value="READY_FOR_PAYMENT">Listo para Pago</option>
              <option value="PAID">Pagados</option>
            </select>
            <select
              className="px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-blue/20 font-medium"
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

      {/* Vista de Tarjetas (Mobile) */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {scholars?.map((item) => (
          <div
            key={item.id}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center font-bold">
                  {item.students?.first_name[0]}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 leading-none">
                    {item.students?.first_name} {item.students?.last_name}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {item.students?.national_id}
                  </span>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-[9px] font-black rounded-full border ${item.status === "PAID" ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}
              >
                {item.status?.replace(/_/g, " ")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-gray-400 font-bold uppercase mb-1 flex items-center gap-1">
                  <BookOpen size={10} /> Carrera
                </p>
                <p className="text-gray-700 font-semibold truncate">
                  {item.careers?.name}
                </p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-gray-400 font-bold uppercase mb-1 flex items-center gap-1">
                  <FileText size={10} /> Documentos
                </p>
                <div className="flex flex-wrap gap-1">
                  {item.documents?.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleOpenDocument(doc.file_path)}
                      className="text-brand-blue hover:underline"
                    >
                      <Eye size={12} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-50">
              {processingId === item.id ? (
                <Loader2 className="animate-spin mx-auto text-brand-blue" />
              ) : (
                renderActions(item)
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Vista de Tabla (Desktop) */}
      <div className="hidden lg:block bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Estudiante
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Carrera
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Documentos
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Estado
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {scholars?.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-blue-50/20 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <User className="text-gray-300" size={18} />
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        {item.students?.first_name} {item.students?.last_name}
                      </div>
                      <div className="text-[10px] font-mono text-gray-400">
                        {item.students?.national_id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">
                  {item.careers?.name}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {item.documents?.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleOpenDocument(doc.file_path)}
                        className="text-brand-blue flex items-center gap-1 text-[10px] hover:underline font-bold"
                      >
                        <Eye size={12} /> {doc.document_type.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 inline-flex text-[10px] font-black rounded-full border ${item.status === "PAID" ? "bg-green-100 text-green-800 border-green-200" : "bg-blue-100 text-blue-800 border-blue-200"}`}
                  >
                    {item.status?.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {processingId === item.id ? (
                    <Loader2 className="animate-spin ml-auto text-brand-blue" />
                  ) : (
                    renderActions(item)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación Responsiva */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm disabled:opacity-30 text-gray-600 font-bold hover:bg-gray-50 transition-all"
        >
          <ChevronLeft size={18} /> Anterior
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
            Página
          </span>
          <span className="px-4 py-2 bg-brand-blue text-white rounded-xl text-sm font-black shadow-md shadow-blue-200">
            {page + 1}
          </span>
        </div>
        <button
          onClick={() => {
            if (scholars?.length === ITEMS_PER_PAGE) setPage((p) => p + 1);
          }}
          disabled={!scholars || scholars.length < ITEMS_PER_PAGE}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm disabled:opacity-30 text-gray-600 font-bold hover:bg-gray-50 transition-all"
        >
          Siguiente <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default ScholarsList;
