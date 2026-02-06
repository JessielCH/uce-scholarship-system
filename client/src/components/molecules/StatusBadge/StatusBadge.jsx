import React from "react";
import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

/**
 * MOLECULE: StatusBadge
 * Badge with status and colors based on scholarship status
 */
const StatusBadge = ({ status, label, size = "md", className = "" }) => {
  const statusConfig = {
    SELECTED: { color: "text-blue-500", bg: "bg-blue-100", icon: Info },
    EXCLUDED: {
      color: "text-gray-500",
      bg: "bg-gray-100",
      icon: AlertCircle,
    },
    DOCS_UPLOADED: {
      color: "text-yellow-500",
      bg: "bg-yellow-100",
      icon: AlertTriangle,
    },
    CHANGES_REQUESTED: {
      color: "text-red-500",
      bg: "bg-red-100",
      icon: AlertCircle,
    },
    APPROVED: {
      color: "text-green-500",
      bg: "bg-green-100",
      icon: CheckCircle,
    },
    CONTRACT_GENERATED: {
      color: "text-brand-blue",
      bg: "bg-blue-100",
      icon: CheckCircle,
    },
    READY_FOR_PAYMENT: {
      color: "text-purple-500",
      bg: "bg-purple-100",
      icon: CheckCircle,
    },
    PAID: {
      color: "text-white font-bold",
      bg: "bg-green-600",
      icon: CheckCircle,
    },
  };

  const config = statusConfig[status] || statusConfig.SELECTED;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-medium ${config.bg} ${config.color} ${sizeClasses[size]} ${className}`}
    >
      <Icon size={16} />
      {label}
    </span>
  );
};

export default StatusBadge;
