import React from "react";
import { Search } from "lucide-react";
import Input from "../../atoms/Input";

/**
 * MOLECULE: FiltersSection
 * Sección de búsqueda y filtros (búsqueda por nombre/cédula, estado, carrera)
 */
const FiltersSection = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  careerFilter,
  onCareerChange,
  careersData = [],
}) => {
  return (
    <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Buscar por nombre o cédula..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none text-sm"
        >
          <option value="">Todos los Estados</option>
          <option value="DOCS_UPLOADED">Documentos Subidos</option>
          <option value="APPROVED">Aprobado</option>
          <option value="CONTRACT_GENERATED">Contrato Generado</option>
          <option value="PAID">Pagado</option>
        </select>

        {/* Career Filter */}
        <select
          value={careerFilter}
          onChange={(e) => onCareerChange(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none text-sm"
        >
          <option value="">Todas las Carreras</option>
          {careersData?.map((career) => (
            <option key={career.id} value={career.id}>
              {career.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FiltersSection;
