import React from "react";
import { Briefcase } from "lucide-react";
import { useAdminMetrics } from "../../hooks/useScholarshipQueries";

// Componentes Atomic Design
import DashboardMetrics from "../../components/organisms/DashboardMetrics";
import FunnelChart from "../../components/organisms/FunnelChart";
import StatsCards from "../../components/organisms/StatsCards";
import Spinner from "../../components/atoms/Spinner";
import Heading from "../../components/atoms/Heading";

const AdminDashboard = () => {
  // Custom hook para obtener métricas
  const { data, isLoading } = useAdminMetrics();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
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
    </div>
  );
};

export default AdminDashboard;
