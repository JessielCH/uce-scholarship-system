import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

// Importa tus páginas reales
import Login from "./pages/Login";
import Dashboard from "./pages/student/Dashboard";
import AdminLayout from "./components/layout/AdminLayout";
import ScholarsList from "./pages/admin/ScholarsList";
import { RoleRoute } from "./components/layout/RoleRoute";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />

          {/* Rutas Protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Rutas ADMIN / STAFF */}
          <Route element={<RoleRoute allowedRoles={["ADMIN", "STAFF"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route
                index
                element={
                  <div className="p-4">
                    <h1>Dashboard Overview (Estadísticas)</h1>
                  </div>
                }
              />
              <Route path="scholars" element={<ScholarsList />} />
              <Route
                path="audit"
                element={
                  <div className="p-4">
                    <h1>Logs de Auditoría (Fase 6)</h1>
                  </div>
                }
              />

              {/* Ruta solo para ADMIN PURO */}
              <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
                <Route
                  path="settings"
                  element={
                    <div className="p-4">
                      <h1>Configuración Global</h1>
                    </div>
                  }
                />
              </Route>
            </Route>
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
