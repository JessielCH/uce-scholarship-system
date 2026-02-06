import React from "react";
import {
  Users,
  BookOpen,
  Calendar,
  FileText,
  Download,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../../services/supabaseClient";
import ActionButtons from "../ActionButtons";
import Badge from "../../atoms/Badge";
import Button from "../../atoms/Button";

/**
 * MOLECULE: ScholarshipCard
 * Tarjeta responsive para mostrar información de beca individual
 * Reemplaza ScholarshipTableRow para mejor responsividad mobile
 */
const ScholarshipCard = ({ item, onStatusChange, onGenerateContract }) => {
  const getStatusLabel = (status) => {
    const labels = {
      SELECTED: "✓ Becado",
      EXCLUDED: "✗ Excluido",
      DOCS_UPLOADED: "Docs. Cargados",
      APPROVED: "Aprobado",
      CONTRACT_GENERATED: "Contrato Generado",
      CONTRACT_UPLOADED: "Contrato Cargado",
      READY_FOR_PAYMENT: "Listo para Pago",
      PAID: "Pagado",
      CHANGES_REQUESTED: "Cambios Solicitados",
      CONTRACT_REJECTED: "Contrato Rechazado",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      SELECTED: "bg-green-50 border-green-200",
      EXCLUDED: "bg-gray-50 border-gray-300",
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
          {getStatusLabel(item.status)}
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

      {/* Documents Section - AUDITORÍA Y RECLAMOS */}
      {item.documents && item.documents.length > 0 && (
        <div className="mb-5 pb-5 border-b border-gray-200">
          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <FileText size={16} className="text-brand-blue" />
            Documentos ({item.documents.length})
          </h4>
          <div className="space-y-2">
            {item.documents.map((doc) => {
              const docTypeLabel =
                {
                  BANK_ACCOUNT_VERIFICATION: "🏦 Verificación Bancaria",
                  CONTRACT_UNSIGNED: "📝 Contrato sin Firmar",
                  CONTRACT_SIGNED: "✅ Contrato Firmado",
                  PAYMENT_RECEIPT: "💰 Recibo de Pago",
                  IDENTITY_VERIFICATION: "🆔 Cédula de Identidad",
                }[doc.document_type] || doc.document_type;

              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between bg-white rounded p-2 border border-gray-100 hover:border-brand-blue transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">
                      {docTypeLabel}
                    </p>
                    <p className="text-xs text-gray-500">
                      v{doc.version} •{" "}
                      {new Date(doc.created_at).toLocaleDateString("es-EC")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Download}
                    onClick={async () => {
                      try {
                        const { data: urlData, error } = await supabase.storage
                          .from("scholarship-docs")
                          .createSignedUrl(doc.file_path, 60);
                        if (error) throw error;
                        window.open(urlData.signedUrl, "_blank");
                      } catch (e) {
                        console.error("Error al descargar:", e);
                        alert("No se pudo descargar el documento");
                      }
                    }}
                    className="ml-2 flex-shrink-0"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Documents Warning - CRITICAL FOR AUDIT TRAIL */}
      {(!item.documents || item.documents.length === 0) && (
        <div className="mb-5 pb-5 border-b border-yellow-200 flex items-start gap-2 bg-yellow-50 p-3 rounded">
          <AlertCircle
            size={16}
            className="text-yellow-600 flex-shrink-0 mt-0.5"
          />
          <div className="text-xs text-yellow-700">
            <p className="font-semibold">Sin documentos cargados</p>
            <p>Estudiante no ha enviado documentación requerida</p>
          </div>
        </div>
      )}

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
