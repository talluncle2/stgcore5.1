import { Crosshair, Medal, Swords, Trophy } from "lucide-react";
import { WarzoneMetrics } from "../../types/warzone";

interface WarzoneMetricsPanelProps {
  metrics: WarzoneMetrics;
}

export function WarzoneMetricsPanel({ metrics }: WarzoneMetricsPanelProps) {
  const summary = [
    { label: "Eventos realizados", value: metrics.totalEvents, icon: Swords, tone: "text-[#a855f7]" },
    { label: "Kills da comunidade", value: metrics.totalKills, icon: Crosshair, tone: "text-[#ef4444]" },
    { label: "MVPs registrados", value: metrics.totalMvps, icon: Medal, tone: "text-[#84cc16]" },
    { label: "Clas vencedores", value: metrics.clanWins.length, icon: Trophy, tone: "text-[#f97316]" },
  ];

  return (
    <section className="space-y-5">
      <div>
        <p className="tactical-label mb-2">Historico competitivo</p>
        <h2 className="text-2xl font-black uppercase tracking-[0.07em] text-white md:text-3xl">
          Metricas gerais Warzone
        </h2>
        <p className="mt-2 text-sm text-[#94a3b8]">
          Resultados consolidados automaticamente a partir das operacoes encerradas.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="stg-hud-panel p-4">
            <Icon size={21} className={tone} />
            <p className="mt-3 text-3xl font-black text-white">{value}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-[#64748b]">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="stg-hud-panel-glow p-5">
          <h3 className="text-sm font-black uppercase tracking-[0.08em] text-[#c084fc]">Ranking geral de clas</h3>
          <div className="mt-4 space-y-2">
            {metrics.ranking.slice(0, 8).map((entry, index) => (
              <div key={entry.clan} className="grid grid-cols-[40px_1fr_auto] items-center gap-3 border-b border-[#a855f7]/10 py-3">
                <span className="font-black text-[#a855f7]">#{index + 1}</span>
                <div>
                  <p className="font-black uppercase text-white">{entry.clan}</p>
                  <p className="text-xs text-[#64748b]">{entry.wins} vitorias · {entry.kills} kills</p>
                </div>
                <span className="font-black text-[#84cc16]">{entry.points} pts</span>
              </div>
            ))}
            {metrics.ranking.length === 0 && (
              <p className="py-6 text-sm text-[#94a3b8]">Ranking aguardando o encerramento da primeira operacao.</p>
            )}
          </div>
        </div>

        <div className="stg-hud-panel-glow p-5">
          <h3 className="text-sm font-black uppercase tracking-[0.08em] text-[#c084fc]">Historico de eventos</h3>
          <div className="mt-4 space-y-3">
            {metrics.history.slice(0, 6).map((operation) => (
              <div key={operation.id} className="border border-[#a855f7]/15 bg-[#050608]/55 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black uppercase text-white">{operation.title}</p>
                    <p className="mt-1 text-xs text-[#94a3b8]">
                      Vencedor: {operation.result?.winnerClan} · MVP: {operation.result?.mvp}
                    </p>
                  </div>
                  <span className="stg-badge-success">{operation.result?.totalKills || 0} kills</span>
                </div>
              </div>
            ))}
            {metrics.history.length === 0 && (
              <p className="py-6 text-sm text-[#94a3b8]">Nenhuma operacao encerrada no historico.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
