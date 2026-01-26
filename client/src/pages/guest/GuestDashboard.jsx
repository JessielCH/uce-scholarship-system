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
  AreaChart,
  Area,
} from "recharts";
import { Users, BookOpen, DollarSign, Award } from "lucide-react";

const GuestDashboard = () => {
  const [metrics, setMetrics] = useState({
    total_scholars: 0,
    total_careers: 0,
    total_amount: 0,
    active_periods: 0,
  });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    async function fetchPublicData() {
      // 1. Contar Becarios Totales (Solo aprobados/pagados para transparencia)
      const { count: scholarCount } = await supabase
        .from("scholarship_selections")
        .select("*", { count: "exact", head: true })
        .in("status", ["APPROVED", "PAID", "READY_FOR_PAYMENT"]);

      // 2. Carreras Beneficiadas (Simulado o count distinct si SQL lo permite, haremos aproximación)
      const { count: careerCount } = await supabase
        .from("careers")
        .select("*", { count: "exact", head: true });

      // 3. Monto Invertido (Suma manual del cliente por ahora, idealmente una RPC)
      const { data: investments } = await supabase
        .from("scholarship_selections")
        .select("amount_awarded")
        .eq("status", "PAID");

      const totalInvested =
        investments?.reduce(
          (sum, item) => sum + (item.amount_awarded || 400),
          0,
        ) || 0;

      setMetrics({
        total_scholars: scholarCount || 0,
        total_careers: careerCount || 0,
        total_amount: totalInvested,
        active_periods: 1, // Hardcoded por ahora
      });

      // Datos ficticios para gráfico de tendencia (o reales si tienes historial)
      setChartData([
        { name: "Ene", value: 120 },
        { name: "Feb", value: 300 },
        { name: "Mar", value: scholarCount || 450 },
      ]);
    }
    fetchPublicData();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HERO SECTION */}
      <div className="text-center py-10">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Impacto Social y Académico
        </h2>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          Visualización transparente de la asignación de recursos y cobertura de
          becas estudiantiles.
        </p>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-uce-blue">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <Users className="h-6 w-6 text-uce-blue" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Becarios Beneficiados
                </dt>
                <dd className="text-3xl font-semibold text-gray-900">
                  {metrics.total_scholars}
                </dd>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-green-500">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Inversión Total
                </dt>
                <dd className="text-3xl font-semibold text-gray-900">
                  ${metrics.total_amount.toLocaleString()}
                </dd>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-purple-500">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Carreras Cubiertas
                </dt>
                <dd className="text-3xl font-semibold text-gray-900">
                  {metrics.total_careers}
                </dd>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-yellow-500">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Excelencia Académica
                </dt>
                <dd className="text-3xl font-semibold text-gray-900">
                  Top 10%
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHART SECTION */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Crecimiento de Cobertura (Periodo Actual)
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#003876" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#003876" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#003876"
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default GuestDashboard;
