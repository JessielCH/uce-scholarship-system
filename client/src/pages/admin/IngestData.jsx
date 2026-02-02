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
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error'

  // Fetch active period automatically
  const { data: activePeriod } = useQuery({
    queryKey: ["activePeriod"],
    queryFn: async () => {
      const { data } = await supabase
        .from("academic_periods")
        .select("*")
        .eq("is_active", true)
        .single();
      return data || { id: null, name: "Unknown Period" };
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

      // Process Algorithm Locally
      const { processedData, stats } = processScholarshipFile(rawData);
      setPreviewData(processedData);
      setStats(stats);
      setUploadStatus(null);
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleSaveToDB = async () => {
    if (!activePeriod?.id) {
      alert("No active academic period configured in the database.");
      return;
    }

    setIsUploading(true);

    // Log de inicio de operación en consola
    console.group("🚀 [AUDIT LOG] Inicio de Importación Masiva");
    console.log(`Usuario: ${user?.email} (ID: ${user?.id})`);
    console.log(`Archivo: ${file?.name}`);
    console.log(`Periodo Académico: ${activePeriod?.name}`);
    console.groupEnd();

    try {
      // 1. Prepare Students Upsert (Mass Batch)
      const studentsPayload = previewData.map((s) => ({
        national_id: s.national_id,
        first_name: s.first_name,
        last_name: s.last_name,
        university_email: s.university_email,
      }));

      // Insert Students (Upsert)
      const { data: savedStudents, error: stuError } = await supabase
        .from("students")
        .upsert(studentsPayload, { onConflict: "university_email" })
        .select("id, university_email");

      if (stuError) throw stuError;

      // Map email -> ID
      const emailToIdMap = {};
      savedStudents.forEach((s) => (emailToIdMap[s.university_email] = s.id));

      // 2. Prepare Scholarships (Only SELECTED)
      const selectedStudents = previewData.filter((s) => s.is_selected);

      // Fetch careers for ID mapping
      const { data: careersDB } = await supabase
        .from("careers")
        .select("id, name");

      const selectionsPayload = [];

      for (const s of selectedStudents) {
        const studentId = emailToIdMap[s.university_email];
        const careerId = careersDB?.find((c) => c.name === s.career)?.id;

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

      // Reemplazo de Audit Log en DB por Console Log detallado
      console.group("✅ [AUDIT LOG] Importación Completada Exitosamente");
      console.log(`Acción: BULK_IMPORT`);
      console.log(`Entidad: scholarship_selections`);
      console.log(`Resultados:`, {
        filename: file.name,
        total_procesados: stats.total,
        seleccionados: stats.selected,
        carreras_afectadas: stats.careers,
        timestamp: new Date().toISOString(),
      });
      console.groupEnd();

      setUploadStatus("success");
      setFile(null);
    } catch (error) {
      console.error("❌ [AUDIT LOG] Error en Importación:", error);
      alert("Error saving to DB: " + error.message);
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-blue">
            Academic Data Ingestion
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Active Period:{" "}
            <span className="font-semibold text-brand-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {activePeriod?.name || "Loading..."}
            </span>
          </p>
        </div>

        {stats && (
          <div className="flex gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-sm">
            <div className="px-3 border-r border-gray-100">
              <span className="block text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Total Processed
              </span>
              <span className="font-bold text-xl text-gray-800">
                {stats.total}
              </span>
            </div>
            <div className="px-3 border-r border-gray-100">
              <span className="block text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Selected (Top 10%)
              </span>
              <span className="font-bold text-xl text-status-success">
                {stats.selected}
              </span>
            </div>
            <div className="px-3">
              <span className="block text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Careers
              </span>
              <span className="font-bold text-xl text-gray-800">
                {stats.careers}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Upload Zone */}
      {!file && !uploadStatus && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center hover:bg-blue-50 hover:border-brand-blue transition-all relative group">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center pointer-events-none">
            <div className="p-4 bg-blue-100 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="h-10 w-10 text-brand-blue" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Drag your Excel file here
            </h3>
            <p className="text-gray-500 mt-1">or click to browse</p>
            <p className="text-xs text-gray-400 mt-4 bg-gray-100 px-3 py-1 rounded-full">
              Required columns: Cedula, Nombres, Apellidos, Correo, Facultad,
              Carrera, Semestre, Promedio, Condicion
            </p>
          </div>
        </div>
      )}

      {/* File Loaded State */}
      {file && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex justify-between items-center shadow-sm animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <FileSpreadsheet className="text-green-600 h-8 w-8" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500 font-mono">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>

          {uploadStatus === "success" ? (
            <span className="flex items-center text-green-700 font-bold px-4 py-2 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="mr-2 h-5 w-5" /> Data Saved Successfully
            </span>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setFile(null);
                  setPreviewData([]);
                  setStats(null);
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Discard"
              >
                <Trash2 size={20} />
              </button>
              <button
                onClick={handleSaveToDB}
                disabled={isUploading || !activePeriod?.id}
                className="flex items-center bg-brand-blue text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-md"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Confirm & Import
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preview Table */}
      {previewData.length > 0 && (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200 animate-in-delayed">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Result Preview
            </h3>
            <span className="text-xs text-gray-500">Showing first 50 rows</span>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Career
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Avg Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {previewData.slice(0, 50).map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors hover:bg-gray-50 ${row.is_selected ? "bg-green-50/50" : ""}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 border border-green-200">
                          Selected (Cutoff: {row.cutoff_used})
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                          {row.rejection_reason}
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
