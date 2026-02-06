/**
 * AUDIT LOGS DASHBOARD - SPRINT 17
 * Visualiza todas las acciones registradas para compliance y debugging
 */

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import { logger } from "@/utils/logger";
import { useDebounce } from "@/hooks/useDebounce";
import { format } from "date-fns";
import SkeletonLoader from "@/components/ui/SkeletonLoader";

const AuditLogsDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    action: "",
    entity: "",
    startDate: null,
    endDate: null,
    userId: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 20,
  });

  const debouncedFilters = useDebounce(filters, 500);

  // Cargar audit logs
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      let query = supabase.from("audit_logs").select("*", { count: "exact" });

      // Aplicar filtros
      if (debouncedFilters.action) {
        query = query.eq("action", debouncedFilters.action);
      }
      if (debouncedFilters.entity) {
        query = query.eq("target_entity", debouncedFilters.entity);
      }
      if (debouncedFilters.startDate) {
        query = query.gte(
          "created_at",
          new Date(debouncedFilters.startDate).toISOString(),
        );
      }
      if (debouncedFilters.endDate) {
        query = query.lte(
          "created_at",
          new Date(debouncedFilters.endDate).toISOString(),
        );
      }
      if (debouncedFilters.userId) {
        query = query.eq("user_id", debouncedFilters.userId);
      }

      // Paginación y orden
      const offset = (pagination.currentPage - 1) * pagination.pageSize;
      const {
        data,
        count,
        error: queryError,
      } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + pagination.pageSize - 1);

      if (queryError) throw queryError;

      setLogs(data || []);
      logger.info("AuditLogs", "Logs cargados", {
        count: data?.length,
        totalCount: count,
      });
      setError(null);
    } catch (err) {
      logger.error("AuditLogs", "Error cargando logs", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar logs cuando cambien filtros
  useEffect(() => {
    setPagination({ ...pagination, currentPage: 1 });
  }, [debouncedFilters]);

  // Cargar logs
  useEffect(() => {
    fetchAuditLogs();
  }, [debouncedFilters, pagination]);

  // Exportar logs (CSV)
  const handleExport = () => {
    try {
      const csv = [
        ["Acción", "Entidad", "ID Entidad", "Usuario", "Fecha", "Detalles"],
        ...logs.map((log) => [
          log.action,
          log.target_entity,
          log.target_id || "-",
          log.user_id || "-",
          format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
          JSON.stringify(log.details).slice(0, 50),
        ]),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `audit-logs-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`;
      link.click();

      logger.info("AuditLogs", "Logs exportados a CSV", {
        rowCount: logs.length,
      });
    } catch (err) {
      logger.error("AuditLogs", "Error exportando logs", err);
    }
  };

  // Obtener color por acción
  const getActionColor = (action) => {
    const colors = {
      CREATE_STAFF: "bg-green-100 text-green-800",
      UPDATE_STAFF: "bg-blue-100 text-blue-800",
      DELETE_STAFF: "bg-red-100 text-red-800",
      UPLOAD_EXCEL: "bg-purple-100 text-purple-800",
      LOGIN: "bg-cyan-100 text-cyan-800",
      LOGOUT: "bg-gray-100 text-gray-800",
      ERROR_TRACKED: "bg-red-100 text-red-800",
      DEFAULT: "bg-gray-100 text-gray-700",
    };
    return colors[action] || colors.DEFAULT;
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={fetchAuditLogs}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Registro de Auditoría
        </h1>
        <button
          onClick={handleExport}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
        >
          📥 Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 bg-white p-6 rounded-lg border border-gray-200">
        <input
          type="text"
          placeholder="Filtrar por acción..."
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Filtrar por entidad..."
          value={filters.entity}
          onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={filters.startDate || ""}
          onChange={(e) =>
            setFilters({ ...filters, startDate: e.target.value })
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={filters.endDate || ""}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() =>
            setFilters({
              action: "",
              entity: "",
              startDate: null,
              endDate: null,
              userId: "",
            })
          }
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
        >
          Limpiar
        </button>
      </div>

      {/* Tabla de logs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-6 py-4 flex gap-4">
                <SkeletonLoader className="h-8 w-20 rounded" />
                <SkeletonLoader className="h-8 w-24 rounded" />
                <SkeletonLoader className="h-8 w-28 rounded flex-1" />
                <SkeletonLoader className="h-8 w-24 rounded" />
                <SkeletonLoader className="h-8 w-40 rounded" />
                <SkeletonLoader className="h-8 w-32 rounded" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            No hay registros que coincidan
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Entidad
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    ID Entidad
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Detalles
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {log.target_entity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {log.target_id ? log.target_id.slice(0, 12) : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.user_id ? log.user_id.slice(0, 12) : "Sistema"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {JSON.stringify(log.details).slice(0, 40)}...
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {!loading && logs.length > 0 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">
            Página {pagination.currentPage} • {logs.length} registros mostrados
          </div>
          <div className="space-x-2">
            <button
              onClick={() =>
                setPagination({
                  ...pagination,
                  currentPage: Math.max(1, pagination.currentPage - 1),
                })
              }
              disabled={pagination.currentPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <button
              onClick={() =>
                setPagination({
                  ...pagination,
                  currentPage: pagination.currentPage + 1,
                })
              }
              disabled={logs.length < pagination.pageSize}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsDashboard;
