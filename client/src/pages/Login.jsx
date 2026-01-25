import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AlertCircle, Lock, Mail, Loader2 } from "lucide-react";
import { supabase } from "../services/supabaseClient";

const Login = () => {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .matches(/@uce\.edu\.ec$/, "Must be an institutional email @uce.edu.ec")
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
          // Sign Up attempt
          result = await supabase.auth.signUp({
            email,
            password,
          });
        } else {
          // Sign In attempt
          result = await supabase.auth.signInWithPassword({
            email,
            password,
          });
        }

        if (result.error) throw result.error;

        // --- INTELLIGENT REDIRECT LOGIC ---
        if (result.data.user) {
          // 1. Check user role
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", result.data.user.id)
            .single();

          if (profileError) {
            console.error("Error fetching profile:", profileError);
            navigate("/dashboard");
            return;
          }

          // 2. Role-based Routing
          if (profile?.role === "ADMIN" || profile?.role === "STAFF") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        } else if (isSignUp && !result.data.session) {
          setAuthError(
            "Account created. Please verify your email if required.",
          );
        }
      } catch (error) {
        // Friendly Error Handling
        if (
          error.message.includes("Access Denied") ||
          error.message.includes("Acceso Denegado")
        ) {
          setAuthError(
            "Error: This email is not on the official scholarship list.",
          );
        } else if (error.message.includes("Invalid login credentials")) {
          setAuthError(
            "Invalid credentials. Please check your email and password.",
          );
        } else {
          setAuthError(error.message);
        }
      }
    },
  });

  const handleGoogleLogin = async () => {
    // Placeholder for Google Auth logic if implemented later
    alert("Google Sign-In integration would happen here.");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in font-sans">
      {/* Title Section matching PDF */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <h1 className="text-4xl font-extrabold text-brand-blue tracking-tight">
          Scholarship
        </h1>
        <h2 className="text-3xl font-bold text-brand-blue mt-1">Management</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 shadow-xl rounded-2xl border border-gray-100">
          {/* Google Button (Mockup based on PDF) */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex justify-center items-center gap-3 px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all mb-6"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-400 font-medium">
                OR
              </span>
            </div>
          </div>

          <form className="space-y-5" onSubmit={formik.handleSubmit}>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Institutional Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  {...formik.getFieldProps("email")}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue sm:text-sm placeholder-gray-400 transition-shadow ${
                    formik.touched.email && formik.errors.email
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="student@uce.edu.ec"
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {formik.errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs font-medium text-brand-blue hover:text-blue-800"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  {...formik.getFieldProps("password")}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue sm:text-sm placeholder-gray-400 transition-shadow"
                  placeholder="Enter your password"
                />
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {formik.errors.password}
                </p>
              )}
            </div>

            {/* Error Feedback */}
            {authError && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle
                      className="h-5 w-5 text-red-500"
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

            {/* Submit Button (RED as per PDF) */}
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-brand-red hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-70 transition-all transform active:scale-95"
            >
              {formik.isSubmitting ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : isSignUp ? (
                "Activate Account"
              ) : (
                "Log In"
              )}
            </button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-3">
              {isSignUp
                ? "Already have an account?"
                : "New scholarship recipient?"}
            </p>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAuthError(null);
              }}
              className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {isSignUp ? "Go to Login" : "Activate via Email"}
            </button>
          </div>

          <div className="mt-6 text-center flex justify-between text-xs text-gray-400">
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="hover:underline">
              Terms of Service
            </a>
            <a href="#" className="hover:underline">
              Help
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
