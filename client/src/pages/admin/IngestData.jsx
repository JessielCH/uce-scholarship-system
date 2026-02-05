import React, { useState } from "react";
import * as XLSX from "xlsx";
import { processScholarshipFile } from "../../utils/scholarshipLogic";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  Save,
  Loader2,
  Trash2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const IngestData = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [stats, setStats] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const { data: activePeriod } = useQuery({
    queryKey: ["activePeriod"],
    queryFn: async () => {
      const { data } = await supabase
        .from("academic_periods")
        .select("*")
        .eq("is_active", true)
        .single();
      return data || { id: null, name: "Sin Periodo Activo" };
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
      const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[wsname]);
      const { processedData, stats } = processScholarshipFile(rawData);
      setPreviewData(processedData);
      setStats(stats);
      setUploadStatus(null);
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleSaveToDB = async () => {
    if (!activePeriod?.id) {
      alert("Error: No hay un periodo académico activo configurado.");
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);
    console.group("🚀 [AUDIT LOG] Inicio de Ingesta Masiva");
    console.log(`Periodo Activo: ${activePeriod.name} (${activePeriod.id})`);

    try {
      // 1. SINCRONIZACIÓN DE ESTRUCTURA (FACULTADES)
      console.log("📂 Paso 1: Sincronizando Facultades...");
      const uniqueFaculties = [...new Set(previewData.map((s) => s.faculty))];

      for (const fName of uniqueFaculties) {
        const { error: facErr } = await supabase
          .from("faculties")
          .upsert({ name: fName }, { onConflict: "name" });
        if (facErr)
          console.warn(
            `⚠️ Nota: Facultad "${fName}" ya existe o error menor:`,
            facErr.message,
          );
      }

      const { data: facsDB } = await supabase
        .from("faculties")
        .select("id, name");
      console.log("✅ Facultades en BD:", facsDB);

      // 2. SINCRONIZACIÓN DE ESTRUCTURA (CARRERAS)
      console.log("⚙️ Paso 2: Sincronizando Carreras...");
      const uniqueCareers = [];
      const careerMap = new Set();

      previewData.forEach((s) => {
        if (!careerMap.has(s.career)) {
          const fId = facsDB.find((f) => f.name === s.faculty)?.id;
          if (fId) {
            uniqueCareers.push({ name: s.career, faculty_id: fId });
            careerMap.add(s.career);
          }
        }
      });

      const { error: carErr } = await supabase
        .from("careers")
        .upsert(uniqueCareers, { onConflict: "name" });

      if (carErr)
        throw new Error(`Error sincronizando carreras: ${carErr.message}`);

      const { data: careersDB } = await supabase
        .from("careers")
        .select("id, name");
      console.log("✅ Carreras en BD:", careersDB);

      // 3. REGISTRO DE ESTUDIANTES (UPSERT)
      console.log("👤 Paso 3: Registrando/Actualizando estudiantes...");
      const studentsPayload = previewData.map((s) => ({
        national_id: String(s.national_id),
        first_name: s.first_name,
        last_name: s.last_name,
        university_email: s.university_email,
      }));

      const { data: savedStudents, error: stuError } = await supabase
        .from("students")
        .upsert(studentsPayload, { onConflict: "university_email" })
        .select("id, university_email");

      if (stuError)
        throw new Error(`Error en tabla students: ${stuError.message}`);

      const emailToIdMap = {};
      savedStudents.forEach((s) => (emailToIdMap[s.university_email] = s.id));
      console.log(
        `✅ ${savedStudents.length} estudiantes listos para vinculación.`,
      );

      // 4. DISTRIBUCIÓN DE BECAS (SCHOLARSHIP_SELECTIONS)
      console.log("🏆 Paso 4: Distribuyendo becas seleccionadas...");
      const selectionsPayload = previewData
        .filter((s) => s.is_selected)
        .map((s) => {
          const studentId = emailToIdMap[s.university_email];
          const careerId = careersDB?.find((c) => c.name === s.career)?.id;

          if (!studentId || !careerId) {
            console.error(
              `❌ Error de vinculación para ${s.university_email}: ID Estudiante (${studentId}), ID Carrera (${careerId})`,
            );
            return null;
          }

          return {
            student_id: studentId,
            period_id: activePeriod.id,
            career_id: careerId,
            average_grade: s.average_grade,
            semester: s.semester,
            academic_condition: s.academic_condition,
            status: "SELECTED",
            is_top_10: true,
          };
        })
        .filter(Boolean);

      if (selectionsPayload.length > 0) {
        const { error: selError } = await supabase
          .from("scholarship_selections")
          .upsert(selectionsPayload, { onConflict: "student_id, period_id" });

        if (selError)
          throw new Error(
            `Error en scholarship_selections: ${selError.message}`,
          );
        console.log(
          `✅ ${selectionsPayload.length} registros de beca creados/actualizados.`,
        );
      } else {
        console.log(
          "ℹ️ No se encontraron estudiantes seleccionados para beca en este archivo.",
        );
      }

      console.log("🏁 [AUDIT LOG] Proceso de ingesta finalizado con éxito.");
      setUploadStatus("success");
    } catch (error) {
      console.error("🚨 [AUDIT LOG] FALLO CRÍTICO EN INGESTA:", error.message);
      alert("Error en la base de datos: " + error.message);
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
      console.groupEnd();
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">
            Ingesta de Datos Académicos
          </h1>
          <p className="text-sm text-gray-500">
            Periodo Activo:{" "}
            <span className="font-bold">{activePeriod?.name}</span>
          </p>
        </div>
        {stats && (
          <div className="flex gap-4 bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-center">
              <p className="text-xs text-gray-400 font-bold">TOTAL</p>
              <p className="font-bold text-lg">{stats.total}</p>
            </div>
            <div className="text-center border-x px-4">
              <p className="text-xs text-gray-400 font-bold">BECADOS</p>
              <p className="font-bold text-lg text-green-600">
                {stats.selected}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 font-bold">CARRERAS</p>
              <p className="font-bold text-lg">{stats.careers}</p>
            </div>
          </div>
        )}
      </div>

      {!file && (
        <div className="border-4 border-dashed border-gray-200 rounded-2xl p-20 text-center hover:bg-gray-50 transition-all relative">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-600">
            Arrastra el archivo de notas aquí para procesar
          </p>
        </div>
      )}

      {file && (
        <div className="bg-white border rounded-xl p-4 flex justify-between items-center shadow-md animate-in fade-in duration-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileSpreadsheet className="text-green-600 h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-gray-900 block">{file.name}</span>
              <span className="text-xs text-gray-400">
                Listo para importación
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFile(null);
                setPreviewData([]);
                setStats(null);
              }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={handleSaveToDB}
              disabled={isUploading || !activePeriod?.id}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 shadow-sm font-semibold"
            >
              {isUploading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <Save size={18} />
              )}
              {isUploading ? "Guardando..." : "Confirmar e Importar"}
            </button>
          </div>
        </div>
      )}

      {uploadStatus === "success" && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg flex items-center gap-3 animate-bounce">
          <CheckCircle className="h-5 w-5" />
          <span className="font-bold">
            ¡Datos distribuidos y guardados correctamente en la base de datos!
          </span>
        </div>
      )}

      {previewData.length > 0 && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-6 py-3 border-b flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-600 uppercase">
              Vista previa de resultados
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              Primeras 10 filas
            </span>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                  Estudiante
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                  Carrera
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                  Promedio
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {previewData.slice(0, 10).map((row, i) => (
                <tr
                  key={i}
                  className={`hover:bg-gray-50 transition-colors ${row.is_selected ? "bg-green-50/50" : ""}`}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {row.first_name} {row.last_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {row.career}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-700">
                    {row.average_grade}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {row.is_selected ? (
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 border border-green-200">
                        Seleccionado
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">
                        No elegible
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default IngestData;
