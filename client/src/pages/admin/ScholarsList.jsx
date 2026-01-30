import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../services/supabaseClient";
import { sendNotification } from "../../utils/emailService";
import { generateContractPDF } from "../../utils/generateContract";
import { generateReceiptPDF } from "../../utils/generateReceipt";
import { useAuth } from "../../context/AuthContext";
import { useDebounce } from "../../hooks/useDebounce"; // Importación del nuevo hook
import {
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  Loader2,
  Eye,
  Download,
  Search,
} from "lucide-react";
import SkeletonLoader from "../../components/ui/SkeletonLoader";

// 1. Función de fetch actualizada con Lógica de Búsqueda
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

  // Filtro de búsqueda (Buscamos en la tabla relacionada 'students')
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

  // ESTADOS
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // Aplicamos Debounce al término de búsqueda (500ms)
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data, isLoading, error } = useQuery({
    queryKey: ["scholars", page, debouncedSearch], // La query depende del buscador debounced
    queryFn: fetchScholars,
    placeholderData: (previousData) => previousData,
  });

  const scholars = data?.data;
  const totalCount = data?.count;

  // ... rest of your mutations (statusMutation, generateContractMutation)

  // MUTATION: Update Status with Payment Logic
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
        // SPECIAL CASE: PAYMENT ('PAID') -> Generate Receipt
        if (newStatus === "PAID") {
          console.log("🖨️ Generating payment receipt...");

          // 1. Generate PDF Blob
          const pdfBlob = generateReceiptPDF(student, scholarshipData);
          const fileName = `${Date.now()}_payment_receipt.pdf`;
          const filePath = `receipts/${fileName}`;

          // 2. Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from("scholarship-docs")
            .upload(filePath, pdfBlob);

          if (uploadError) throw uploadError;

          // 3. Create Document Record
          const { error: docError } = await supabase.from("documents").insert({
            selection_id: id,
            document_type: "PAYMENT_RECEIPT",
            file_path: filePath,
            version: 1,
          });

          if (docError) throw docError;
        }

        // --- NORMAL UPDATE FLOW ---

        // 4. Update status in scholarship_selections
        const { error: updateError } = await supabase
          .from("scholarship_selections")
          .update({
            status: newStatus,
            rejection_reason: reason,
            payment_date: newStatus === "PAID" ? new Date() : null,
          })
          .eq("id", id);

        if (updateError) throw updateError;

        // 5. Audit Log
        await supabase.from("audit_logs").insert({
          action: `CHANGE_STATUS_${newStatus}`,
          target_entity: "scholarship_selections",
          target_id: id,
          details: { reason, generated_receipt: newStatus === "PAID" },
          performed_by: user.id,
        });

        // 6. Send Email Notification
        await sendNotification(
          `${student.first_name} ${student.last_name}`,
          student.university_email,
          newStatus,
          reason,
        );
      } catch (err) {
        console.error("Process error:", err);
        throw err;
      }
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

  // MUTATION: Generate Contract
  const generateContractMutation = useMutation({
    mutationFn: async ({ selection, student }) => {
      setProcessingId(selection.id);

      // 1. Generate PDF
      const contractBlob = await generateContractPDF(
        student,
        selection,
        selection.academic_periods,
      );

      // 2. Upload to Storage
      const fileName = `contract_${selection.id}_${Date.now()}.pdf`;
      const filePath = `contracts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("scholarship-docs")
        .upload(filePath, contractBlob);

      if (uploadError) throw uploadError;

      // 3. Register Document
      const { error: docError } = await supabase.from("documents").insert({
        selection_id: selection.id,
        document_type: "CONTRACT_UNSIGNED",
        file_path: filePath,
        version: 1,
      });

      if (docError) throw docError;

      // 4. Update Status
      const { error: statusError } = await supabase
        .from("scholarship_selections")
        .update({ status: "CONTRACT_GENERATED" })
        .eq("id", selection.id);

      if (statusError) throw statusError;

      // 5. Audit Log
      await supabase.from("audit_logs").insert({
        action: "GENERATE_CONTRACT",
        target_entity: "scholarship_selections",
        target_id: selection.id,
        details: { filename: fileName },
      });

      // 6. Send Notification
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
    onError: (err) => {
      alert("Error generating contract: " + err.message);
      setProcessingId(null);
    },
  });

  const getDocUrl = (docs) => {
    const cert = docs?.find((d) => d.document_type === "BANK_CERT");
    if (!cert) return null;
    const { data } = supabase.storage
      .from("scholarship-docs")
      .getPublicUrl(cert.file_path);
    return data.publicUrl;
  };

  const handleOpenDocument = async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from("scholarship-docs")
        .createSignedUrl(filePath, 60);

      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (error) {
      alert("Error opening document: " + error.message);
    }
  };

  if (isLoading)
    return (
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 animate-fade-in">
        {/* Header Skeleton */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <SkeletonLoader className="h-6 w-64" />
          <SkeletonLoader className="h-6 w-20" />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <SkeletonLoader className="h-4 w-16" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <SkeletonLoader className="h-4 w-24" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <SkeletonLoader className="h-4 w-20" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <SkeletonLoader className="h-4 w-12" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <SkeletonLoader className="h-4 w-16" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SkeletonLoader className="h-4 w-32" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SkeletonLoader className="h-4 w-24" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SkeletonLoader className="h-4 w-20" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SkeletonLoader className="h-6 w-16 rounded-full" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SkeletonLoader className="h-8 w-20" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 animate-fade-in">
      {/* Header con Buscador */}
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
            placeholder="Buscar por nombre, apellido o ID..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0); // Reiniciar a página 1 al buscar
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
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Academic Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Documents
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {scholars?.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-blue-50/30 transition-colors"
              >
                {/* Student Column */}
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">
                      {item.students?.first_name} {item.students?.last_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.students?.university_email}
                    </span>
                    <span className="text-xs text-gray-400 font-mono mt-0.5">
                      ID: {item.students?.national_id}
                    </span>
                  </div>
                </td>

                {/* Details Column */}
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700 font-medium">
                    {item.careers?.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Avg: <span className="font-bold">{item.average_grade}</span>{" "}
                    | {item.academic_condition}
                  </div>
                  {item.bank_account_number && (
                    <div className="text-xs font-mono bg-green-50 text-green-700 px-2 py-0.5 rounded mt-1 inline-block border border-green-100">
                      Acct: {item.bank_account_number}
                    </div>
                  )}
                </td>

                {/* Documents Column */}
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    {/* Bank Cert */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Bank Cert:</span>
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
                          className="flex items-center text-blue-600 hover:underline"
                        >
                          <Eye size={12} className="mr-1" /> View
                        </button>
                      ) : (
                        <span className="text-gray-300 italic">Missing</span>
                      )}
                    </div>

                    {/* Contract */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Contract:</span>
                      {item.documents?.find(
                        (d) =>
                          d.document_type === "CONTRACT_UNSIGNED" ||
                          d.document_type === "CONTRACT_SIGNED",
                      ) ? (
                        <button
                          onClick={() =>
                            handleOpenDocument(
                              item.documents.find(
                                (d) =>
                                  d.document_type === "CONTRACT_UNSIGNED" ||
                                  d.document_type === "CONTRACT_SIGNED",
                              ).file_path,
                            )
                          }
                          className="flex items-center text-purple-600 hover:underline"
                        >
                          <Eye size={12} className="mr-1" /> View
                        </button>
                      ) : (
                        <span className="text-gray-300 italic">None</span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Status Column */}
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${
                      item.status?.toUpperCase() === "PAID"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : item.status?.toUpperCase() === "READY_FOR_PAYMENT"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : item.status?.toUpperCase() === "CONTRACT_UPLOADED"
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : item.status?.toUpperCase() ===
                                "CONTRACT_GENERATED"
                              ? "bg-cyan-100 text-cyan-800 border-cyan-200"
                              : item.status?.toUpperCase() ===
                                    "CONTRACT_REJECTED" ||
                                  item.status?.toUpperCase() ===
                                    "CHANGES_REQUESTED"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : item.status?.toUpperCase() === "APPROVED"
                                  ? "returnbg-indigo-100 text-indigo-800 border-indigo-200"
                                  : item.status?.toUpperCase() ===
                                      "DOCS_UPLOADED"
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                    : "bg-gray-100 text-gray-800 border-gray-200"
                    }`}
                  >
                    {item.status?.replace(/_/g, " ")}
                  </span>
                </td>

                {/* Actions Column */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {processingId === item.id ? (
                    <Loader2
                      className="animate-spin ml-auto text-brand-blue"
                      size={20}
                    />
                  ) : (
                    <div className="flex justify-end items-center gap-2">
                      {/* ACTION: REVIEW DOCUMENTS */}
                      {item.status?.toUpperCase() === "DOCS_UPLOADED" && (
                        <>
                          <button
                            onClick={() =>
                              statusMutation.mutate({
                                id: item.id,
                                newStatus: "CHANGES_REQUESTED",
                                student: item.students,
                                reason: "Documento ilegible o incorrecto",
                              })
                            }
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Reject Documents"
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
                            className="p-1 text-green-500 hover:bg-green-50 rounded transition-colors"
                            title="Approve Documents"
                          >
                            <CheckCircle size={20} />
                          </button>
                        </>
                      )}

                      {/* ACTION: GENERATE CONTRACT */}
                      {item.status?.toUpperCase() === "APPROVED" && (
                        <button
                          onClick={() =>
                            generateContractMutation.mutate({
                              selection: item,
                              student: item.students,
                            })
                          }
                          className="flex items-center gap-1 bg-brand-blue text-white px-3 py-1.5 rounded-md text-xs hover:bg-blue-800 transition-colors shadow-sm"
                        >
                          <FileText size={14} /> Generate Contract
                        </button>
                      )}

                      {/* ACTION: VALIDATE CONTRACT */}
                      {item.status?.toUpperCase() === "CONTRACT_UPLOADED" && (
                        <>
                          <button
                            onClick={() =>
                              statusMutation.mutate({
                                id: item.id,
                                newStatus: "CONTRACT_REJECTED",
                                student: item.students,
                                reason: "Invalid signature or document",
                              })
                            }
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Reject Contract"
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
                            className="p-1 text-green-500 hover:bg-green-50 rounded transition-colors"
                            title="Approve Contract"
                          >
                            <CheckCircle size={20} />
                          </button>
                        </>
                      )}

                      {/* ACTION: PAY */}
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
                          className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-green-700 transition-colors shadow-sm"
                        >
                          <DollarSign size={14} /> Disburse
                        </button>
                      )}

                      {/* ACTION: VIEW RECEIPT */}
                      {item.status?.toUpperCase() === "PAID" && (
                        <div className="flex items-center gap-2">
                          {item.documents?.find(
                            (d) => d.document_type === "PAYMENT_RECEIPT",
                          ) && (
                            <button
                              onClick={() =>
                                handleOpenDocument(
                                  item.documents.find(
                                    (d) =>
                                      d.document_type === "PAYMENT_RECEIPT",
                                  ).file_path,
                                )
                              }
                              className="text-xs text-brand-blue hover:underline flex items-center font-medium"
                            >
                              <Download size={12} className="mr-1" /> Receipt
                            </button>
                          )}
                        </div>
                      )}

                      {/* FALLBACK STATUS TEXTS */}
                      {item.status?.toUpperCase() === "CONTRACT_GENERATED" && (
                        <span className="text-xs text-gray-400 italic">
                          Waiting for student...
                        </span>
                      )}

                      {/* DEV SHORTCUTS (Optional, remove in prod) */}
                      {(item.status?.toUpperCase() === "SELECTED" ||
                        item.status?.toUpperCase() === "NOTIFIED") && (
                        <button
                          onClick={() =>
                            statusMutation.mutate({
                              id: item.id,
                              newStatus: "DOCS_UPLOADED",
                              student: item.students,
                            })
                          }
                          className="p-1 text-gray-400 hover:text-blue-500"
                          title="Dev: Force Docs Uploaded"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Debajo del cierre de la tabla */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => setPage((old) => Math.max(old - 1, 0))}
            disabled={page === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">Página {page + 1}</span>
          <button
            onClick={() => {
              if (scholars?.length === 20) {
                // Si la página está llena, hay posibilidad de más
                setPage((old) => old + 1);
              }
            }}
            disabled={scholars?.length < 20}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScholarsList;
