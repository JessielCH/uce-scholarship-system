import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  FileText,
  UploadCloud,
  CheckCircle,
  Clock,
  FileSignature,
  Download,
  FileCheck,
  Search,
  XCircle,
} from "lucide-react";
import Button from "../../atoms/Button";
import StatusBadge from "../../molecules/StatusBadge";

/**
 * ORGANISM: ScholarshipStatusCard
 * Card que muestra el estado actual de la beca y acciones permitidas
 * Integra: StatusBadge, Button atoms
 */
const ScholarshipStatusCard = ({
  scholarship,
  currentStatus,
  statusInfo,
  onUploadBank,
  onUploadContract,
  onDownloadContract,
  onDownloadReceipt,
  isLoading = false,
}) => {
  const STATUS_MAP = {
    SELECTED: { label: "Seleccionado", color: "text-blue-500", icon: Clock },
    DOCS_UPLOADED: {
      label: "Documentos en Revisión",
      color: "text-yellow-500",
      icon: Search,
    },
    CHANGES_REQUESTED: {
      label: "Acción Requerida: Corregir Doc",
      color: "text-red-500",
      icon: AlertCircle,
    },
    APPROVED: {
      label: "Aprobado - Esperando Contrato",
      color: "text-green-500",
      icon: CheckCircle,
    },
    CONTRACT_GENERATED: {
      label: "Contrato Listo para Firmar",
      color: "text-brand-blue",
      icon: FileSignature,
    },
    READY_FOR_PAYMENT: {
      label: "Validando Firma",
      color: "text-purple-500",
      icon: FileCheck,
    },
    PAID: {
      label: "BECA PAGADA",
      color: "text-white font-black",
      icon: CheckCircle,
    },
  };

  const info = STATUS_MAP[currentStatus] || STATUS_MAP.SELECTED;
  const IconComp = info.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6">
      {/* Status Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <FileCheck className="text-brand-blue" size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Tu Solicitud de Beca
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Última actualización:{" "}
              {new Date(scholarship?.updated_at).toLocaleDateString("es-ES")}
            </p>
          </div>
        </div>
        <StatusBadge status={currentStatus} label={info.label} size="lg" />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {currentStatus === "SELECTED" && (
          <Button
            variant="primary"
            size="sm"
            icon={UploadCloud}
            onClick={onUploadBank}
            disabled={isLoading}
          >
            Bank Cert
          </Button>
        )}

        {["DOCS_UPLOADED", "CHANGES_REQUESTED"].includes(currentStatus) && (
          <Button
            variant="primary"
            size="sm"
            icon={UploadCloud}
            onClick={onUploadBank}
            disabled={isLoading}
          >
            Update Docs
          </Button>
        )}

        {currentStatus === "CONTRACT_GENERATED" && (
          <>
            <Button
              variant="primary"
              size="sm"
              icon={UploadCloud}
              onClick={onUploadContract}
              disabled={isLoading}
            >
              Sign Contract
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={onDownloadContract}
              disabled={isLoading}
            >
              Download
            </Button>
          </>
        )}

        {currentStatus === "PAID" && (
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={onDownloadReceipt}
            disabled={isLoading}
          >
            Receipt
          </Button>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold">
            Period
          </p>
          <p className="text-lg font-bold text-gray-900">
            {scholarship?.academic_periods?.name || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold">
            Career
          </p>
          <p className="text-lg font-bold text-gray-900">
            {scholarship?.careers?.name || "N/A"}
          </p>
        </div>
        {scholarship?.bank_account_number && (
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">
              Account
            </p>
            <p className="text-lg font-bold text-gray-900">
              ****{scholarship.bank_account_number.slice(-4)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScholarshipStatusCard;
