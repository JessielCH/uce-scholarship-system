import React from "react";

const SkeletonLoader = ({ className = "", children }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}>
      {children}
    </div>
  );
};

export default SkeletonLoader;
