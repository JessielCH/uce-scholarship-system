import React, { useState, useEffect } from "react";
import { Loader, Calendar, CheckCircle, XCircle } from "lucide-react";

/**
 * COMPONENT: ScholarshipPhase
 */
const ScholarshipPhase = ({ entryId }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const spaceId = import.meta.env.VITE_CONTENTFUL_SPACE_ID;
        const accessToken = import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN;

        const response = await fetch(
          `https://cdn.contentful.com/spaces/${spaceId}/entries/${entryId}?access_token=${accessToken}`,
        );

        if (!response.ok) throw new Error("Error fetching content");

        const data = await response.json();
        setContent(data.fields);
      } catch (err) {
        console.error("Error:", err);
        setError("No se pudo cargar el contenido");
      } finally {
        setLoading(false);
      }
    };

    if (entryId) fetchContent();
  }, [entryId]);

  if (loading) {
    return (
      <div className="rounded-lg border-2 border-gray-200 p-8 flex justify-center min-h-[200px] items-center">
        <Loader size={28} className="animate-spin text-brand-blue" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="rounded-lg border-2 border-red-200 bg-red-50 p-8">
        <p className="text-red-700">{error || "Sin contenido"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* MAIN CARD - EVERYTHING IN A NICE BOX */}
      <div className="bg-white rounded-2xl border-3 border-brand-blue shadow-2xl overflow-hidden">
        {/* HEADER CON GRADIENTE */}
        <div className="bg-gradient-to-r from-brand-blue via-blue-600 to-blue-700 text-white px-8 py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="inline-block bg-white bg-opacity-20 backdrop-blur-sm text-white px-5 py-2 rounded-full text-sm font-bold mb-3">
                FASE #{content.phaseNumber || "—"}
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                {content.title || content.tittle || "Sin título"}
              </h1>
            </div>
            {content.isActive !== undefined && (
              <div
                className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-lg whitespace-nowrap ${
                  content.isActive
                    ? "bg-green-400 text-green-900 shadow-lg"
                    : "bg-red-400 text-red-900 shadow-lg"
                }`}
              >
                {content.isActive ? (
                  <>
                    <CheckCircle size={24} />
                    ACTIVA
                  </>
                ) : (
                  <>
                    <XCircle size={24} />
                    INACTIVA
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="px-8 py-8 space-y-8">
          {/* CRONOGRAMA */}
          {(content.startDate || content.endDate) && (
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                📅 CRONOGRAMA
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {content.startDate && (
                  <div className="bg-white rounded-lg p-5 border-l-4 border-brand-blue shadow-sm hover:shadow-md transition">
                    <p className="text-xs font-bold text-brand-blue uppercase tracking-widest mb-2">
                      📍 Fecha de Inicio
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Date(content.startDate).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-gray-600 mt-2 capitalize">
                      {new Date(content.startDate).toLocaleDateString("es-ES", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {content.endDate && (
                  <div className="bg-white rounded-lg p-5 border-l-4 border-brand-blue shadow-sm hover:shadow-md transition">
                    <p className="text-xs font-bold text-brand-blue uppercase tracking-widest mb-2">
                      🏁 Fecha de Fin
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Date(content.endDate).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-gray-600 mt-2 capitalize">
                      {new Date(content.endDate).toLocaleDateString("es-ES", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DESCRIPCIÓN */}
          {content.description && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                📝 DESCRIPCIÓN
              </h3>
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <p className="text-lg text-gray-800 leading-relaxed font-medium">
                  {content.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScholarshipPhase;
