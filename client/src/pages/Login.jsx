import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { z } from "zod"; // [SPRINT 4] Zod as source of truth
import {
  loginSchema as centralLoginSchema,
  signUpSchema as centralSignUpSchema,
} from "@/schemas/authSchema";
import { AlertCircle, Lock, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "../services/supabaseClient";
import { verifyStudent } from "../services/supabaseAuthService";
import { useAuth } from "../context/AuthContext";
import { logger } from "../utils/logger";

// --- VALIDATION SCHEMAS WITH ZOD (centralized) ---
const loginSchema = centralLoginSchema;
const signUpSchema = centralSignUpSchema;

const Login = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [authError, setAuthError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (session) {
      checkUserRoleAndRedirect(session.user);
    }
  }, [session, navigate]);

  const checkUserRoleAndRedirect = async (user) => {
    setVerifying(true);
    logger.info("LoginFlow", "Verifying user role", {
      email: user.email,
    });
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role === "ADMIN" || profile?.role === "STAFF") {
        logger.debug("LoginFlow", "Admin/Staff detected", {
          role: profile.role,
        });
        navigate("/admin", { replace: true });
        return;
      }

      const { data: studentRecord } = await supabase
        .from("students")
        .select("id")
        .eq("university_email", user.email)
        .maybeSingle();

      if (studentRecord) {
        logger.debug("LoginFlow", "Student detected", {
          email: user.email,
        });
        navigate("/dashboard", { replace: true });
      } else {
        logger.debug(
          "LoginFlow",
          "User without student profile, redirecting to guest",
        );
        navigate("/guest", { replace: true });
      }
    } catch (error) {
      logger.error("LoginFlow", "Error during redirect", error);
      navigate("/guest", { replace: true });
    } finally {
      setVerifying(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    // [SPRINT 4] Manual validation using Zod
    validate: (values) => {
      const schema = isSignUp ? signUpSchema : loginSchema;
      const result = schema.safeParse(values);
      if (result.success) return {};

      const errors = {};
      result.error.issues.forEach((issue) => {
        errors[issue.path[0]] = issue.message;
      });
      return errors;
    },
    onSubmit: async (values) => {
      setAuthError(null);
      const { email, password } = values;

      try {
        // If registration, first verify it's a scholarship student
        if (isSignUp) {
          const verifyData = await verifyStudent(email);

          if (!verifyData.isBecado) {
            setAuthError(
              "Este correo no está registrado como estudiante becado. Contacta a administración.",
            );
            return;
          }

          logger.info("StudentRegistration", "Estudiante becado verificado", {
            email,
            fullName: verifyData.student.fullName,
          });
        }

        let result;
        if (isSignUp) {
          result = await supabase.auth.signUp({ email, password });
        } else {
          result = await supabase.auth.signInWithPassword({ email, password });
        }

        if (result.error) throw result.error;

        if (isSignUp && !result.data.session) {
          setAuthError(
            "Cuenta creada. Por favor, verifica tu correo institucional.",
          );
        }
      } catch (error) {
        setAuthError(
          error.message.includes("Invalid login credentials")
            ? "Credenciales inválidas."
            : error.message,
        );
      }
    },
  });

  const handleGoogleLogin = async () => {
    setVerifying(true);
    try {
      // Redirect URL is automatically set to the current origin for better AWS compatibility
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/login" },
      });
      if (error) throw error;
    } catch (error) {
      alert("Google Auth Error: " + error.message);
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-800 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Verificando acceso...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">
          Sistema de Becas
        </h1>
        <h2 className="text-3xl font-bold text-blue-800 mt-1">UCE</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 shadow-xl rounded-2xl border border-gray-100">
          {!isSignUp && (
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex justify-center items-center gap-3 px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all mb-6"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
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
              Ingresar con Google
            </button>
          )}

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-400 font-medium">
                {isSignUp
                  ? "Registro de Estudiante"
                  : "O con Correo Institucional"}
              </span>
            </div>
          </div>

          <form className="space-y-5" onSubmit={formik.handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Correo Institucional
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  {...formik.getFieldProps("email")}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-800 outline-none ${formik.touched.email && formik.errors.email ? "border-red-500" : "border-gray-300"}`}
                  placeholder="estudiante@uce.edu.ec"
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {formik.errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  {...formik.getFieldProps("password")}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-800 outline-none ${formik.touched.password && formik.errors.password ? "border-red-500" : "border-gray-300"}`}
                  placeholder="••••••"
                />
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {formik.errors.password}
                </p>
              )}
            </div>

            {/* [SPRINT 4] DOBLE VERIFICACIÓN SOLO PARA ESTUDIANTES NUEVOS */}
            {isSignUp && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <CheckCircle2 className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    {...formik.getFieldProps("confirmPassword")}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-800 outline-none ${formik.touched.confirmPassword && formik.errors.confirmPassword ? "border-red-500" : "border-gray-300"}`}
                    placeholder="Repite tu contraseña"
                  />
                </div>
                {formik.touched.confirmPassword &&
                  formik.errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {formik.errors.confirmPassword}
                    </p>
                  )}
              </div>
            )}

            {authError && (
              <div
                className={`rounded-lg p-4 border ${authError.includes("creada") ? "bg-green-50 border-green-100 text-green-800" : "bg-red-50 border-red-100 text-red-800"}`}
              >
                <div className="flex">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <p className="text-sm font-medium">{authError}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full flex justify-center py-3 px-4 rounded-lg shadow-md text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 transition-all disabled:opacity-50"
            >
              {formik.isSubmitting ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : isSignUp ? (
                "Crear Cuenta"
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAuthError(null);
                formik.resetForm();
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              {isSignUp
                ? "¿Ya tienes cuenta? Inicia sesión"
                : "¿Eres nuevo estudiante? Regístrate aquí"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
