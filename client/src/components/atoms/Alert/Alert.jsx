import React from "react";
import { X } from "lucide-react";

/**
 * ATOM: Alert
 */
const Alert = ({
  type = "info",
  title,
  message,
  onClose = null,
  className = "",
  children,
  icon: Icon = null,
  ...props
}) => {
  const baseStyles = "p-4 rounded-lg border-l-4 flex items-start gap-3";

  const typeStyles = {
    success: "bg-green-50 border-green-400 text-green-800",
    error: "bg-red-50 border-red-400 text-red-800",
    warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
    info: "bg-blue-50 border-blue-400 text-blue-800",
  };

  return (
    <div
      className={`${baseStyles} ${typeStyles[type]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={20} className="flex-shrink-0 mt-0.5" />}
      <div className="flex-1">
        {title && <h4 className="font-bold text-sm mb-1">{title}</h4>}
        {message && <p className="text-sm">{message}</p>}
        {children}
      </div>
      {onClose && (
        <button onClick={onClose} className="hover:opacity-60 flex-shrink-0">
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default Alert;
