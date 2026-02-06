import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabaseClient";

/**
 * CUSTOM HOOK: useStudentDashboardData
 * Abstracts student dashboard data fetching logic
 */
export const useStudentDashboardData = (userEmail, enabled = true) => {
  return useQuery({
    queryKey: ["student-dashboard", userEmail],
    queryFn: async () => {
      const { data: student, error: stuError } = await supabase
        .from("students")
        .select("*")
        .eq("university_email", userEmail)
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
    enabled: enabled && !!userEmail,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * CUSTOM HOOK: useAdminMetrics
 * Abstracts admin dashboard metrics fetching
 */
export const useAdminMetrics = () => {
  const AVG_SCHOLARSHIP_COST = 400;
  const BUDGET_TOTAL = 2500000;

  return useQuery({
    queryKey: ["admin-strategic-metrics"],
    queryFn: async () => {
      const { data: statusCounts, error: statusError } = await supabase
        .from("scholarship_selections")
        .select("status");

      if (statusError) throw statusError;

      const { data: periodData } = await supabase
        .from("academic_periods")
        .select("name")
        .eq("is_active", true)
        .maybeSingle();

      const counts = statusCounts.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
      }, {});

      const total = statusCounts.length;
      const paidCount = counts["PAID"] || 0;
      const budgetUsed = paidCount * AVG_SCHOLARSHIP_COST;
      const criticalCases =
        (counts["CHANGES_REQUESTED"] || 0) + (counts["CONTRACT_REJECTED"] || 0);

      const funnel = [
        { stage: "Solicitudes", count: total, color: "#60A5FA" },
        {
          stage: "Docs. Subidos",
          count: counts["DOCS_UPLOADED"] || 0,
          color: "#3B82F6",
        },
        {
          stage: "Aprobados",
          count: (counts["APPROVED"] || 0) + (counts["READY_FOR_PAYMENT"] || 0),
          color: "#2563EB",
        },
        { stage: "Pagados", count: paidCount, color: "#10B981" },
      ];

      return {
        total,
        budgetUsed,
        acceptanceRate: total > 0 ? ((paidCount / total) * 100).toFixed(1) : 0,
        criticalCases: criticalCases || 0,
        periodName: periodData?.name || "N/A",
        funnel,
      };
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
};
