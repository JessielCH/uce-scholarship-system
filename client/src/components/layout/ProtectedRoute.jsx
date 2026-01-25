import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // Enhanced Loading Skeleton
  if (loading)
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-brand-gray">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-blue border-t-transparent"></div>
        <div className="mt-4 animate-pulse text-brand-blue font-semibold text-lg">
          Loading system...
        </div>
      </div>
    );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
