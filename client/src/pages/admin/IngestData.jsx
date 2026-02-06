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
  Info,
  ChevronRight,
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

    try {
      // 1. SINCRONIZACIÓN DE ESTRUCTURA (FACULTADES)
      const uniqueFaculties = [...new Set(previewData.map((s) => s.faculty))];
      for (const fName of uniqueFaculties) {
        await supabase
          .from("faculties")
          .upsert({ name: fName }, { onConflict: "name" });
      }
      const { data: facsDB } = await supabase
        .from("faculties")
        .select("id, name");

      // 2. SINCRONIZACIÓN DE ESTRUCTURA (CARRERAS)
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
      await supabase
        .from("careers")
        .upsert(uniqueCareers, { onConflict: "name" });
      const { data: careersDB } = await supabase
        .from("careers")
        .select("id, name");

      // 3. REGISTRO DE ESTUDIANTES (UPSERT)
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

      // 4. DISTRIBUCIÓN DE BECAS (SCHOLARSHIP_SELECTIONS)
      const selectionsPayload = previewData
        .filter((s) => s.is_selected)
        .map((s) => {
          const studentId = emailToIdMap[s.university_email];
          const careerId = careersDB?.find((c) => c.name === s.career)?.id;
          if (!studentId || !careerId) return null;
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
      }

      setUploadStatus("success");
    } catch (error) {
      alert("Error en la base de datos: " + error.message);
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
      console.groupEnd();
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 animate-fade-in">
      {/* Header Responsivo */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-brand-blue italic tracking-tighter uppercase">
            Ingesta de Datos
          </h1>
          <p className="text-sm text-gray-500 font-bold flex items-center gap-2">
            Periodo:{" "}
            <span className="text-brand-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {activePeriod?.name}
            </span>
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-2 w-full lg:w-auto">
            {[
              { label: "TOTAL", val: stats.total, color: "text-gray-900" },
              {
                label: "BECADOS",
                val: stats.selected,
                color: "text-green-600",
              },
              {
                label: "CARRERAS",
                val: stats.careers,
                color: "text-brand-blue",
              },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center"
              >
                <p className="text-[10px] text-gray-400 font-black tracking-widest">
                  {s.label}
                </p>
                <p className={`font-black text-lg ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Area de Carga */}
      {!file && (
        <div className="border-4 border-dashed border-gray-100 rounded-3xl p-10 md:p-20 text-center hover:bg-gray-50 transition-all relative group overflow-hidden">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="relative z-0">
            <div className="bg-brand-blue/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <UploadCloud className="text-brand-blue h-10 w-10" />
            </div>
            <p className="text-lg font-black text-gray-700">
              Subir Listado de Notas
            </p>
            <p className="text-sm text-gray-400 font-medium mt-1">
              Arrastra aquí tu archivo .xlsx o haz clic
            </p>
          </div>
        </div>
      )}

      {/* Archivo Seleccionado - Botones Full Width en Mobile */}
      {file && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xl animate-in zoom-in-95 duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="p-3 bg-green-50 rounded-xl">
                <FileSpreadsheet className="text-green-600 h-6 w-6" />
              </div>
              <div className="truncate">
                <span className="font-black text-gray-900 block truncate max-w-[200px] md:max-w-xs">
                  {file.name}
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">
                  Archivo validado
                </span>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setFile(null);
                  setPreviewData([]);
                  setStats(null);
                }}
                className="flex-1 sm:flex-none p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={20} className="mx-auto" />
              </button>
              <button
                onClick={handleSaveToDB}
                disabled={isUploading || !activePeriod?.id}
                className="flex-[3] sm:flex-none bg-brand-blue text-white px-8 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-800 disabled:opacity-50 shadow-lg shadow-blue-100 font-black uppercase text-xs tracking-widest"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <Save size={18} />
                )}
                {isUploading ? "Procesando..." : "Importar Datos"}
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadStatus === "success" && (
        <div className="bg-green-600 text-white p-4 rounded-2xl flex items-center gap-4 shadow-lg animate-bounce">
          <div className="bg-white/20 p-2 rounded-full">
            <CheckCircle className="h-6 w-6" />
          </div>
          <span className="font-black uppercase text-xs tracking-widest">
            ¡Ingesta completada con éxito!
          </span>
        </div>
      )}

      {/* Vista Previa Responsiva (Cards en Mobile / Tabla en Desktop) */}
      {previewData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Info size={16} className="text-brand-blue" />
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Vista previa de resultados
            </h3>
          </div>

          {/* Cards Mobile */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {previewData.slice(0, 10).map((row, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl border ${row.is_selected ? "bg-green-50/50 border-green-100 shadow-sm" : "bg-white border-gray-100"}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-black text-gray-900">
                    {row.first_name} {row.last_name}
                  </span>
                  <span className="text-xs font-black text-brand-blue bg-white px-2 py-1 rounded-lg border border-gray-100">
                    {row.average_grade}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-medium truncate max-w-[150px]">
                    {row.career}
                  </span>
                  {row.is_selected ? (
                    <span className="text-[9px] font-black bg-green-600 text-white px-2 py-1 rounded-full uppercase italic">
                      Seleccionado
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">
                      No elegible
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tabla Desktop */}
          <div className="hidden md:block bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Estudiante
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Carrera
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Promedio
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {previewData.slice(0, 10).map((row, i) => (
                  <tr
                    key={i}
                    className={`hover:bg-gray-50/50 transition-colors ${row.is_selected ? "bg-green-50/20" : ""}`}
                  >
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {row.first_name} {row.last_name}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                      {row.career}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-brand-blue">
                      {row.average_grade}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {row.is_selected ? (
                        <span className="px-3 py-1 text-[10px] font-black rounded-full bg-green-100 text-green-700 border border-green-200 uppercase italic">
                          Seleccionado
                        </span>
                      ) : (
                        <span className="text-gray-300 font-bold text-[10px] uppercase">
                          Excluido
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngestData;
