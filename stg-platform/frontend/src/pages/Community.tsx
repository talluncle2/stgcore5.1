import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Users } from "lucide-react";
import { getOverview } from "../services/api";
import { PublicOverview } from "../types/api";

export function Community() {
  const [overview, setOverview] = useState<PublicOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchOverview() {
    setLoading(true);
    setError("");
    try {
      const data = await getOverview();
      setOverview(data);
      if (data.api !== "online") {
        setError("Dados indisponiveis no momento.");
      }
    } catch {
      setOverview(null);
      setError("Dados indisponiveis no momento.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchOverview();
  }, []);

  return (
    <div className="stg-standalone-page min-h-screen px-4 py-8 text-white">
      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg border border-[#a855f7]/45 bg-[#a855f7]/10">
              <Users className="text-[#c084fc]" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-[0.08em]">Comunidade STG</h1>
              <p className="mt-1 text-sm text-gray-400">
                Dados publicos carregados pela API configurada.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void fetchOverview()}
              disabled={loading}
              className="rounded-lg border border-[#a855f7]/35 px-4 py-2 text-sm font-bold text-[#c084fc] transition-colors hover:bg-[#a855f7]/10 disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "inline animate-spin" : "inline"} />
              <span className="ml-2">Atualizar</span>
            </button>
            <Link to="/" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5">
              <ArrowLeft size={16} className="inline" />
              <span className="ml-2">Home</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-[#f97316]/25 bg-[#f97316]/10 p-4 text-sm text-orange-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Usuarios", value: overview?.users_total ?? 0 },
            { label: "Produtos", value: overview?.products_total ?? 0 },
            { label: "Torneios", value: overview?.tournaments_total ?? 0 },
            { label: "Punicoes", value: overview?.punishments_total ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="stg-hud-panel rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{loading ? "-" : stat.value}</div>
              <div className="mt-1 text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="stg-hud-panel mt-8 rounded-lg p-6">
          <h2 className="mb-3 text-lg font-bold">Status</h2>
          <p className="text-sm text-gray-400">
            O frontend nao chama o bot Discord diretamente. Informacoes detalhadas da comunidade devem ser expostas pela
            API online do Replit em endpoints publicos permitidos.
          </p>
        </div>
      </div>
    </div>
  );
}
