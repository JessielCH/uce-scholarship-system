import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  UserPlus,
  Save,
  Loader2,
  ShieldCheck,
  Mail,
  Lock,
  User,
} from "lucide-react";

const StaffSettings = () => {
  const [status, setStatus] = React.useState({ type: "", message: "" });

  const formik = useFormik({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
      role: "STAFF",
    },
    validationSchema: Yup.object({
      fullName: Yup.string().required("Full name is required"),
      email: Yup.string().email("Invalid email").required("Required"),
      password: Yup.string()
        .min(6, "Minimum 6 characters")
        .required("Required"),
    }),
    onSubmit: async (values, { resetForm }) => {
      setStatus({ type: "", message: "" });

      try {
        // Keeping local API call as requested
        const response = await fetch(
          "http://localhost:3000/api/admin/create-staff",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
          },
        );

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Error creating user");

        setStatus({
          type: "success",
          message: `User ${values.email} created successfully!`,
        });
        resetForm();
      } catch (error) {
        setStatus({ type: "error", message: error.message });
      }
    },
  });

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
      <div className="bg-gray-50 px-8 py-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-brand-blue flex items-center gap-2">
          <UserPlus className="text-brand-blue" size={24} />
          Staff Management
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Register new members for the administrative or financial team.
        </p>
      </div>

      <div className="p-8">
        {status.message && (
          <div
            className={`p-4 rounded-lg mb-6 border ${
              status.type === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {status.message}
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue sm:text-sm transition-shadow"
                placeholder="e.g. Maria Anderson"
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue sm:text-sm transition-shadow"
                  placeholder="staff@university.edu"
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue sm:text-sm transition-shadow"
                  placeholder="********"
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white"
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
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-brand-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-70 transition-all"
            >
              {formik.isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Save size={18} className="mr-2" /> Create Staff User
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
