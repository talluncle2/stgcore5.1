import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  color?: "purple" | "blue" | "green" | "orange";
}

const colorMap = {
  purple: "from-[#a855f7] to-[#7c3aed] border-[#a855f7]/30 glow-purple",
  blue: "from-[#38bdf8] to-[#0ea5e9] border-[#38bdf8]/30 glow-blue",
  green: "from-[#84cc16] to-[#22c55e] border-[#84cc16]/30 glow-green",
  orange: "from-[#f97316] to-[#ea580c] border-[#f97316]/30 glow-orange",
};

export function StatCard({
  title,
  value,
  icon,
  trend,
  color = "purple",
}: StatCardProps) {
  return (
    <div className="stg-hud-panel group p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[var(--stg-purple)]/30 border-[#7c3aed]/30">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`tactical-edge flex size-12 items-center justify-center bg-gradient-to-br ${colorMap[color]} text-white shadow-lg transition-transform group-hover:scale-110`}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={`text-xs font-bold px-2 py-1 rounded-lg ${
              trend > 0
                ? "stg-badge-success"
                : "stg-badge-danger"
            }`}
          >
            {trend > 0 ? "↑" : "↓"}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <p className="tactical-label mb-1">{title}</p>
      <p className="text-3xl font-black uppercase tracking-[0.04em] text-[#f8fafc]">{value}</p>
    </div>
  );
}
