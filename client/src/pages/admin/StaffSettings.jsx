import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../context/AuthContext";
import { createStaff } from "../../services/supabaseAuthService";
import { logger } from "../../utils/logger";
import {
  UserPlus,
  Save,
  Loader2,
  ShieldCheck,
  Mail,
  Lock,
  User,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const StaffSettings = () => {
  const { user: currentUser } = useAuth(); // Admin actual para logs
  const [status, setStatus] = useState({ type: "", message: "" });

  const formik = useFormik({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
      role: "STAFF",
    },
    validationSchema: Yup.object({
      fullName: Yup.string()
        .min(3, "Name is too short")
        .required("Full name is required"),
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
      role: Yup.string().oneOf(["STAFF", "ADMIN"]).required(),
    }),
    onSubmit: async (values, { resetForm }) => {
      setStatus({ type: "", message: "" });

      logger.info("StaffSettings", "Creación de nuevo usuario staff", {
        createdBy: currentUser?.email,
        fullName: values.fullName,
        email: values.email,
        role: values.role,
      });

      try {
        // ⚠️ IMPORTANT: This uses direct Supabase client-side operations
        // NO HTTP calls to /api/ endpoints - backend logic migrated to client
        // Create staff directly using Supabase service
        const response = await createStaff(
          values.email,
          values.password,
          values.fullName,
          values.role,
        );

        logger.audit("CREATE_STAFF", "users", {
          email: values.email,
          role: values.role,
          createdBy: currentUser?.email,
        });

        setStatus({
          type: "success",
          message: `Staff member ${values.fullName} has been registered successfully.`,
        });
        resetForm();
      } catch (error) {
        logger.error("StaffSettings", "Error en creación de staff", error, {
          email: values.email,
          role: values.role,
        });
        setStatus({
          type: "error",
          message: error.message || "An unexpected error occurred.",
        });
      }
    },
  });

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-gray-50 px-8 py-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-brand-blue flex items-center gap-2">
          <UserPlus className="text-brand-blue" size={24} />
          Staff Management
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Create new accounts for administrative analysts or system managers.
        </p>
      </div>

      <div className="p-8">
        {/* Status Messages */}
        {status.message && (
          <div
            className={`p-4 rounded-lg mb-6 flex items-center gap-3 border ${
              status.type === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span className="text-sm font-medium">{status.message}</span>
          </div>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                {...formik.getFieldProps("fullName")}
                className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue transition-all sm:text-sm ${
                  formik.touched.fullName && formik.errors.fullName
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder="John Doe"
              />
            </div>
            {formik.touched.fullName && formik.errors.fullName && (
              <p className="text-red-500 text-xs mt-1 font-medium">
                {formik.errors.fullName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  {...formik.getFieldProps("email")}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue transition-all sm:text-sm ${
                    formik.touched.email && formik.errors.email
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="staff@uce.edu.ec"
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="text-red-500 text-xs mt-1 font-medium">
                  {formik.errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Temporary Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  {...formik.getFieldProps("password")}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue transition-all sm:text-sm ${
                    formik.touched.password && formik.errors.password
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Min. 6 chars"
                />
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="text-red-500 text-xs mt-1 font-medium">
                  {formik.errors.password}
                </p>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Assigned Role
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ShieldCheck className="h-5 w-5 text-gray-400" />
              </div>
              <select
                {...formik.getFieldProps("role")}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue sm:text-sm bg-white cursor-pointer"
              >
                <option value="STAFF">Staff (Scholarship Analyst)</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-brand-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {formik.isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Save size={18} className="mr-2" /> Register Staff Member
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffSettings;
