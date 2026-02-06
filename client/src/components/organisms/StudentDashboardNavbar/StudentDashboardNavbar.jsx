import React from "react";
import { FileCheck, LogOut, User } from "lucide-react";
import CurrentPeriodBadge from "../../molecules/CurrentPeriodBadge";

/**
 * ORGANISM: StudentDashboardNavbar
 * Navbar específico del dashboard de estudiantes
 * Integra: información del estudiante, botón de logout
 */
const StudentDashboardNavbar = ({ studentData, onLogout }) => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <div className="bg-brand-blue rounded-lg p-1">
              <FileCheck className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold text-brand-blue tracking-tight italic">
              Portal de Becas UCE
            </span>
            <CurrentPeriodBadge />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-6">
            {/* Student Name */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 font-bold">
              <User size={16} className="text-gray-400" />
              {studentData?.first_name} {studentData?.last_name}
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 font-bold transition-colors"
            >
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default StudentDashboardNavbar;
