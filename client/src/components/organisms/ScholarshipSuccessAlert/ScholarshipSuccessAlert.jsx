import React from "react";
import { CheckCircle } from "lucide-react";

/**
 * ORGANISM: ScholarshipSuccessAlert
 * Sección de éxito cuando la beca está PAGADA
 * Reemplaza JSX inline en Student Dashboard
 */
const ScholarshipSuccessAlert = () => {
  return (
    <div className="bg-green-600 rounded-2xl p-8 text-white shadow-2xl border-4 border-green-700 animate-fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-white/20 p-4 rounded-full">
            <CheckCircle className="text-white" size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">
              BECA PAGADA
            </h2>
            <p className="text-green-50 font-semibold opacity-90">
              El proceso ha finalizado satisfactoriamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipSuccessAlert;
