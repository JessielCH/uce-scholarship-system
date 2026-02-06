import React, { useState } from "react";
import { CheckCircle, XCircle, FileText, DollarSign } from "lucide-react";
import Button from "../../atoms/Button";
import { AlertCircle } from "lucide-react";
import RejectionModal from "../RejectionModal";

/**
 * MOLECULE: ActionButtons
 * Context-dependent action buttons based on scholarship status
 * Soporta: DOCS_UPLOADED, APPROVED, CONTRACT_UPLOADED, READY_FOR_PAYMENT, PAID
 */
const ActionButtons = ({
  status,
  item,
  onStatusChange,
  onGenerateContract,
}) => {
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionType, setRejectionType] = useState(null);
  if (status === "DOCS_UPLOADED") {
    return (
      <>
        <RejectionModal
          isOpen={rejectionModalOpen && rejectionType === "DOCS"}
          onClose={() => setRejectionModalOpen(false)}
          onConfirm={(reason) => {
            onStatusChange({
              id: item.id,
              newStatus: "CHANGES_REQUESTED",
              student: item.students,
              reason: reason,
            });
            setRejectionModalOpen(false);
          }}
          documentType="Documentos"
        />
        <div className="flex justify-end items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={XCircle}
            onClick={() => {
              setRejectionType("DOCS");
              setRejectionModalOpen(true);
            }}
          />
          <Button
            variant="primary"
            size="sm"
            icon={CheckCircle}
            onClick={() =>
              onStatusChange({
                id: item.id,
                newStatus: "APPROVED",
                student: item.students,
              })
            }
          />
        </div>
      </>
    );
  }

  if (status === "APPROVED") {
    return (
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="sm"
          icon={FileText}
          onClick={() =>
            onGenerateContract({
              selection: item,
              student: item.students,
            })
          }
        >
          Contrato
        </Button>
      </div>
    );
  }

  if (status === "CONTRACT_UPLOADED") {
    return (
      <>
        <RejectionModal
          isOpen={rejectionModalOpen && rejectionType === "CONTRACT"}
          onClose={() => setRejectionModalOpen(false)}
          onConfirm={(reason) => {
            onStatusChange({
              id: item.id,
              newStatus: "CONTRACT_REJECTED",
              student: item.students,
              reason: reason,
            });
            setRejectionModalOpen(false);
          }}
          documentType="Contrato"
        />
        <div className="flex justify-end items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={XCircle}
            onClick={() => {
              setRejectionType("CONTRACT");
              setRejectionModalOpen(true);
            }}
          />
          <Button
            variant="primary"
            size="sm"
            icon={CheckCircle}
            onClick={() =>
              onStatusChange({
                id: item.id,
                newStatus: "READY_FOR_PAYMENT",
                student: item.students,
              })
            }
          />
        </div>
      </>
    );
  }

  if (status === "READY_FOR_PAYMENT") {
    return (
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="sm"
          icon={DollarSign}
          onClick={() =>
            onStatusChange({
              id: item.id,
              newStatus: "PAID",
              student: item.students,
              scholarshipData: item,
            })
          }
        >
          Pagar
        </Button>
      </div>
    );
  }

  if (status === "PAID") {
    return (
      <div className="flex justify-end">
        <span className="text-xs text-green-600 font-bold flex items-center gap-1">
          <CheckCircle size={16} /> PAGADO
        </span>
      </div>
    );
  }

  return null;
};

export default ActionButtons;
