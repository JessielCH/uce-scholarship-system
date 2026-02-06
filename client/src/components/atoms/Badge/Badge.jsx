import React from "react";

/**
 * ATOM: Badge
 * Badge for statuses and labels.
 * Variantes: default, success, warning, error, info
 */
const Badge = ({
  children,
  variant = "default",
  className = "",
  icon: Icon = null,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium";

  const variantStyles = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={14} />}
      {children}
    </span>
  );
};

export default Badge;
