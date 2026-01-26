import React, { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  Users,
  DollarSign,
  Briefcase,
  AlertOctagon,
} from "lucide-react";

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    budgetTotal: 2500000, // $2.5M (Ejemplo)
    budgetUsed: 0,
    totalApplications: 0,
    acceptanceRate: 0,
    avgProcessingTime: "3.5 días",
  });
  const [funnelData, setFunnelData] = useState([]);

  useEffect(() => {
    fetchStrategicData();
  }, []);

  const fetchStrategicData = async () => {
    // 1. Obtener conteos por estado para el Funnel
    const { data: statusCounts } = await supabase
      .from("scholarship_selections")
      .select("status");

    // Procesar datos para gráficos
    const counts = statusCounts.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});

    const total = statusCounts.length;
    const paid = counts["PAID"] || 0;

    // Simulamos costo por beca $400
    const used = paid * 400;

    setMetrics((prev) => ({
      ...prev,
      totalApplications: total,
      budgetUsed: used,
      acceptanceRate: total > 0 ? ((paid / total) * 100).toFixed(1) : 0,
    }));

    // Datos del Embudo (Funnel)
    setFunnelData([
      { stage: "Solicitudes", count: total, fill: "#60A5FA" },
      {
        stage: "Documentación",
        count: counts["DOCS_UPLOADED"] || 0,
        fill: "#3B82F6",
      },
      {
        stage: "Aprobados",
        count: (counts["APPROVED"] || 0) + (counts["READY_FOR_PAYMENT"] || 0),
        fill: "#2563EB",
      },
      { stage: "Pagados", count: paid, fill: "#10B981" }, // Verde para el final
    ]);
  };

  // Formatear dinero
  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="text-blue-900" /> Control Estratégico
          </h1>
          <p className="text-gray-500">
            Visión global del programa de becas 2026.
          </p>
        </div>
        <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium">
          Periodo Activo: 2026-I
        </div>
      </div>

      {/* 1. TARJETAS FINANCIERAS Y KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Ejecución Presupuestaria */}
        <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl shadow-card border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-500 font-medium text-sm">
              Ejecución Presupuestaria
            </h3>
            <DollarSign
              className="text-green-600 bg-green-50 p-1 rounded"
              size={24}
            />
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-gray-900">
              {formatCurrency(metrics.budgetUsed)}
            </span>
            <span className="text-gray-400 text-sm mb-1">
              / {formatCurrency(metrics.budgetTotal)}
            </span>
          </div>
          {/* Barra de Progreso */}
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-1000"
              style={{
                width: `${(metrics.budgetUsed / metrics.budgetTotal) * 100}%`,
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-right">
            {((metrics.budgetUsed / metrics.budgetTotal) * 100).toFixed(2)}%
            Ejecutado
          </p>
        </div>

        {/* Tasa de Aceptación */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-gray-500 font-medium text-sm">
              Tasa de Conversión
            </h3>
            <TrendingUp
              className="text-blue-600 bg-blue-50 p-1 rounded"
              size={24}
            />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {metrics.acceptanceRate}%
          </p>
          <p className="text-xs text-green-600 mt-1 flex items-center">
            <TrendingUp size={12} className="mr-1" /> +2.4% vs periodo anterior
          </p>
        </div>

        {/* Alertas Críticas */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-gray-500 font-medium text-sm">
              Casos Críticos
            </h3>
            <AlertOctagon
              className="text-red-600 bg-red-50 p-1 rounded"
              size={24}
            />
          </div>
          <p className="text-3xl font-bold text-gray-900">12</p>
          <p className="text-xs text-red-500 mt-1">
            Requieren intervención manual
          </p>
        </div>
      </div>

      {/* 2. GRÁFICO DE EMBUDO (Funnel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-card border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Embudo de Selección
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="stage"
                  type="category"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="count" barSize={30} radius={[0, 4, 4, 0]}>
                  {/* Colores dinámicos ya definidos en data */}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RENDIMIENTO DEL STAFF (Mini tabla) */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Top Rendimiento Staff
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold text-xs">
                    ST
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Staff User {i}
                    </p>
                    <p className="text-xs text-gray-500">98% Precisión</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600">
                  {150 - i * 12} Rev.
                </span>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-sm text-blue-600 font-medium hover:underline">
            Ver reporte completo
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
