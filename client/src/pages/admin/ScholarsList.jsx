import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../services/supabaseClient";
import { CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const fetchScholars = async () => {
  // JOIN: Scholarship -> Student -> Career
  const { data, error } = await supabase
    .from("scholarship_selections")
    .select(
      `
      *,
      students (first_name, last_name, national_id, university_email),
      careers (name)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

const ScholarsList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. QUERY: Obtener datos
  const {
    data: scholars,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["scholars"],
    queryFn: fetchScholars,
  });

  // 2. MUTATION: Acción de Auditoría (Ejemplo: Aprobar Pago)
  const payMutation = useMutation({
    mutationFn: async ({ selectionId, studentName }) => {
      // A. Actualizar estado
      const { error: updateError } = await supabase
        .from("scholarship_selections")
        .update({ status: "PAID", payment_date: new Date() })
        .eq("id", selectionId);

      if (updateError) throw updateError;

      // B. Insertar Log de Auditoría (Trazabilidad)
      const { error: auditError } = await supabase.from("audit_logs").insert({
        action: "MARK_PAID",
        target_entity: "scholarship_selections",
        target_id: selectionId,
        performed_by: user.id, // ID del Admin logueado
        details: {
          reason: "Manual payment approval by staff",
          student: studentName,
        },
      });

      if (auditError) throw auditError;
    },
    onSuccess: () => {
      // Invalida la caché para refrescar la tabla automáticamente
      queryClient.invalidateQueries(["scholars"]);
      alert("Pago registrado y auditado correctamente.");
    },
  });

  if (isLoading)
    return <div className="text-center p-10">Cargando becarios...</div>;
  if (error)
    return <div className="text-red-600 p-10">Error: {error.message}</div>;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Listado Maestro de Becarios
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estudiante
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Carrera / Promedio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {scholars.map((scholar) => (
              <tr key={scholar.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {scholar.students?.first_name} {scholar.students?.last_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {scholar.students?.university_email}
                  </div>
                  <div className="text-xs text-gray-400">
                    {scholar.students?.national_id}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {scholar.careers?.name}
                  </div>
                  <div className="text-sm font-bold text-gray-600">
                    Avg: {scholar.average_grade}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${scholar.status === "PAID" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                  >
                    {scholar.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Botones de Acción Simulada */}
                  {scholar.status === "APPROVED" && (
                    <button
                      onClick={() =>
                        payMutation.mutate({
                          selectionId: scholar.id,
                          studentName: `${scholar.students.first_name} ${scholar.students.last_name}`,
                        })
                      }
                      className="text-green-600 hover:text-green-900 flex items-center justify-end gap-1 ml-auto"
                    >
                      <DollarSign size={16} /> Pagar
                    </button>
                  )}
                  {scholar.status !== "PAID" &&
                    scholar.status !== "APPROVED" && (
                      <span className="text-gray-400 text-xs">
                        Esperando proceso
                      </span>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScholarsList;
