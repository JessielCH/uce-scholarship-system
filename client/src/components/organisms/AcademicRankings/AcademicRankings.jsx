import React from "react";
import { Award, TrendingUp } from "lucide-react";

/**
 * ORGANISM: AcademicRankings
 * Muestra las facultades y carreras con mejor promedio
 */
const AcademicRankings = ({ topFaculty, topCareer, faculties, careers }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* TOP FACULTY */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-50 rounded-xl">
            <Award className="text-purple-600 h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">
              Facultad Destacada
            </h3>
            <p className="text-xs text-gray-500">Mejor promedio académico</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-2xl font-black text-gray-900 mb-1">
            {topFaculty?.name || "N/A"}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-600">
              {topFaculty?.average || "0.00"}
            </span>
            <span className="text-xs text-gray-400 font-bold">/ 10</span>
          </div>
        </div>

        {/* All Faculties Ranking */}
        {faculties && faculties.length > 0 && (
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
              Ranking de Facultades
            </p>
            {faculties.slice(0, 5).map((faculty, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-300 bg-gray-50 px-2 py-1 rounded-lg min-w-[24px] text-center">
                    #{idx + 1}
                  </span>
                  <p className="text-gray-700 font-medium truncate">
                    {faculty.name}
                  </p>
                </div>
                <span className="font-black text-purple-600 text-xs">
                  {faculty.average}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOP CAREER */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <TrendingUp className="text-blue-600 h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">
              Carrera Destaca
            </h3>
            <p className="text-xs text-gray-500">Mejor promedio académico</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-2xl font-black text-gray-900 mb-1">
            {topCareer?.name || "N/A"}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-600">
              {topCareer?.average || "0.00"}
            </span>
            <span className="text-xs text-gray-400 font-bold">/ 10</span>
          </div>
        </div>

        {/* All Careers Ranking */}
        {careers && careers.length > 0 && (
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
              Ranking de Carreras
            </p>
            {careers.slice(0, 5).map((career, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-300 bg-gray-50 px-2 py-1 rounded-lg min-w-[24px] text-center">
                    #{idx + 1}
                  </span>
                  <p className="text-gray-700 font-medium truncate">
                    {career.name}
                  </p>
                </div>
                <span className="font-black text-blue-600 text-xs">
                  {career.average}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicRankings;
