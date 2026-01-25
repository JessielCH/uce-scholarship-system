import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShieldAlert } from "lucide-react";

export const RoleRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500 animate-pulse">
        Verifying permissions...
      </div>
    );

  // If no user or role not in allowed list
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-gray-50 text-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full flex flex-col items-center">
          <div className="bg-red-50 p-4 rounded-full mb-4">
            <ShieldAlert size={48} className="text-status-error" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Restricted
          </h1>

          <p className="text-gray-600 mb-6">
            You do not have the necessary permissions to view this page.
            <br />
            <span className="text-xs text-gray-400 font-mono mt-2 block">
              Required: {allowedRoles.join(", ")}
            </span>
          </p>

          <div className="w-full bg-gray-100 rounded-lg p-3 mb-6 text-sm text-gray-500 flex justify-between items-center">
            <span>Your Role:</span>
            <span className="font-bold text-gray-700">
              {user?.role || "Guest"}
            </span>
          </div>

          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
