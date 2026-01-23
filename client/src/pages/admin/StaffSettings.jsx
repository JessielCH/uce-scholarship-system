import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { UserPlus, Save, Loader2 } from "lucide-react";

const StaffSettings = () => {
  // Estado para feedback visual
  const [status, setStatus] = React.useState({ type: "", message: "" });

  const formik = useFormik({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
      role: "STAFF",
    },
    validationSchema: Yup.object({
      fullName: Yup.string().required("El nombre es requerido"),
      email: Yup.string().email("Email inválido").required("Requerido"),
      password: Yup.string()
        .min(6, "Mínimo 6 caracteres")
        .required("Requerido"),
    }),
    onSubmit: async (values, { resetForm }) => {
      setStatus({ type: "", message: "" });

      try {
        // Llamada a NUESTRO Backend Node.js
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

        if (!response.ok)
          throw new Error(data.error || "Error al crear usuario");

        setStatus({
          type: "success",
          message: `¡Usuario ${values.email} creado correctamente!`,
        });
        resetForm();
      } catch (error) {
        setStatus({ type: "error", message: error.message });
      }
    },
  });

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <UserPlus className="text-primary-600" />
          Gestión de Personal (Staff)
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Registra nuevos miembros del equipo administrativo o financiero.
        </p>
      </div>

      {status.message && (
        <div
          className={`p-4 rounded-md mb-6 ${status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {status.message}
        </div>
      )}

      <form onSubmit={formik.handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre Completo
          </label>
          <input
            type="text"
            {...formik.getFieldProps("fullName")}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ej. Ing. María Fernanda"
          />
          {formik.touched.fullName && formik.errors.fullName && (
            <div className="text-red-500 text-xs mt-1">
              {formik.errors.fullName}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Correo Institucional
            </label>
            <input
              type="email"
              {...formik.getFieldProps("email")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="staff@uce.edu.ec"
            />
            {formik.touched.email && formik.errors.email && (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.email}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contraseña Temporal
            </label>
            <input
              type="text"
              {...formik.getFieldProps("password")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="********"
            />
            {formik.touched.password && formik.errors.password && (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.password}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Rol Asignado
          </label>
          <select
            {...formik.getFieldProps("role")}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="STAFF">Staff (Analista de Becas)</option>
            <option value="ADMIN">Administrador del Sistema</option>
          </select>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-900 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {formik.isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Save size={18} className="mr-2" /> Crear Usuario Staff
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StaffSettings;
