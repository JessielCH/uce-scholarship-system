import React from "react";
import { Loader2 } from "lucide-react";

/**
 * ATOM: Spinner
 */
const Spinner = ({ size = "md", className = "", ...props }) => {
  const sizeMap = {
    sm: "h-5 w-5",
    md: "h-9 w-9",
    lg: "h-12 w-12",
  };

  return (
    <Loader2
      className={`animate-spin text-brand-blue ${sizeMap[size]} ${className}`}
      {...props}
    />
  );
};

export default Spinner;
