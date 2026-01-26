import React from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogOut, PieChart } from "lucide-react";

const GuestLayout = () => {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* HEADER SIMPLIFICADO */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo / Título */}
            <div className="flex items-center gap-2">
              <div className="bg-uce-blue p-2 rounded-lg text-white">
                <PieChart size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-uce-blue leading-none">
                  Portal de Transparencia
                </h1>
                <p className="text-xs text-gray-500">
                  Universidad Central del Ecuador
                </p>
              </div>
            </div>

            {/* Perfil / Salir */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
                <p className="text-xs text-gray-500">Invitado / Auditoría</p>
              </div>
              <button
                onClick={signOut}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Sistema de Gestión de Becas UCE.
            Acceso limitado solo para consulta.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default GuestLayout;
