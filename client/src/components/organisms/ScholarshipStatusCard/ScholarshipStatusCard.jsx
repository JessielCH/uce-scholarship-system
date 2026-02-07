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
import { supabase } from "../../../services/supabaseClient";
import Button from "../../atoms/Button";
import StatusBadge from "../../molecules/StatusBadge";

/**
 * ORGANISM: ScholarshipStatusCard
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
    EXCLUDED: {
      label: "No Seleccionado",
      color: "text-gray-500",
      icon: XCircle,
    },
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
    CONTRACT_REJECTED: {
      label: "Acción Requerida: Corregir Contrato",
      color: "text-red-500",
      icon: AlertCircle,
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

        {currentStatus === "CONTRACT_REJECTED" && (
          <Button
            variant="primary"
            size="sm"
            icon={UploadCloud}
            onClick={onUploadContract}
            disabled={isLoading}
          >
            Re-Upload Contract
          </Button>
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

      {/* Documents Section */}
      <div className="pt-6 border-t border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="text-brand-blue" size={20} />
          Documentos Subidos
          {scholarship?.documents && scholarship.documents.length > 0 && (
            <span className="ml-2 text-sm font-normal bg-blue-100 text-brand-blue px-2 py-1 rounded-full">
              {scholarship.documents.length}
            </span>
          )}
        </h3>

        {scholarship?.documents && scholarship.documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scholarship.documents.map((doc) => {
              const docTypeLabel =
                {
                  BANK_ACCOUNT_VERIFICATION: "Verificación Bancaria",
                  CONTRACT_UNSIGNED: "Contrato sin Firmar",
                  CONTRACT_SIGNED: "Contrato Firmado",
                  PAYMENT_RECEIPT: "Recibo de Pago",
                  IDENTITY_VERIFICATION: "Cédula de Identidad",
                }[doc.document_type] || doc.document_type;

              return (
                <div
                  key={doc.id}
                  className="flex flex-col bg-gradient-to-br from-blue-50 to-gray-50 p-4 rounded-lg border border-blue-100 hover:border-brand-blue transition-all hover:shadow-md"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <FileText
                      className="text-brand-blue flex-shrink-0 mt-1"
                      size={20}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {docTypeLabel}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                        <span className="bg-white px-2 py-1 rounded border border-gray-200">
                          v{doc.version}
                        </span>
                        <span>
                          {new Date(doc.created_at).toLocaleDateString(
                            "es-ES",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Download}
                    className="w-full"
                    onClick={async () => {
                      try {
                        const { data: urlData, error } = await supabase.storage
                          .from("scholarship-docs")
                          .createSignedUrl(doc.file_path, 60);
                        if (error) throw error;
                        window.open(urlData.signedUrl, "_blank");
                      } catch (e) {
                        console.error("Error downloading:", e);
                        alert("Could not download document");
                      }
                    }}
                  >
                    Descargar
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <AlertCircle className="text-yellow-600 mx-auto mb-2" size={24} />
            <p className="text-sm text-yellow-800">
              Aún no hay documentos subidos. Empieza cargando tu verificación
              bancaria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScholarshipStatusCard;
