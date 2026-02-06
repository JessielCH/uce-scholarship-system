import React from "react";
import { Calendar } from "lucide-react";
import { useAcademicPeriods } from "../../../hooks/useScholarshipQueries";

/**
 * MOLECULE: PeriodSelector
 * Selector para cambiar el período académico en dashboards
 */
const PeriodSelector = ({
  selectedPeriodId,
  onPeriodChange,
  className = "",
  includeHistoricalOnly = false,
}) => {
  const { data: periods, isLoading } = useAcademicPeriods();

  if (isLoading) {
    return <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />;
  }

  // Filtrar períodos según el prop includeHistoricalOnly
  const filteredPeriods = includeHistoricalOnly
    ? periods?.filter((p) => !p.is_active) // Solo períodos anteriores
    : periods; // Todos los períodos

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Calendar className="h-5 w-5 text-brand-blue" />
      <select
        value={selectedPeriodId || ""}
        onChange={(e) => onPeriodChange(e.target.value || null)}
        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
      >
        <option value="">
          {includeHistoricalOnly ? "Seleccionar período..." : "Período Activo"}
        </option>
        {filteredPeriods?.map((period) => (
          <option key={period.id} value={period.id}>
            {period.name} {period.is_active && " (Activo)"}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PeriodSelector;
