import React from "react";
import { Users, BookOpen, Calendar } from "lucide-react";
import ActionButtons from "../ActionButtons";
import Badge from "../../atoms/Badge";

/**
 * MOLECULE: ScholarshipCard
 * Tarjeta responsive para mostrar información de beca individual
 * Reemplaza ScholarshipTableRow para mejor responsividad mobile
 */
const ScholarshipCard = ({ item, onStatusChange, onGenerateContract }) => {
  const getStatusColor = (status) => {
    const colors = {
      DOCS_UPLOADED: "bg-blue-50 border-blue-200",
      APPROVED: "bg-green-50 border-green-200",
      CONTRACT_GENERATED: "bg-purple-50 border-purple-200",
      CONTRACT_UPLOADED: "bg-indigo-50 border-indigo-200",
      READY_FOR_PAYMENT: "bg-amber-50 border-amber-200",
      PAID: "bg-green-50 border-green-200",
      CHANGES_REQUESTED: "bg-red-50 border-red-200",
      CONTRACT_REJECTED: "bg-red-50 border-red-200",
    };
    return colors[status] || "bg-gray-50 border-gray-200";
  };

  return (
    <div
      className={`rounded-lg border-2 p-5 transition-all hover:shadow-lg ${getStatusColor(
        item.status,
      )}`}
    >
      {/* Header: Nombre y Cédula */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">
            {item.students.first_name} {item.students.last_name}
          </h3>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Users size={14} /> {item.students.national_id}
          </p>
        </div>
        <Badge variant="default" className="text-xs">
          {item.status}
        </Badge>
      </div>

      {/* Body: Carrera y Período */}
      <div className="space-y-3 mb-5 pb-5 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm">
          <BookOpen size={16} className="text-brand-blue" />
          <span className="text-gray-700">{item.careers.name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={16} className="text-brand-blue" />
          <span className="text-gray-600">
            {new Date(item.created_at).toLocaleDateString("es-EC", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Footer: Acciones */}
      <div className="flex justify-end">
        <ActionButtons
          status={item.status}
          item={item}
          onStatusChange={onStatusChange}
          onGenerateContract={onGenerateContract}
        />
      </div>
    </div>
  );
};

export default ScholarshipCard;
