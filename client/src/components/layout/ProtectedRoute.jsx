import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // Skeleton simple de carga
  if (loading)
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="animate-pulse text-primary-600 font-semibold">
          Cargando sistema...
        </div>
      </div>
    );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
