import React from "react";
import { Timeline } from "../../ui/Timeline";

/**
 * ORGANISM: ScholarshipProgressTimeline
 * Request progress and timeline section
 * Reemplaza JSX inline en Student Dashboard
 */
const ScholarshipProgressTimeline = ({ scholarshipStatus }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <h3 className="text-lg font-bold text-gray-800 mb-6">
        Progreso de la Solicitud
      </h3>
      <Timeline currentStatus={scholarshipStatus} />
    </div>
  );
};

export default ScholarshipProgressTimeline;
