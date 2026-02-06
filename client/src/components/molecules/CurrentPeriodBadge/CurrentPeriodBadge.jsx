import { useAcademicPeriods } from "../../../hooks/useScholarshipQueries";
import { Calendar } from "lucide-react";

const CurrentPeriodBadge = () => {
  const { data: periods, isLoading } = useAcademicPeriods();

  const currentPeriod = periods?.find((p) => p.is_active);

  if (isLoading || !currentPeriod) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold uppercase tracking-widest">
      <Calendar size={14} />
      <span>{currentPeriod.name || "Período Actual"}</span>
    </div>
  );
};

export default CurrentPeriodBadge;
