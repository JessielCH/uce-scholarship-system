import React from "react";

/**
 * ORGANISM: StatsCards
 * Tarjetas de estadísticas en el sidebar (Total Aplicantes, Pendientes, Casos Críticos)
 * Reemplaza JSX inline en AdminDashboard
 */
const StatsCards = ({ total, pendingReview, criticalCases }) => {
  return (
    <div className="space-y-4">
      {/* Total Aplicantes */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <p className="text-xs text-gray-500 uppercase font-semibold">
          Total Aplicantes
        </p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{total}</p>
      </div>

      {/* Pendientes Review */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <p className="text-xs text-gray-500 uppercase font-semibold">
          Pendientes Review
        </p>
        <p className="text-3xl font-bold text-yellow-600 mt-1">
          {pendingReview}
        </p>
      </div>

      {/* Casos Críticos */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <p className="text-xs text-gray-500 uppercase font-semibold">
          Casos Críticos
        </p>
        <p className="text-3xl font-bold text-red-600 mt-1">{criticalCases}</p>
      </div>
    </div>
  );
};

export default StatsCards;
