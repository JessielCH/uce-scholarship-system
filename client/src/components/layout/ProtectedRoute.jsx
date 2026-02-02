// client/src/components/layout/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // ⚠️ CAMBIO CLAVE: Si ya hay un usuario (user), ignora el estado loading.
  // Solo muestra el spinner si está cargando Y aún no sabemos quién es el usuario.
  if (loading && !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-blue-600 border-t-transparent h-12 w-12"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
