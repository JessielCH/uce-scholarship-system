import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import Button from "../../atoms/Button";

/**
 * MOLECULE: RejectionModal
 */
const RejectionModal = ({ isOpen, onClose, onConfirm, documentType }) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert("Por favor ingresa una razón para el rechazo");
      return;
    }
    setIsSubmitting(true);
    await onConfirm(reason);
    setIsSubmitting(false);
    setReason("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Rechazar Documento
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Especifica por qué estás rechazando este documento. El estudiante
            recibirá la notificación.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Documento ilegible, firma no coincide, datos incorrectos..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
            rows="4"
            disabled={isSubmitting}
          />
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? "Procesando..." : "Rechazar"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RejectionModal;
