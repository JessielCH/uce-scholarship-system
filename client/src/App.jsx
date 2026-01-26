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

// Admin/Staff Layout
import AdminLayout from "./components/layout/AdminLayout";

// Admin/Staff Pages
import StaffDashboard from "./pages/admin/StaffDashboard"; // Dashboard de Estadísticas (Nuevo)
import ScholarsList from "./pages/admin/ScholarsList"; // Lista de Becarios y Pagos
import IngestData from "./pages/admin/IngestData"; // Carga de Excel
import StaffSettings from "./pages/admin/StaffSettings"; // Gestión de Usuarios (Crear Staff)
import AuditLogs from "./pages/admin/AuditLogs"; // Auditoría de Seguridad

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 1. Rutas Públicas */}
          <Route path="/login" element={<Login />} />

          {/* 2. Rutas Protegidas (Estudiantes y General) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Redirección por defecto a dashboard si entran a raíz */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* 3. Rutas de STAFF y ADMIN */}
          <Route element={<RoleRoute allowedRoles={["ADMIN", "STAFF"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              {/* Landing Page: Dashboard Operativo (Estadísticas) */}
              <Route index element={<StaffDashboard />} />

              {/* Gestión de Becarios (Aprobar, Pagar, Contratos) */}
              <Route path="scholars" element={<ScholarsList />} />

              {/* Carga Masiva de Datos */}
              <Route path="ingest" element={<IngestData />} />

              {/* --- Rutas Exclusivas de ADMIN --- */}
              <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
                {/* Gestión de Usuarios del Staff */}
                <Route path="settings" element={<StaffSettings />} />
                {/* Logs de Auditoría */}
                <Route path="logs" element={<AuditLogs />} />
              </Route>
            </Route>
          </Route>

          {/* 4. Fallback 404 (Cualquier ruta desconocida va al login) */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
