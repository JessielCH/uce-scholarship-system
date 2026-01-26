import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../services/supabaseClient";
import {
  Search,
  Filter,
  Eye,
  Clock,
  ShieldAlert,
  X,
  FileJson,
} from "lucide-react";

const fetchLogs = async () => {
  const { data, error } = await supabase
    .from("audit_logs")
    .select(
      `
      *,
      profiles:performed_by (full_name, email, role)
    `,
    )
    .order("timestamp", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data;
};

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const {
    data: logs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: fetchLogs,
    refetchInterval: 30000,
  });

  const filteredLogs = logs?.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      log.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getActionColor = (action) => {
    if (action.includes("REJECT") || action.includes("DELETE"))
      return "text-red-700 bg-red-100";
    if (action.includes("APPROVE") || action.includes("PAID"))
      return "text-green-700 bg-green-100";
    if (action.includes("UPLOAD")) return "text-blue-700 bg-blue-100";
    return "text-gray-700 bg-gray-100";
  };

  if (isLoading)
    return (
      <div className="p-8 text-center text-gray-500">Cargando auditoría...</div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-red-500">Error: {error.message}</div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="text-uce-blue" /> Auditoría del Sistema
          </h1>
          <p className="text-gray-500 text-sm">
            Registro inmutable de acciones.
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-uce-blue focus:border-uce-blue sm:text-sm"
            placeholder="Buscar usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-card rounded-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha / Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Detalles
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs?.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      {new Date(log.timestamp).toLocaleString("es-EC")}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-xs mr-3 border border-blue-200">
                        {log.profiles?.full_name
                          ? log.profiles.full_name.charAt(0)
                          : "?"}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {log.profiles?.full_name || "Usuario del Sistema"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.profiles?.email ||
                            "ID: " +
                              (log.performed_by?.substring(0, 8) || "System")}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getActionColor(log.action)}`}
                    >
                      {log.action}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">
                      Ref: {log.target_entity}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-uce-blue hover:text-blue-800 flex items-center gap-1 font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100"
                    >
                      <Eye size={16} /> Ver Datos
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL DE DETALLES MEJORADO --- */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden transform transition-all scale-100">
            {/* Header del Modal con Botón X */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileJson className="text-uce-blue" /> Detalles Técnicos del
                Evento
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Contenido JSON */}
            <div className="p-6">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-auto max-h-96 shadow-inner border border-gray-700">
                <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
              </div>
            </div>

            {/* Footer del Modal con Botón Cerrar */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uce-blue shadow-sm"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
