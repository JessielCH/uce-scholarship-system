import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { z } from "zod"; // [SPRINT 4] Zod como fuente de verdad
import { AlertCircle, Lock, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";

// --- ESQUEMAS DE VALIDACIÓN CON ZOD ---
const loginSchema = z.object({
  email: z
    .string()
    .email("Email inválido")
    .endsWith("@uce.edu.ec", "Debe ser correo institucional @uce.edu.ec"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const signUpSchema = loginSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

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
    console.group("🔐 [AUDIT LOG] Verificación de Rol");
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role === "ADMIN" || profile?.role === "STAFF") {
        navigate("/admin", { replace: true });
        return;
      }

      const { data: studentRecord } = await supabase
        .from("students")
        .select("id")
        .eq("university_email", user.email)
        .maybeSingle();

      if (studentRecord) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/guest", { replace: true });
      }
    } catch (error) {
      console.error("❌ Error en redirección:", error.message);
      navigate("/guest", { replace: true });
    } finally {
      console.groupEnd();
      setVerifying(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    // [SPRINT 4] Validación manual usando Zod
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/login" },
      });
      if (error) throw error;
    } catch (error) {
      alert("Error Google: " + error.message);
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
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/pjax/google.svg"
                className="h-5 w-5"
                alt="Google"
              />
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
