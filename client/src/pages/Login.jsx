import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AlertCircle, Lock, Mail, Loader2 } from "lucide-react";
import { supabase } from "../services/supabaseClient";

const Login = () => {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login/Register

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .matches(/@uce\.edu\.ec$/, "Must be an @uce.edu.ec email")
        .required("Required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Required"),
    }),
    onSubmit: async (values) => {
      setAuthError(null);
      const { email, password } = values;

      try {
        let result;
        if (isSignUp) {
          // Al tener "Confirm Email" desactivado, esto loguea directamente
          result = await supabase.auth.signUp({
            email,
            password,
          });
        } else {
          result = await supabase.auth.signInWithPassword({
            email,
            password,
          });
        }

        if (result.error) throw result.error;

        // LÓGICA ACTUALIZADA:
        // Si hay usuario y sesión, redirigimos siempre
        if (result.data.user && result.data.session) {
          navigate("/dashboard");
        } else if (isSignUp && !result.data.session) {
          // Caso raro: si por alguna razón sigue pidiendo confirmación
          setAuthError("Account created! Please check your email.");
        }
      } catch (error) {
        // ... manejo de errores igual que antes
        if (error.message.includes("Access Denied")) {
          setAuthError("Error: You are not in the official scholarship list.");
        } else {
          setAuthError(error.message);
        }
      }
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-primary-900">
          UCE Scholarship System
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignUp
            ? "Activate your account"
            : "Sign in to manage your scholarship"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-t-4 border-primary-600">
          <form className="space-y-6" onSubmit={formik.handleSubmit}>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Institutional Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  {...formik.getFieldProps("email")}
                  className={`block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-primary-600 focus:border-primary-600 p-2 border ${
                    formik.touched.email && formik.errors.email
                      ? "border-red-500"
                      : ""
                  }`}
                  placeholder="student@uce.edu.ec"
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="mt-2 text-sm text-red-600">
                  {formik.errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  {...formik.getFieldProps("password")}
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-primary-600 focus:border-primary-600 p-2 border"
                />
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="mt-2 text-sm text-red-600">
                  {formik.errors.password}
                </p>
              )}
            </div>

            {/* Error Feedback */}
            {authError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle
                      className="h-5 w-5 text-red-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {authError}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 disabled:opacity-50"
              >
                {formik.isSubmitting ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : isSignUp ? (
                  "Activate Account"
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {isSignUp ? "Already have an account?" : "New student?"}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError(null);
                }}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                {isSignUp ? "Go to Login" : "Activate via Email"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
