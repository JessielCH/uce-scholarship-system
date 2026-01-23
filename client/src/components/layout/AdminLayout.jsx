import React from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAdminStore } from "../../context/adminStore";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import clsx from "clsx";

const AdminLayout = () => {
  const { signOut, user } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useAdminStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { label: "Becarios", icon: Users, path: "/admin/scholars" },
    { label: "Auditoría", icon: FileText, path: "/admin/audit" },
  ];

  if (user?.role === "ADMIN") {
    navItems.push({
      label: "Configuración",
      icon: Settings,
      path: "/admin/settings",
    });
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={clsx(
          "bg-primary-900 text-white transition-all duration-300 flex flex-col",
          isSidebarOpen ? "w-64" : "w-20",
        )}
      >
        <div className="p-4 flex items-center justify-between border-b border-primary-700">
          {isSidebarOpen && (
            <span className="font-bold text-xl">UCE Admin</span>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1 hover:bg-primary-700 rounded"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 text-primary-100 hover:bg-primary-700 hover:text-white rounded-lg transition-colors"
            >
              <item.icon size={20} />
              {isSidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-primary-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-red-200 hover:bg-primary-800 rounded transition-colors"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Panel de Gestión
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium bg-primary-100 text-primary-800 px-3 py-1 rounded-full">
              {user?.role}
            </span>
            <span className="text-gray-600 text-sm">{user?.email}</span>
          </div>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
