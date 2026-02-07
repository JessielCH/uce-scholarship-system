import React from "react";
import { TrendingUp } from "lucide-react";

/**
 * MOLECULE: KPICard
 */
const KPICard = ({
  title,
  value,
  unit = "",
  icon: Icon = null,
  iconColor = "text-blue-600",
  iconBgColor = "bg-blue-50",
  trend = null,
  trendColor = "text-green-600",
  footer = null,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${className}`}
      {...props}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-500 font-medium text-sm">{title}</h3>
        {Icon && (
          <div className={`${iconBgColor} p-2 rounded`}>
            <Icon className={`${iconColor}`} size={24} />
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {unit && <span className="text-gray-400 text-sm mb-1">{unit}</span>}
      </div>

      {trend && (
        <p className={`text-xs ${trendColor} flex items-center gap-1 mb-2`}>
          <TrendingUp size={12} /> {trend}
        </p>
      )}

      {footer && <p className="text-xs text-gray-500 text-right">{footer}</p>}
    </div>
  );
};

export default KPICard;
