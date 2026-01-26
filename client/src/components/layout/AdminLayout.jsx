import React from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAdminStore } from "../../context/adminStore";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  ShieldAlert,
  Upload,
} from "lucide-react";
import clsx from "clsx";

const AdminLayout = () => {
  const { signOut, user } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useAdminStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // Translated navigation items
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { label: "Scholars", icon: Users, path: "/admin/scholars" },
    { label: "Data Ingestion", icon: Upload, path: "/admin/ingest" },
    { label: "Audit Logs", icon: ShieldAlert, path: "/admin/logs" },
  ];

  if (user?.role === "ADMIN") {
    navItems.push({
      label: "Settings",
      icon: Settings,
      path: "/admin/settings",
    });
  }

  return (
    <div className="flex h-screen bg-brand-gray">
      {/* Sidebar - Using Brand Blue  */}
      <aside
        className={clsx(
          "bg-brand-blue text-white transition-all duration-300 flex flex-col shadow-xl z-20",
          isSidebarOpen ? "w-64" : "w-20",
        )}
      >
        <div className="p-4 flex items-center justify-between border-b border-white/10 h-16">
          {isSidebarOpen && (
            <span className="font-bold text-lg tracking-wide">
              Scholarship Mgmt
            </span>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1 hover:bg-white/10 rounded-md transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-white text-brand-blue font-medium shadow-sm"
                    : "text-gray-300 hover:bg-white/10 hover:text-white",
                )}
              >
                <item.icon
                  size={20}
                  className={
                    isActive ? "text-brand-blue" : "group-hover:text-white"
                  }
                />
                {isSidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-red-300 hover:bg-red-500/10 hover:text-red-200 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center h-16 z-10">
          <h2 className="text-xl font-bold text-brand-blue">
            Management Panel
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-700">
                {user?.email}
              </span>
              <span className="text-xs font-medium text-brand-blue bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                {user?.role}
              </span>
            </div>
            {/* Simple Avatar Placeholder */}
            <div className="h-9 w-9 bg-brand-blue text-white rounded-full flex items-center justify-center font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Area with Fade In Animation */}
        <div className="p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
