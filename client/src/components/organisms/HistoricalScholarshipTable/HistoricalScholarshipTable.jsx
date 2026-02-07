import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../services/supabaseClient";
import { sendNotification } from "../../../utils/emailService";
import { generateContractPDF } from "../../../utils/generateContract";
import { generateReceiptPDF } from "../../../utils/generateReceipt";
import { useDebounce } from "../../../hooks/useDebounce";
import { useAcademicPeriods } from "../../../hooks/useScholarshipQueries";
import SkeletonLoader from "../../ui/SkeletonLoader";
import Pagination from "../../molecules/Pagination";
import ScholarshipCard from "../../molecules/ScholarshipCard";
import PeriodSelector from "../../molecules/PeriodSelector";

/**
 * ORGANISM: HistoricalScholarshipTable
 * Table of historical scholarship students (past periods)
 * Allows filtering by previous period and includes all statuses
 */
const ITEMS_PER_PAGE = 20;

const fetchHistoricalScholars = async ({ queryKey }) => {
  const [_key, page, searchTerm, careerFilter, selectedPeriodId] = queryKey;
  const from = page * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // first get total count with filters (without limit)
  let countQuery = supabase.from("scholarship_selections").select(
    "id",
    { count: "estimated", head: true }, // estimated
  );

  // Filter per period
  if (selectedPeriodId) {
    countQuery = countQuery.eq("period_id", selectedPeriodId);
  }

  // Exclude current period (only historical)
  const { data: currentPeriod } = await supabase
    .from("academic_periods")
    .select("id")
    .eq("is_active", true)
    .single();

  if (currentPeriod) {
    countQuery = countQuery.neq("period_id", currentPeriod.id);
  }

  if (careerFilter) countQuery = countQuery.eq("career_id", careerFilter);
  if (searchTerm) {
    countQuery = countQuery.or(
      `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,national_id.ilike.%${searchTerm}%`,
      { foreignTable: "students" },
    );
  }

  const { count: totalRecords, error: countError } = await countQuery;

  let query = supabase.from("scholarship_selections").select(
    `
      *,
      students!inner (first_name, last_name, national_id, university_email),
      careers!inner (name, faculty_id),
      academic_periods (name, is_active),
      documents (*)
    `,
  );

  if (selectedPeriodId) {
    query = query.eq("period_id", selectedPeriodId);
  }

  if (currentPeriod) {
    query = query.neq("period_id", currentPeriod.id);
  }

  if (careerFilter) query = query.eq("career_id", careerFilter);

  if (searchTerm) {
    query = query.or(
      `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,national_id.ilike.%${searchTerm}%`,
      { foreignTable: "students" },
    );
  }

  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return { data, count: totalRecords || 0 };
};

const HistoricalScholarshipTable = () => {
  const queryClient = useQueryClient();
  const { data: periods } = useAcademicPeriods();

  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [careerFilter, setCareerFilter] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: facultiesData } = useQuery({
    queryKey: ["faculties"],
    queryFn: async () => {
      const { data } = await supabase
        .from("faculties")
        .select("id, name")
        .order("name");
      return data;
    },
  });

  const { data: allCareersData } = useQuery({
    queryKey: ["allCareers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("careers")
        .select("id, name, faculty_id")
        .order("name");
      return data;
    },
  });

  const careersData = facultyFilter
    ? allCareersData?.filter((c) => c.faculty_id === facultyFilter)
    : [];

  const handleFacultyChange = (fId) => {
    setFacultyFilter(fId);
    setCareerFilter(""); // clear career filter when faculty changes
    setPage(0);
  };

  const { data, isLoading } = useQuery({
    queryKey: [
      "historicalScholars",
      page,
      debouncedSearch,
      careerFilter,
      selectedPeriodId,
    ],
    queryFn: fetchHistoricalScholars,
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-historical-scholars-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scholarship_selections" },
        () =>
          queryClient.invalidateQueries({ queryKey: ["historicalScholars"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const scholars = data?.data;
  const totalCount = data?.count;
  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

  console.log(
    `📈 HISTORICAL - Total scholarship students: ${totalCount}, Page: ${page + 1}/${totalPages}`,
  );
  console.log(`📄 Registros en página actual: ${scholars?.length || 0}`);

  const statusMutation = useMutation({
    mutationFn: async ({
      scholarshipSelectionId,
      newStatus,
      rejectionReason,
    }) => {
      const updates = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (rejectionReason) updates.rejection_reason = rejectionReason;

      const { error } = await supabase
        .from("scholarship_selections")
        .update(updates)
        .eq("id", scholarshipSelectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historicalScholars"] });
    },
  });

  const handleStatusChange = async (
    scholarshipSelectionId,
    newStatus,
    rejectionReason = null,
  ) => {
    try {
      setProcessingId(scholarshipSelectionId);
      await statusMutation.mutateAsync({
        scholarshipSelectionId,
        newStatus,
        rejectionReason,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonLoader key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* FILTERS SECTION */}
      <div className="bg-white rounded-xl p-8 border border-gray-100 space-y-6">
        {/* Período */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            📅 Período Académico
          </label>
          <PeriodSelector
            selectedPeriodId={selectedPeriodId}
            onPeriodChange={setSelectedPeriodId}
            includeHistoricalOnly={true}
          />
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            🔍 Buscar Becario
          </label>
          <input
            type="text"
            placeholder="Nombre, apellido o cédula..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
          />
        </div>

        {/* Grid de filtros: Facultad, Carrera */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Faculty Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              🏫 Facultad
            </label>
            <select
              value={facultyFilter}
              onChange={(e) => handleFacultyChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all cursor-pointer"
            >
              <option value="">Todas las facultades</option>
              {facultiesData?.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>

          {/* Career Filter - Vinculado a Facultad */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              🎓 Carrera
            </label>
            <select
              value={careerFilter}
              onChange={(e) => {
                setCareerFilter(e.target.value);
                setPage(0);
              }}
              disabled={!facultyFilter}
              className={`w-full px-4 py-3 border rounded-lg text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all cursor-pointer ${
                !facultyFilter
                  ? "opacity-50 cursor-not-allowed border-gray-200"
                  : "border-gray-300"
              }`}
            >
              <option value="">
                {facultyFilter
                  ? "Seleccionar carrera..."
                  : "Primero selecciona facultad"}
              </option>
              {careersData?.map((career) => (
                <option key={career.id} value={career.id}>
                  {career.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SCHOLARS CARDS GRID */}
      {scholars && scholars.length > 0 ? (
        <div className="space-y-4">
          {/* Contador total mejorado */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Total de Becarios Históricos
              </p>
              <p className="text-2xl font-black text-blue-900">
                {totalCount?.toLocaleString() || 0}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-blue-600">
                Mostrando página
              </p>
              <p className="text-2xl font-black text-blue-900">
                {page + 1} / {totalPages}
              </p>
            </div>
          </div>

          {/* Resultados en esta página */}
          <div className="text-sm text-gray-500 font-medium">
            📄 {scholars.length} registro{scholars.length !== 1 ? "s" : ""} en
            esta página
          </div>

          <div className="grid grid-cols-1 gap-4">
            {scholars.map((scholarship) => (
              <ScholarshipCard
                key={scholarship.id}
                item={scholarship}
                isProcessing={processingId === scholarship.id}
                onStatusChange={(newStatus, reason) =>
                  handleStatusChange(scholarship.id, newStatus, reason)
                }
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-12 text-center border border-gray-200">
          <p className="text-gray-600 font-medium">
            No hay becarios históricos en este período.
          </p>
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default HistoricalScholarshipTable;
