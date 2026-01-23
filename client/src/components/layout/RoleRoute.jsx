import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShieldAlert } from "lucide-react";

// ✅ CORRECTO: Exportación Nombrada (export const ...)
export const RoleRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading)
    return <div className="p-10 text-center">Verificando permisos...</div>;

  // Si no hay usuario o su rol no está en la lista permitida
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center text-red-600 bg-gray-50">
        <ShieldAlert size={64} className="mb-4" />
        <h1 className="text-2xl font-bold">Acceso Restringido</h1>
        <p className="text-gray-600 mt-2">
          No tienes los permisos necesarios ({allowedRoles.join(", ")}).
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Tu rol actual: {user?.role || "Ninguno"}
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-800 transition-colors"
        >
          Volver atrás
        </button>
      </div>
    );
  }

  return <Outlet />;
};
