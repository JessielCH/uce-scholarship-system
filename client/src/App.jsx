import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import "./index.css";

// Page Imports
import Login from "./pages/Login";
import Dashboard from "./pages/student/Dashboard";
import AdminLayout from "./components/layout/AdminLayout";
import ScholarsList from "./pages/admin/ScholarsList";
import StaffSettings from "./pages/admin/StaffSettings";
import IngestData from "./pages/admin/IngestData";
import { RoleRoute } from "./components/layout/RoleRoute";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes (Students & General Users) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* ADMIN / STAFF Routes */}
          <Route element={<RoleRoute allowedRoles={["ADMIN", "STAFF"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route
                index
                element={
                  <div className="p-4">
                    <h1 className="text-2xl font-bold text-brand-blue">
                      Dashboard Overview (Statistics)
                    </h1>
                  </div>
                }
              />
              <Route path="scholars" element={<ScholarsList />} />
              <Route path="ingest" element={<IngestData />} />
              <Route
                path="audit"
                element={
                  <div className="p-4">
                    <h1 className="text-2xl font-bold text-gray-700">
                      Audit Logs (Phase 6)
                    </h1>
                  </div>
                }
              />

              {/* ADMIN Only Routes */}
              <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
                <Route path="settings" element={<StaffSettings />} />
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
