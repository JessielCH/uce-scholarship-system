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

// Guest Pages (NUEVO: Portal de Transparencia)
import GuestLayout from "./components/layout/GuestLayout";
import GuestDashboard from "./pages/guest/GuestDashboard";

// Admin/Staff Layout
import AdminLayout from "./components/layout/AdminLayout";

// Admin/Staff Pages
import StaffDashboard from "./pages/admin/StaffDashboard"; // Dashboard Operativo
import ScholarsList from "./pages/admin/ScholarsList"; // Gestión Becarios
import IngestData from "./pages/admin/IngestData"; // Carga Excel
import StaffSettings from "./pages/admin/StaffSettings"; // Gestión Usuarios
import AuditLogs from "./pages/admin/AuditLogs"; // Auditoría

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
            {/* Redirección por defecto a dashboard si entran a raíz (se puede mejorar luego) */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* 3. Rutas de INVITADOS (Portal de Transparencia) - NUEVO */}
          {/* Accesible para cualquier usuario autenticado que quiera ver datos públicos */}
          <Route element={<ProtectedRoute />}>
            <Route path="/guest" element={<GuestLayout />}>
              <Route index element={<GuestDashboard />} />
            </Route>
          </Route>

          {/* 4. Rutas de STAFF y ADMIN */}
          <Route element={<RoleRoute allowedRoles={["ADMIN", "STAFF"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              {/* Dashboard Principal (Estadísticas) */}
              <Route index element={<StaffDashboard />} />

              {/* Operaciones */}
              <Route path="scholars" element={<ScholarsList />} />
              <Route path="ingest" element={<IngestData />} />

              {/* Exclusivo ADMIN */}
              <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
                <Route path="settings" element={<StaffSettings />} />
                <Route path="logs" element={<AuditLogs />} />
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
