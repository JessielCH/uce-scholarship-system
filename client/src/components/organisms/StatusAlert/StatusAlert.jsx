import React from "react";
import { XCircle, AlertCircle } from "lucide-react";
import Alert from "../../atoms/Alert";
import Button from "../../atoms/Button";

/**
 * ORGANISM: StatusAlert
 * Alert inteligente basado en el estado de la beca
 * Muestra acciones necesarias cuando hay rechazo o cambios requeridos
 */
const StatusAlert = ({
  currentStatus,
  rejectionReason,
  onReupload,
  onDownloadReceipt,
  className = "",
}) => {
  const shouldShowRejectAlert = [
    "CHANGES_REQUESTED",
    "CONTRACT_REJECTED",
  ].includes(currentStatus);

  const shouldShowApprovedAlert = currentStatus === "APPROVED";

  if (!shouldShowRejectAlert && !shouldShowApprovedAlert) {
    return null;
  }

  if (shouldShowRejectAlert) {
    return (
      <Alert
        type="error"
        icon={XCircle}
        title="¡Action Required! Document Rejected"
        message={`Reason: "${rejectionReason}"`}
        className={`mb-8 flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse ${className}`}
      >
        <div className="flex-1">
          <p className="text-sm font-medium mt-2">
            Please correct your documents and try again.
          </p>
        </div>
        {onReupload && (
          <Button
            variant="danger"
            size="sm"
            onClick={onReupload}
            className="flex-shrink-0"
          >
            Reupload Documents
          </Button>
        )}
      </Alert>
    );
  }

  if (shouldShowApprovedAlert) {
    return (
      <Alert
        type="success"
        icon={AlertCircle}
        title="✓ Documents Approved!"
        message="Your documents have been approved. A contract is being prepared."
        className={`mb-8 animate-fade-in ${className}`}
      />
    );
  }

  return null;
};

export default StatusAlert;
