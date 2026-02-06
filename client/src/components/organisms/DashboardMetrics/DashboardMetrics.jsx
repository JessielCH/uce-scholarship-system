import React from "react";
import { DollarSign, TrendingUp, AlertOctagon } from "lucide-react";
import KPICard from "../../molecules/KPICard";

/**
 * ORGANISM: DashboardMetrics
 * Sección de 4 KPI cards para el dashboard admin
 * Integra: KPICard molecules que muestran métricas clave
 */
const DashboardMetrics = ({ data = {} }) => {
  const {
    budgetUsed = 0,
    BUDGET_TOTAL = 2500000,
    acceptanceRate = 0,
    criticalCases = 0,
  } = data;

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  const budgetPercentage = ((budgetUsed / BUDGET_TOTAL) * 100).toFixed(2);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
      {/* Budget Card */}
      <div className="col-span-1 md:col-span-2">
        <KPICard
          title="Budget Execution"
          value={formatCurrency(budgetUsed)}
          unit={`/ ${formatCurrency(BUDGET_TOTAL)}`}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
          footer={`${budgetPercentage}% Executed`}
        >
          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mt-4">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min((budgetUsed / BUDGET_TOTAL) * 100, 100)}%`,
              }}
            />
          </div>
        </KPICard>
      </div>

      {/* Conversion Rate Card */}
      <KPICard
        title="Conversion Rate"
        value={`${acceptanceRate}%`}
        icon={TrendingUp}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-50"
        trend="Target: 25% annual"
        trendColor="text-green-600"
      />

      {/* Critical Cases Card */}
      <KPICard
        title="Critical Cases"
        value={criticalCases}
        icon={AlertOctagon}
        iconColor="text-red-600"
        iconBgColor="bg-red-50"
        trend="Require intervention"
        trendColor="text-red-600"
      />
    </div>
  );
};

export default DashboardMetrics;
