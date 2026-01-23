import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AlertCircle, Lock, Mail, Loader2 } from "lucide-react";
import { supabase } from "../services/supabaseClient";

const Login = () => {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false); // Alternar entre Login/Registro

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Correo inválido")
        .matches(
          /@uce\.edu\.ec$/,
          "Debe ser un correo institucional @uce.edu.ec",
        )
        .required("Requerido"),
      password: Yup.string()
        .min(6, "La contraseña debe tener al menos 6 caracteres")
        .required("Requerido"),
    }),
    onSubmit: async (values) => {
      setAuthError(null);
      const { email, password } = values;

      try {
        let result;
        if (isSignUp) {
          // Intento de Registro (El trigger en BD validará si está en la lista blanca)
          result = await supabase.auth.signUp({
            email,
            password,
          });
        } else {
          // Intento de Login
          result = await supabase.auth.signInWithPassword({
            email,
            password,
          });
        }

        if (result.error) throw result.error;

        // --- LÓGICA DE REDIRECCIÓN INTELIGENTE ---
        if (result.data.user) {
          // 1. Consultar el rol del usuario recién logueado
          // (Ahora posible gracias al arreglo de políticas RLS que hicimos)
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", result.data.user.id)
            .single();

          if (profileError) {
            console.error("Error obteniendo perfil:", profileError);
            // Si falla la lectura del perfil, por seguridad enviamos al dashboard de estudiante
            navigate("/dashboard");
            return;
          }

          // 2. Semáforo de Rutas
          if (profile?.role === "ADMIN" || profile?.role === "STAFF") {
            console.log("Usuario es Staff/Admin. Redirigiendo a /admin");
            navigate("/admin");
          } else {
            console.log("Usuario es Estudiante. Redirigiendo a /dashboard");
            navigate("/dashboard");
          }
        } else if (isSignUp && !result.data.session) {
          // Caso raro: Si Supabase pide confirmación de correo
          setAuthError(
            "Cuenta creada. Por favor verifica tu correo si es necesario.",
          );
        }
      } catch (error) {
        // Manejo de errores amigable
        if (
          error.message.includes("Access Denied") ||
          error.message.includes("Acceso Denegado")
        ) {
          setAuthError(
            "Error: Este correo no figura en la nómina oficial de becarios.",
          );
        } else if (error.message.includes("Invalid login credentials")) {
          setAuthError(
            "Credenciales incorrectas. Verifica tu correo y contraseña.",
          );
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
          Sistema de Becas UCE
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignUp ? "Activar cuenta de estudiante" : "Ingresar al sistema"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-t-4 border-primary-600">
          <form className="space-y-6" onSubmit={formik.handleSubmit}>
            {/* Campo Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Correo Institucional
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
                  placeholder="estudiante@uce.edu.ec"
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="mt-2 text-sm text-red-600">
                  {formik.errors.email}
                </p>
              )}
            </div>

            {/* Campo Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Contraseña
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

            {/* Feedback de Error General */}
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
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 disabled:opacity-50 transition-colors"
              >
                {formik.isSubmitting ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : isSignUp ? (
                  "Activar Cuenta"
                ) : (
                  "Iniciar Sesión"
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
                  {isSignUp ? "¿Ya tienes cuenta?" : "¿Eres nuevo becario?"}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError(null);
                }}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                {isSignUp ? "Ir a Iniciar Sesión" : "Activar vía Correo"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
