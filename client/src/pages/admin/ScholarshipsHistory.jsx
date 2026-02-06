import React from "react";
import { Clock } from "lucide-react";

// Componentes Atomic Design
import HistoricalScholarshipTable from "../../components/organisms/HistoricalScholarshipTable";
import Heading from "../../components/atoms/Heading";

/**
 * PAGE: ScholarshipsHistory
 * Página para gestión de becarios históricos de períodos anteriores
 */
const ScholarshipsHistory = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1" size="xl" className="flex items-center gap-2">
            <Clock className="text-brand-blue" /> Listado de Becarios Históricos
          </Heading>
          <p className="text-gray-500 mt-1">
            Consulta y gestiona becarios de períodos académicos anteriores.
          </p>
        </div>
      </div>

      {/* HISTORICAL SCHOLARSHIP TABLE ORGANISM */}
      <HistoricalScholarshipTable />
    </div>
  );
};

export default ScholarshipsHistory;
