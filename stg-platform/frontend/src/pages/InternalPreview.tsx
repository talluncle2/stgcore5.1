import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, Database, ExternalLink, RefreshCw, Server, ShieldAlert, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import {
  API_BASE_URL,
  buildApiUrl,
  getHealth,
  getOverview,
  getProducts,
  getRanking,
  getTournaments,
} from "../services/api";

type PreviewStatus = "idle" | "loading" | "online" | "offline";

interface PreviewResult {
  label: string;
  endpoint: string;
  ok: boolean;
  detail: string;
}

const checks = [
  {
    label: "Saude da API",
    endpoint: "/health",
    run: async () => {
      const data = await getHealth();
      return {
        ok: data.status === "online",
        detail: data.status === "online" ? "API respondeu online" : "Sem resposta online",
      };
    },
  },
  {
    label: "Overview publico",
    endpoint: "/public/overview",
    run: async () => {
      const data = await getOverview();
      return {
        ok: data.api === "online",
        detail: `${data.users_total} usuarios, ${data.products_total} produtos, ${data.tournaments_total} torneios`,
      };
    },
  },
  {
    label: "Ranking",
    endpoint: "/public/ranking?limit=5",
    run: async () => {
      const data = await getRanking(5);
      return {
        ok: true,
        detail: `${data.length} registros carregados`,
      };
    },
  },
  {
    label: "Loja",
    endpoint: "/public/products?limit=5",
    run: async () => {
      const data = await getProducts(undefined, 5);
      return {
        ok: true,
        detail: `${data.length} produtos carregados`,
      };
    },
  },
  {
    label: "Torneios",
    endpoint: "/public/tournaments?limit=5",
    run: async () => {
      const data = await getTournaments(undefined, 5);
      return {
        ok: true,
        detail: `${data.length} torneios carregados`,
      };
    },
  },
];

export function InternalPreview() {
  const [status, setStatus] = useState<PreviewStatus>("idle");
  const [results, setResults] = useState<PreviewResult[]>([]);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const connectionMode = useMemo(() => {
    return API_BASE_URL;
  }, []);

  const runChecks = useCallback(async () => {
    setStatus("loading");

    const settled = await Promise.all(
      checks.map(async (check): Promise<PreviewResult> => {
        try {
          const result = await check.run();
          return {
            label: check.label,
            endpoint: check.endpoint,
            ok: result.ok,
            detail: result.detail,
          };
        } catch (error) {
          return {
            label: check.label,
            endpoint: check.endpoint,
            ok: false,
            detail: error instanceof Error ? error.message : "Falha desconhecida",
          };
        }
      })
    );

    setResults(settled);
    setStatus(settled.some((result) => result.ok) ? "online" : "offline");
    setLastRun(new Date().toLocaleString("pt-BR"));
  }, []);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  const onlineCount = results.filter((result) => result.ok).length;
  const totalCount = checks.length;

  return (
    <main className="stg-standalone-page min-h-screen px-4 py-6 text-[#f8fafc] md:px-8">
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6">
        <header className="stg-hud-panel-glow flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="tactical-edge flex size-12 shrink-0 items-center justify-center border border-[#38bdf8]/50 bg-[#38bdf8]/10 text-[#38bdf8]">
              <Server size={24} />
            </div>
            <div>
              <p className="tactical-label mb-2">Preview interna</p>
              <h1 className="text-2xl font-black uppercase text-[#f8fafc] md:text-3xl">Teste de conexao API</h1>
              <p className="mt-2 max-w-2xl text-sm text-[#94a3b8]">
                Painel de validacao rapida para confirmar frontend, proxy local e endpoints publicos antes de conectar
                a interface final.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/" className="stg-button-outline inline-flex items-center gap-2">
              <ExternalLink size={16} />
              Home
            </Link>
            <button
              type="button"
              onClick={() => void runChecks()}
              disabled={status === "loading"}
              className="stg-button-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={status === "loading" ? "animate-spin" : ""} />
              Revalidar
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="stg-hud-panel p-5">
            <div className="mb-3 flex items-center gap-2 text-[#38bdf8]">
              <Activity size={18} />
              <span className="tactical-label text-[#38bdf8]">Status</span>
            </div>
            <p className={status === "offline" ? "text-3xl font-black text-[#ef4444]" : "text-3xl font-black text-[#84cc16]"}>
              {status === "loading" ? "Validando" : status === "offline" ? "Offline" : "Online"}
            </p>
            <p className="mt-2 text-sm text-[#94a3b8]">
              {onlineCount}/{totalCount} verificacoes respondendo
            </p>
          </div>

          <div className="stg-hud-panel p-5">
            <div className="mb-3 flex items-center gap-2 text-[#a855f7]">
              <Database size={18} />
              <span className="tactical-label text-[#a855f7]">Base URL</span>
            </div>
            <p className="break-all text-sm font-bold text-[#f8fafc]">{connectionMode}</p>
            <p className="mt-2 text-xs text-[#94a3b8]">Configure `VITE_API_BASE_URL` para usar uma API externa.</p>
          </div>

          <div className="stg-hud-panel p-5">
            <div className="mb-3 flex items-center gap-2 text-[#f97316]">
              <ShieldAlert size={18} />
              <span className="tactical-label text-[#f97316]">Execucao</span>
            </div>
            <p className="text-sm font-bold text-[#f8fafc]">{lastRun || "Aguardando primeira validacao"}</p>
            <p className="mt-2 text-xs text-[#94a3b8]">Pagina livre de login para teste interno local.</p>
          </div>
        </section>

        <section className="stg-hud-panel-glow overflow-hidden p-0">
          <div className="border-b border-[#7c3aed]/25 p-5">
            <h2 className="text-lg font-black uppercase text-[#f8fafc]">Endpoints em teste</h2>
          </div>
          <div className="divide-y divide-[#7c3aed]/20">
            {(results.length > 0 ? results : checks.map((check) => ({
              label: check.label,
              endpoint: check.endpoint,
              ok: false,
              detail: "Aguardando validacao",
            }))).map((result) => (
              <div key={result.endpoint} className="grid gap-3 p-5 md:grid-cols-[220px_1fr_220px] md:items-center">
                <div className="flex items-center gap-3">
                  {result.ok ? (
                    <CheckCircle2 className="text-[#84cc16]" size={20} />
                  ) : (
                    <XCircle className="text-[#ef4444]" size={20} />
                  )}
                  <span className="font-black uppercase text-[#f8fafc]">{result.label}</span>
                </div>
                <code className="break-all rounded-md border border-[#1e293b] bg-[#0f172a] px-3 py-2 text-xs text-[#94a3b8]">
                  {buildApiUrl(result.endpoint)}
                </code>
                <p className={result.ok ? "text-sm font-bold text-[#84cc16]" : "text-sm font-bold text-[#ef4444]"}>
                  {result.detail}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
