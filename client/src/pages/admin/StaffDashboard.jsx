import React, { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { logger } from "../../utils/logger";
import {
  useAdminMetrics,
  useAcademicPeriods,
} from "../../hooks/useScholarshipQueries";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Users,
  FileText,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Activity,
} from "lucide-react";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import CurrentPeriodBadge from "../../components/molecules/CurrentPeriodBadge";
import AcademicRankings from "../../components/organisms/AcademicRankings";

const StaffDashboard = () => {
  const { data: periods } = useAcademicPeriods();
  const currentPeriod = periods?.find((p) => p.is_active);
  const { data, isLoading } = useAdminMetrics(currentPeriod?.id);

  const [stats, setStats] = useState({
    total: 0,
    pendingDocs: 0,
    pendingContracts: 0,
    approved: 0,
    paid: 0,
    rejected: 0,
  });

  useEffect(() => {
    if (data) {
      // Extract stats from funnel data
      const pendingDocs =
        data.funnel.find((f) => f.stage === "Docs. Subidos")?.count || 0;
      const approved =
        data.funnel.find((f) => f.stage === "Aprobados")?.count || 0;
      const paid = data.funnel.find((f) => f.stage === "Pagados")?.count || 0;

      setStats({
        total: data.total,
        pendingDocs,
        pendingContracts: 0, // Can be calculated if needed
        approved,
        paid,
        rejected: data.criticalCases,
      });
    }
  }, [data]);

  // Data for graphs
  const barData = [
    { name: "Revisión Docs", count: stats.pendingDocs, color: "#F59E0B" }, // Amarillo
    { name: "Contratos", count: stats.pendingContracts, color: "#3B82F6" }, // Azul
    { name: "Listos Pago", count: stats.approved, color: "#10B981" }, // Verde
    { name: "Finalizados", count: stats.paid, color: "#059669" }, // Verde Oscuro
  ];

  const pieData = [
    { name: "Pagado", value: stats.paid, color: "#10B981" },
    { name: "Pendiente", value: stats.total - stats.paid, color: "#E5E7EB" },
  ];

  if (isLoading)
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header Skeleton */}
        <div>
          <SkeletonLoader className="h-8 w-64 mb-2 rounded-lg" />
          <SkeletonLoader className="h-4 w-96 rounded-lg" />
        </div>

        {/* KPI Cards Skeleton */}
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-uce-blue" /> Panel de Control Operativo
          </h1>
          <p className="text-gray-500">
            Resumen de la actividad de becas en tiempo real.
          </p>
        </div>
        <CurrentPeriodBadge />
      </div>

      {/* KPI CARDS - Estilo Visily */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1: Pendientes de Revisión (Prioridad) */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Pendientes Revisión
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {stats.pendingDocs}
              </h3>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600">
              <FileText size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-yellow-600 font-medium">
            <AlertTriangle size={14} className="mr-1" /> Requieren atención
            inmediata
          </div>
        </div>

        {/* Card 2: Contratos por Validar */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Contratos Nuevos
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {stats.pendingContracts}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            Esperando firma legal
          </div>
        </div>

        {/* Card 3: Becas Pagadas */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Desembolsado
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {stats.paid}
              </h3>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <CheckCircle size={14} className="mr-1" /> Ciclo completado
          </div>
        </div>

        {/* Card 4: Total Estudiantes */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Procesados
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {stats.total}
              </h3>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-gray-600">
              <Users size={24} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            Periodo Académico Actual
          </div>
        </div>
      </div>

      {/* CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-card border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Flujo de Solicitudes
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={50}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Progress Chart */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2 w-full text-left">
            Tasa de Finalización
          </h3>
          <div className="h-48 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Texto Central */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-gray-900">
                {stats.total > 0
                  ? Math.round((stats.paid / stats.total) * 100)
                  : 0}
                %
              </span>
              <span className="text-xs text-gray-400 uppercase">
                Completado
              </span>
            </div>
          </div>
          <p className="text-sm text-center text-gray-500 mt-4">
            {stats.paid} becas pagadas de {stats.total} solicitudes totales.
          </p>
        </div>
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

export default StaffDashboard;
