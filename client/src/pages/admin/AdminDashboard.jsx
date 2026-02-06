import React from "react";
import { Briefcase } from "lucide-react";
import { useAdminMetrics } from "../../hooks/useScholarshipQueries";

// Componentes Atomic Design
import DashboardMetrics from "../../components/organisms/DashboardMetrics";
import FunnelChart from "../../components/organisms/FunnelChart";
import StatsCards from "../../components/organisms/StatsCards";
import AcademicRankings from "../../components/organisms/AcademicRankings";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import Heading from "../../components/atoms/Heading";

const AdminDashboard = () => {
  // Custom hook para obtener métricas
  const { data, isLoading } = useAdminMetrics();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1">
            <SkeletonLoader className="h-10 w-48 mb-2" />
            <SkeletonLoader className="h-4 w-96" />
          </div>
          <SkeletonLoader className="h-10 w-32" />
        </div>

        {/* Metrics Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonLoader key={i} className="h-40 rounded-xl" />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonLoader className="h-80 rounded-xl" />
          </div>
          <div>
            <SkeletonLoader className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER*/}
      <div className="flex justify-between items-end">
        <div>
          <Heading level="h1" size="xl" className="flex items-center gap-2">
            <Briefcase className="text-brand-blue" /> Control Estratégico
          </Heading>
          <p className="text-gray-500">Visión global del programa de becas.</p>
        </div>
        <div className="bg-blue-50 text-brand-blue px-4 py-2 rounded-lg text-sm font-medium border border-blue-100">
          Periodo Activo: {data.periodName}
        </div>
      </div>

      {/* METRICS ORGANISMS - Componente Atomic Design */}
      <DashboardMetrics data={data} />

      {/* FUNNEL CHART ORGANISM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FunnelChart funnel={data.funnel} />
        </div>

        {/* STATS CARDS ORGANISM */}
        <StatsCards
          total={data.total}
          pendingReview={data.funnel[1].count}
          criticalCases={data.criticalCases}
        />
      </div>

      {/* ACADEMIC RANKINGS ORGANISM */}
      <AcademicRankings
        topFaculty={data.topFaculty}
        topCareer={data.topCareer}
        faculties={data.faculties}
        careers={data.careers}
      />
    </div>
  );
};

export default AdminDashboard;
