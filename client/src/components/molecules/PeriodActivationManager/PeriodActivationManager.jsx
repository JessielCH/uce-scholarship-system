import React, { useState } from "react";
import { useAcademicPeriods } from "../../hooks/useScholarshipQueries";
import { supabase } from "../../services/supabaseClient";
import {
  Calendar,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { logger } from "../../utils/logger";

/**
 * MOLECULE: PeriodActivationManager
 * Permite al admin marcar qué período es el actual/activo
 */
const PeriodActivationManager = () => {
  const { data: periods, isLoading, refetch } = useAcademicPeriods();
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const currentActive = periods?.find((p) => p.is_active);

  const handleSetActive = async (periodId) => {
    setIsSaving(true);
    setStatus({ type: "", message: "" });

    try {
      // 1. Desactivar todos los períodos
      const { error: deactivateError } = await supabase
        .from("academic_periods")
        .update({ is_active: false })
        .neq("id", periodId);

      if (deactivateError) throw deactivateError;

      // 2. Activar el período seleccionado
      const { error: activateError } = await supabase
        .from("academic_periods")
        .update({ is_active: true })
        .eq("id", periodId);

      if (activateError) throw activateError;

      logger.info("PeriodActivationManager", "Período actual cambiado", {
        periodId,
        periodName: periods.find((p) => p.id === periodId)?.name,
      });

      setStatus({
        type: "success",
        message: "✅ Período actual actualizado correctamente",
      });

      refetch();
    } catch (error) {
      logger.error(
        "PeriodActivationManager",
        "Error al cambiar período",
        error,
      );
      setStatus({
        type: "error",
        message: `❌ Error: ${error.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-100 rounded-lg">
          <Calendar className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-900">
            Período Académico Actual
          </h3>
          <p className="text-sm text-gray-500">
            Define cuál es el período activo para ingesta de datos
          </p>
        </div>
      </div>

      {currentActive && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-bold">Período Actual:</span>
          </p>
          <p className="text-2xl font-black text-purple-600">
            {currentActive.name}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
          Cambiar a:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {periods?.map((period) => (
            <button
              key={period.id}
              onClick={() => handleSetActive(period.id)}
              disabled={isSaving || period.is_active}
              className={`p-3 rounded-lg font-bold text-sm transition-all ${
                period.is_active
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {period.name}
              {period.is_active && (
                <div className="text-xs mt-1 opacity-90">✓ Activo</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {status.message && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
            status.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          {status.message}
        </div>
      )}
    </div>
  );
};

export default PeriodActivationManager;
