import React from "react";

const SkeletonLoader = ({ className = "", variant = "default", children }) => {
  const baseClasses = "animate-pulse bg-gray-200 rounded";

  const variantClasses = {
    default: "",
    card: "rounded-lg p-4 space-y-3",
    table: "rounded-lg space-y-2",
    header: "h-8 w-48",
    line: "h-4 w-full",
    circle: "rounded-full",
  };

  const combinedClass = `${baseClasses} ${variantClasses[variant] || ""} ${className}`;

  return <div className={combinedClass}>{children}</div>;
};

export default SkeletonLoader;
