import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/**
 * ORGANISM: FunnelChart
 * Visualizes the scholarship request funnel (funnel/conversion data)
 * Reemplaza JSX inline en AdminDashboard
 */
const FunnelChart = ({ funnel }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        📊 Embudo de Solicitudes
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={funnel}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={true}
            vertical={false}
          />
          <XAxis type="number" hide />
          <YAxis
            dataKey="stage"
            type="category"
            tick={{ fontSize: 12, fill: "#666" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(96, 165, 250, 0.1)" }}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e0e7ff",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="count" fill="#3B82F6" radius={[0, 8, 8, 0]}>
            {funnel.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FunnelChart;
