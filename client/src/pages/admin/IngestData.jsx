import React, { useState } from "react";
import * as XLSX from "xlsx";
import { processScholarshipFile } from "../../utils/scholarshipLogic";
import { supabase } from "../../services/supabaseClient";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Save,
  Loader2,
  Trash2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const IngestData = () => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [stats, setStats] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error'

  // Obtener periodo activo automáticamente
  const { data: activePeriod } = useQuery({
    queryKey: ["activePeriod"],
    queryFn: async () => {
      const { data } = await supabase
        .from("academic_periods")
        .select("*")
        .eq("is_active", true)
        .single();
      return data || { id: null, name: "Periodo Desconocido" }; // Fallback
    },
  });

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();

    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const wsname = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json(ws);

      // Procesar Algoritmo Localmente
      const { processedData, stats } = processScholarshipFile(rawData);
      setPreviewData(processedData);
      setStats(stats);
      setUploadStatus(null);
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleSaveToDB = async () => {
    if (!activePeriod?.id) {
      alert("No hay un periodo académico activo configurado en la BD.");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Preparar Upsert de Estudiantes (Lote masivo)
      const studentsPayload = previewData.map((s) => ({
        national_id: s.national_id,
        first_name: s.first_name,
        last_name: s.last_name,
        university_email: s.university_email,
      }));

      // Insertar Estudiantes (Upsert para no duplicar, actualiza nombres si cambiaron)
      const { data: savedStudents, error: stuError } = await supabase
        .from("students")
        .upsert(studentsPayload, { onConflict: "university_email" })
        .select("id, university_email");

      if (stuError) throw stuError;

      // Crear mapa de correo -> ID para enlazar las becas
      const emailToIdMap = {};
      savedStudents.forEach((s) => (emailToIdMap[s.university_email] = s.id));

      // 2. Preparar Becas (Solo los SELECCIONADOS)
      const selectedStudents = previewData.filter((s) => s.is_selected);

      // Necesitamos los IDs de Carreras.
      // OPTIMIZACIÓN: Asumimos que las carreras ya existen o las creamos al vuelo.
      // Para simplificar este sprint, asumiremos que existen. Si no, habría que insertarlas antes.
      // Haremos un fetch de todas las carreras para mapear nombres a IDs.
      const { data: careersDB } = await supabase
        .from("careers")
        .select("id, name");

      const selectionsPayload = [];

      for (const s of selectedStudents) {
        const studentId = emailToIdMap[s.university_email];
        // Buscar ID de carrera (simple matching)
        const careerId = careersDB?.find((c) => c.name === s.career)?.id;

        // Si la carrera no existe en BD, saltamos o usamos un ID genérico (Manejo de errores básico)
        if (studentId && careerId) {
          selectionsPayload.push({
            student_id: studentId,
            period_id: activePeriod.id,
            career_id: careerId,
            average_grade: s.average_grade,
            semester: s.semester,
            academic_condition: s.academic_condition,
            status: "SELECTED",
            is_top_10: true,
          });
        }
      }

      if (selectionsPayload.length > 0) {
        const { error: selError } = await supabase
          .from("scholarship_selections")
          .upsert(selectionsPayload, { onConflict: "student_id, period_id" });

        if (selError) throw selError;
      }

      // Audit Log
      await supabase.from("audit_logs").insert({
        action: "BULK_IMPORT",
        target_entity: "scholarship_selections",
        target_id: activePeriod.id,
        details: {
          filename: file.name,
          total_processed: stats.total,
          selected: stats.selected,
        },
      });

      setUploadStatus("success");
      setFile(null); // Reset UI pero dejar preview visible como confirmación
    } catch (error) {
      console.error(error);
      alert("Error al guardar en BD: " + error.message);
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ingesta de Datos Académicos
          </h1>
          <p className="text-sm text-gray-500">
            Periodo Activo:{" "}
            <span className="font-semibold text-primary-600">
              {activePeriod?.name || "Cargando..."}
            </span>
          </p>
        </div>

        {stats && (
          <div className="flex gap-4 bg-white p-2 rounded-lg shadow-sm text-sm">
            <div className="px-3 border-r">
              <span className="block text-gray-400 text-xs">
                Total Procesado
              </span>
              <span className="font-bold text-xl">{stats.total}</span>
            </div>
            <div className="px-3 border-r">
              <span className="block text-gray-400 text-xs">
                Seleccionados (Top 10%)
              </span>
              <span className="font-bold text-xl text-green-600">
                {stats.selected}
              </span>
            </div>
            <div className="px-3">
              <span className="block text-gray-400 text-xs">Carreras</span>
              <span className="font-bold text-xl">{stats.careers}</span>
            </div>
          </div>
        )}
      </div>

      {/* Upload Zone */}
      {!file && !uploadStatus && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition-colors relative">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center">
            <div className="p-4 bg-primary-50 rounded-full mb-4">
              <UploadCloud className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Arrastra tu archivo Excel aquí
            </h3>
            <p className="text-gray-500 mt-1">o haz clic para seleccionar</p>
            <p className="text-xs text-gray-400 mt-4">
              Formato requerido: Cedula, Nombres, Apellidos, Correo, Facultad,
              Carrera, Semestre, Promedio, Condicion
            </p>
          </div>
        </div>
      )}

      {/* File Loaded State */}
      {file && (
        <div className="bg-white border rounded-lg p-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="text-green-600 h-8 w-8" />
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>

          {uploadStatus === "success" ? (
            <span className="flex items-center text-green-600 font-bold px-4 py-2 bg-green-50 rounded-md">
              <CheckCircle className="mr-2 h-5 w-5" /> Datos Guardados
            </span>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFile(null);
                  setPreviewData([]);
                  setStats(null);
                }}
                className="p-2 text-red-500 hover:bg-red-50 rounded-md"
              >
                <Trash2 size={20} />
              </button>
              <button
                onClick={handleSaveToDB}
                disabled={isUploading || !activePeriod?.id}
                className="flex items-center bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Confirmar e Importar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preview Table */}
      {previewData.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">
              Pre-visualización de Resultados
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Carrera
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Promedio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado Calc.
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.slice(0, 50).map((row, idx) => (
                  <tr
                    key={idx}
                    className={row.is_selected ? "bg-green-50" : ""}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.first_name} {row.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.career}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                      {row.average_grade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.is_selected ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Seleccionado (Corte: {row.cutoff_used})
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-500">
                          {row.rejection_reason}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.length > 50 && (
              <div className="p-4 text-center text-sm text-gray-500 bg-gray-50">
                Mostrando 50 de {previewData.length} registros...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IngestData;
