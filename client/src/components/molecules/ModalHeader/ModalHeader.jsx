import React from "react";
import { X } from "lucide-react";

/**
 * MOLECULE: ModalHeader
 */
const ModalHeader = ({
  title,
  subtitle = null,
  onClose,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-gray-50 ${className}`}
      {...props}
    >
      <div>
        <h3 className="font-bold text-lg text-brand-blue">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
};

export default ModalHeader;
