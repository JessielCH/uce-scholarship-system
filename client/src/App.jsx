import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { RoleRoute } from "./components/layout/RoleRoute";
import "./index.css";

// --- Page Imports ---
import Login from "./pages/Login";

// Student Pages
import Dashboard from "./pages/student/Dashboard";

// Guest Pages (Portal de Transparencia)
import GuestLayout from "./components/layout/GuestLayout";
import GuestDashboard from "./pages/guest/GuestDashboard";

// Admin/Staff Layout
import AdminLayout from "./components/layout/AdminLayout";

// Admin/Staff Pages
import DashboardHome from "./components/admin/DashboardHome"; // <--- EL SWITCH INTELIGENTE
import ScholarsList from "./pages/admin/ScholarsList"; // Gestión Becarios
import IngestData from "./pages/admin/IngestData"; // Carga Excel
import StaffSettings from "./pages/admin/StaffSettings"; // Gestión Usuarios

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 1. Rutas Públicas */}
          <Route path="/login" element={<Login />} />

          {/* 2. Rutas Protegidas (Estudiantes) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Redirección por defecto a dashboard si entran a raíz */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* 3. Rutas de INVITADOS (Portal de Transparencia) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/guest" element={<GuestLayout />}>
              <Route index element={<GuestDashboard />} />
            </Route>
          </Route>

          {/* 4. Rutas de STAFF y ADMIN */}
          <Route element={<RoleRoute allowedRoles={["ADMIN", "STAFF"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              {/* Usamos DashboardHome como index. Este componente decide internamente */}
              {/* si mostrar AdminDashboard o StaffDashboard según el rol */}
              <Route index element={<DashboardHome />} />

              {/* Operaciones */}
              <Route path="scholars" element={<ScholarsList />} />
              <Route path="ingest" element={<IngestData />} />

              {/* Exclusivo ADMIN */}
              <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
                <Route path="settings" element={<StaffSettings />} />
                {/* La ruta de logs ha sido eliminada */}
              </Route>
            </Route>
          </Route>

          {/* 5. Fallback 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
