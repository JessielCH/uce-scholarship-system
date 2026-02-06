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
import AcademicRankings from "../../components/organisms/AcademicRankings";

const GuestDashboard = () => {
  const [metrics, setMetrics] = useState({
    total_scholars: 0,
    total_careers: 0,
    total_amount: 0,
    active_periods: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [academicData, setAcademicData] = useState({
    topFaculty: { name: "N/A", average: 0 },
    topCareer: { name: "N/A", average: 0 },
    faculties: [],
    careers: [],
  });

  useEffect(() => {
    async function fetchPublicData() {
      // 1. Count Total Scholarship Students (Only approved/paid for transparency)
      const { count: scholarCount } = await supabase
        .from("scholarship_selections")
        .select("*", { count: "exact", head: true })
        .in("status", ["APPROVED", "PAID", "READY_FOR_PAYMENT"]);

      // 2. Carreras Beneficiadas
      const { count: careerCount } = await supabase
        .from("careers")
        .select("*", { count: "exact", head: true });

      // 3. Monto Invertido
      const { data: investments } = await supabase
        .from("scholarship_selections")
        .select("amount_awarded")
        .eq("status", "PAID");

      const totalInvested =
        investments?.reduce(
          (sum, item) => sum + (item.amount_awarded || 400),
          0,
        ) || 0;

      // 4. Fetch academic rankings for approved/paid scholarships only
      const { data: facultyMetrics } = await supabase
        .from("scholarship_selections")
        .select("average_grade, careers(faculty_id, faculties(name))")
        .in("status", ["APPROVED", "PAID", "READY_FOR_PAYMENT"]);

      const { data: careerMetrics } = await supabase
        .from("scholarship_selections")
        .select("average_grade, careers(name)")
        .in("status", ["APPROVED", "PAID", "READY_FOR_PAYMENT"]);

      // Calculate faculty averages
      const facultyAverages = {};
      facultyMetrics?.forEach((item) => {
        const facultyName = item.careers?.faculties?.name || "Unknown";
        if (!facultyAverages[facultyName]) {
          facultyAverages[facultyName] = { sum: 0, count: 0 };
        }
        facultyAverages[facultyName].sum += item.average_grade || 0;
        facultyAverages[facultyName].count += 1;
      });

      // Calculate career averages
      const careerAverages = {};
      careerMetrics?.forEach((item) => {
        const careerName = item.careers?.name || "Unknown";
        if (!careerAverages[careerName]) {
          careerAverages[careerName] = { sum: 0, count: 0 };
        }
        careerAverages[careerName].sum += item.average_grade || 0;
        careerAverages[careerName].count += 1;
      });

      const faculties = Object.entries(facultyAverages)
        .map(([name, data]) => ({
          name,
          average: (data.sum / data.count).toFixed(2),
        }))
        .sort((a, b) => parseFloat(b.average) - parseFloat(a.average));

      const careers = Object.entries(careerAverages)
        .map(([name, data]) => ({
          name,
          average: (data.sum / data.count).toFixed(2),
        }))
        .sort((a, b) => parseFloat(b.average) - parseFloat(a.average));

      setMetrics({
        total_scholars: scholarCount || 0,
        total_careers: careerCount || 0,
        total_amount: totalInvested,
        active_periods: 1,
      });

      setAcademicData({
        topFaculty: faculties[0] || { name: "N/A", average: 0 },
        topCareer: careers[0] || { name: "N/A", average: 0 },
        faculties,
        careers,
      });

      // Mock data for trend chart
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

      {/* ACADEMIC RANKINGS SECTION */}
      <AcademicRankings
        topFaculty={academicData.topFaculty}
        topCareer={academicData.topCareer}
        faculties={academicData.faculties}
        careers={academicData.careers}
      />
    </div>
  );
};

export default GuestDashboard;
