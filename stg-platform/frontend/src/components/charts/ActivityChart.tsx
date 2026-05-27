import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Seg", users: 120, tournaments: 25, xp: 1200 },
  { name: "Ter", users: 135, tournaments: 28, xp: 1350 },
  { name: "Qua", users: 145, tournaments: 32, xp: 1450 },
  { name: "Qui", users: 160, tournaments: 35, xp: 1600 },
  { name: "Sex", users: 175, tournaments: 42, xp: 1750 },
  { name: "Sab", users: 200, tournaments: 50, xp: 2000 },
  { name: "Dom", users: 220, tournaments: 55, xp: 2200 },
];

export function ActivityChart() {
  return (
    <div className="tactical-panel tactical-edge p-6">
      <p className="tactical-label mb-1">telemetria</p>
      <h3 className="mb-4 text-xl font-black uppercase tracking-[0.06em] text-[#f1f0e7]">Atividade da Semana</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(214, 162, 63, 0.16)" />
          <XAxis stroke="#9ca58d" style={{ fontSize: "12px", fontWeight: 700 }} />
          <YAxis stroke="#9ca58d" style={{ fontSize: "12px", fontWeight: 700 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#10130e",
              border: "1px solid rgba(214, 162, 63, 0.35)",
              borderRadius: "2px",
            }}
            labelStyle={{ color: "#d6a23f" }}
          />
          <Line
            type="monotone"
            dataKey="users"
            stroke="#d6a23f"
            strokeWidth={2}
            dot={{ fill: "#d6a23f", r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="tournaments"
            stroke="#b7ff4a"
            strokeWidth={2}
            dot={{ fill: "#b7ff4a", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
