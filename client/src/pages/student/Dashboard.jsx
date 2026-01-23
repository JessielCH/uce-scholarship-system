import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabaseClient";
import { Timeline } from "../../components/ui/Timeline";
import { AlertTriangle, FileText, UploadCloud } from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [scholarship, setScholarship] = useState(null);
  const [currentPeriod, setCurrentPeriod] = useState(null); // Nuevo estado para el periodo global
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Obtener Periodo Académico Activo (Independiente del estudiante)
        const { data: activePeriod, error: periodError } = await supabase
          .from("academic_periods")
          .select("*")
          .eq("is_active", true)
          .single();

        if (activePeriod) {
          setCurrentPeriod(activePeriod);
        }

        // 2. Obtener Datos del Estudiante
        const { data: student, error: stuError } = await supabase
          .from("students")
          .select("*")
          .eq("university_email", user.email)
          .single();

        if (stuError) throw stuError;
        setStudentData(student);

        // 3. Obtener Beca (Si existe para este estudiante en el periodo activo)
        // Intentamos buscar una beca que coincida con el estudiante Y el periodo actual
        if (activePeriod) {
          const { data: selection, error: selError } = await supabase
            .from("scholarship_selections")
            .select("*, careers(name)") // Ya no necesitamos traer academic_periods aquí para el título
            .eq("student_id", student.id)
            .eq("period_id", activePeriod.id) // Filtramos por el periodo actual
            .maybeSingle(); // Usamos maybeSingle para que no lance error si no hay resultados (simplemente devuelve null)

          setScholarship(selection);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-primary-600 font-semibold">
          Cargando perfil académico...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-primary-900">
                UCE Becas
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 font-medium">
                {studentData?.first_name} {studentData?.last_name}
              </span>
              <button
                onClick={signOut}
                className="text-sm text-red-600 hover:text-red-800 font-medium border border-red-100 px-3 py-1 rounded bg-red-50"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Académico
          </h1>
          {/* AQUI ESTÁ EL CAMBIO: Usamos currentPeriod.name o un fallback */}
          <p className="mt-2 text-lg text-primary-700 font-medium bg-primary-50 inline-block px-3 py-1 rounded-md border border-primary-100">
            Periodo Actual: {currentPeriod?.name || "No hay periodo activo"}
          </p>
        </div>

        {/* Scholarship Status Card */}
        {scholarship ? (
          <div className="bg-white overflow-hidden shadow-lg rounded-lg mb-8 border border-gray-100">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Estado de tu Beca
              </h3>

              {/* Timeline Component */}
              <Timeline currentStatus={scholarship.status} />

              <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Carrera:{" "}
                      <span className="font-bold">
                        {scholarship.careers?.name}
                      </span>{" "}
                      <br />
                      Promedio registrado:{" "}
                      <span className="font-bold">
                        {scholarship.average_grade}
                      </span>{" "}
                      | Condición: {scholarship.academic_condition}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-end border-t border-gray-100">
              {scholarship.status === "SELECTED" ||
              scholarship.status === "NOTIFIED" ||
              scholarship.status === "CHANGES_REQUESTED" ? (
                <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 shadow-sm transition-colors">
                  <UploadCloud size={18} />
                  Subir Certificado Bancario
                </button>
              ) : (
                <span className="text-sm text-gray-500 italic flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  No hay acciones pendientes por ahora.
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-8 text-center border border-gray-200">
            <div className="bg-yellow-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No seleccionado para Beca
            </h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              Hola <strong>{studentData?.first_name}</strong>, no hemos
              encontrado una asignación de beca activa para ti en el periodo{" "}
              <strong>{currentPeriod?.name}</strong>.
            </p>
            <p className="text-sm text-gray-400 mt-4">
              Si crees que esto es un error, por favor contacta a Bienestar
              Estudiantil.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
