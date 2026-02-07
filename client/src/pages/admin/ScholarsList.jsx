import React from "react";
import { Users } from "lucide-react";

import ScholarshipTable from "../../components/organisms/ScholarshipTable";
import Heading from "../../components/atoms/Heading";

/**
 * PAGE: ScholarsList
 */
const ScholarsList = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1" size="xl" className="flex items-center gap-2">
            <Users className="text-brand-blue" /> Listado de Becarios
          </Heading>
          <p className="text-gray-500 mt-1">
            Gestiona el estado y documentación de los becarios del programa.
          </p>
        </div>
      </div>

      {/* SCHOLARSHIP TABLE ORGANISM */}
      <ScholarshipTable />
    </div>
  );
};

export default ScholarsList;
