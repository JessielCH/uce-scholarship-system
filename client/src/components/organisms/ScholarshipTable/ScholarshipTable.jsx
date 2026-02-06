import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../services/supabaseClient";
import { sendNotification } from "../../../utils/emailService";
import { generateContractPDF } from "../../../utils/generateContract";
import { generateReceiptPDF } from "../../../utils/generateReceipt";
import { useDebounce } from "../../../hooks/useDebounce";
import SkeletonLoader from "../../ui/SkeletonLoader";
import Pagination from "../../molecules/Pagination";
import FiltersSection from "../../molecules/FiltersSection";
import ScholarshipCard from "../../molecules/ScholarshipCard";

/**
 * ORGANISM: ScholarshipTable
 * Tabla completa de becarios con búsqueda, filtrado, paginación y acciones
 * Integra: Input (search), Pagination, Button (acciones), SkeletonLoader
 * Lógica: Queries, Mutations, Realtime subscriptions
 */
const ITEMS_PER_PAGE = 20;

const fetchScholars = async ({ queryKey }) => {
  const [_key, page, searchTerm, statusFilter, careerFilter] = queryKey;
  const from = page * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // Primero obtener el período actual
  const { data: periodData } = await supabase
    .from("academic_periods")
    .select("id")
    .eq("is_active", true)
    .single();

  let query = supabase.from("scholarship_selections").select(
    `
      *,
      students!inner (first_name, last_name, national_id, university_email),
      careers!inner (name),
      documents (*)
    `,
    { count: "exact" },
  );

  // Filtrar por período actual
  if (periodData) {
    query = query.eq("period_id", periodData.id);
  }

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

const ScholarshipTable = () => {
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

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["scholars", page, debouncedSearch, statusFilter, careerFilter],
    queryFn: fetchScholars,
    placeholderData: (previousData) => previousData,
    refetchInterval: 3000, // Refetch cada 3 segundos
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-scholars-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scholarship_selections" },
        (payload) => {
          console.log("📊 Real-time scholarship_selections:", payload);
          queryClient.invalidateQueries({ queryKey: ["scholars"] });
        },
      )
      .subscribe();

    // Real-time para documentos cargados por estudiantes
    const docsChannel = supabase
      .channel("admin-documents-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents" },
        (payload) => {
          console.log("📄 Real-time documents:", payload);
          queryClient.invalidateQueries({
            queryKey: ["scholars"],
            exact: false,
          });
        },
      )
      .subscribe((status) => {
        console.log("📄 Documents channel status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(docsChannel);
    };
  }, [queryClient]);

  const scholars = data?.data;
  const totalCount = data?.count;
  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholars"] });
      setProcessingId(null);
    },
  });

  const generateContractMutation = useMutation({
    mutationFn: async ({ selection, student }) => {
      setProcessingId(selection.id);
      const pdfBlob = generateContractPDF(student, selection);
      const filePath = `contracts/${Date.now()}_contract.pdf`;
      await supabase.storage.from("scholarship-docs").upload(filePath, pdfBlob);
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
        "CONTRACT_READY",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholars"] });
      setProcessingId(null);
    },
  });

  if (isLoading && !data)
    return (
      <div className="p-8">
        <SkeletonLoader className="h-64 w-full" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* FILTROS */}
      <FiltersSection
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(0);
        }}
        statusFilter={statusFilter}
        onStatusChange={(value) => {
          setStatusFilter(value);
          setPage(0);
        }}
        careerFilter={careerFilter}
        onCareerChange={(value) => {
          setCareerFilter(value);
          setPage(0);
        }}
        careersData={careersData}
      />

      {/* TARJETAS RESPONSIVAS */}
      {isLoading && !scholars ? (
        <div className="p-8">
          <SkeletonLoader className="h-64 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scholars && scholars.length > 0 ? (
            scholars.map((item) => (
              <ScholarshipCard
                key={item.id}
                item={item}
                onStatusChange={(payload) => statusMutation.mutate(payload)}
                onGenerateContract={(payload) =>
                  generateContractMutation.mutate(payload)
                }
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No hay resultados</p>
            </div>
          )}
        </div>
      )}

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPrev={() => setPage(Math.max(0, page - 1))}
          onNext={() => setPage(Math.min(totalPages - 1, page + 1))}
          onPageChange={setPage}
          className="justify-center"
        />
      )}
    </div>
  );
};

export default ScholarshipTable;
