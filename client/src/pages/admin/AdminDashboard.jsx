import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../services/supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  AlertOctagon,
  Loader2,
} from "lucide-react";

const AdminDashboard = () => {
  // CONFIGURACIÓN: Costo promedio por beca (esto podría venir de BD)
  const AVG_SCHOLARSHIP_COST = 400;
  const BUDGET_TOTAL = 2500000;

  // 1. QUERY: Obtención estratégica de datos
  const { data, isLoading } = useQuery({
    queryKey: ["admin-strategic-metrics"],
    queryFn: async () => {
      // Obtenemos solo los estados para minimizar carga de red
      const { data: statusCounts, error } = await supabase
        .from("scholarship_selections")
        .select("status");

      if (error) throw error;

      // Procesamiento de métricas
      const counts = statusCounts.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
      }, {});

      const total = statusCounts.length;
      const paidCount = counts["PAID"] || 0;
      const budgetUsed = paidCount * AVG_SCHOLARSHIP_COST;

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
        funnel,
      };
    },
    // Se refresca cada 5 minutos o cuando la ventana gana foco
    staleTime: 1000 * 60 * 5,
  });

  // Formatear dinero
  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
      </div>
    );
  }

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
        <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium border border-blue-100">
          Periodo Activo: 2026-I
        </div>
      </div>

      {/* 1. TARJETAS FINANCIERAS Y KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
              {formatCurrency(data.budgetUsed)}
            </span>
            <span className="text-gray-400 text-sm mb-1">
              / {formatCurrency(BUDGET_TOTAL)}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${(data.budgetUsed / BUDGET_TOTAL) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-right">
            {((data.budgetUsed / BUDGET_TOTAL) * 100).toFixed(2)}% Ejecutado
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
            {data.acceptanceRate}%
          </p>
          <p className="text-xs text-green-600 mt-1 flex items-center">
            <TrendingUp size={12} className="mr-1" /> Meta: 25% anual
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
          <p className="text-xs text-red-500 mt-1">Requieren intervención</p>
        </div>
      </div>

      {/* 2. GRÁFICO DE EMBUDO (Funnel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Embudo de Selección
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.funnel}
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
                <Bar dataKey="count" barSize={35} radius={[0, 4, 4, 0]}>
                  {data.funnel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RENDIMIENTO STAFF */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Top Rendimiento Staff
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    U{i}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Usuario Staff {i}
                    </p>
                    <p className="text-xs text-gray-500">98% Eficiencia</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600">
                  {150 - i * 15} Rev.
                </span>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 px-4 text-sm text-blue-600 font-semibold border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors">
            Ver Auditoría Completa
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
