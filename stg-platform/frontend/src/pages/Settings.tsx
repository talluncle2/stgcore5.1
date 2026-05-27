import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Database,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Layout } from "../components/layout/Layout";
import {
  API_BASE_URL,
  buildApiUrl,
  getHealth,
  getOverview,
  getProducts,
  getRanking,
  getTournaments,
} from "../services/api";

type DiagnosticStatus = "idle" | "loading" | "online" | "offline";

interface DiagnosticResult {
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
      return { ok: true, detail: `${data.length} registros carregados` };
    },
  },
  {
    label: "Loja",
    endpoint: "/public/products?limit=5",
    run: async () => {
      const data = await getProducts(undefined, 5);
      return { ok: true, detail: `${data.length} produtos carregados` };
    },
  },
  {
    label: "Torneios",
    endpoint: "/public/tournaments?limit=5",
    run: async () => {
      const data = await getTournaments(undefined, 5);
      return { ok: true, detail: `${data.length} torneios carregados` };
    },
  },
];

export function Settings() {
  const [apiStatus, setApiStatus] = useState<"online" | "offline">("offline");
  const [status, setStatus] = useState<DiagnosticStatus>("idle");
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const connectionMode = useMemo(() => API_BASE_URL, []);

  const runChecks = useCallback(async () => {
    setStatus("loading");

    const settled = await Promise.all(
      checks.map(async (check): Promise<DiagnosticResult> => {
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

    const healthResult = settled.find((result) => result.endpoint === "/health");
    setApiStatus(healthResult?.ok ? "online" : "offline");
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
    <Layout>
      <div className="max-w-6xl space-y-6">
        <div className="cod-military-bg rounded-lg border-2 border-[#a855f7]/50 p-6">
          <div className="mb-2 flex items-center gap-3">
            <Shield className="text-[#a855f7]" size={28} />
            <h1 className="cod-header-highlight">CENTRO DE CONTROLE</h1>
          </div>
          <p className="ml-11 text-sm text-[#94a3b8]">
            Configuracoes, diagnostico e informacoes tecnicas protegidas por login admin.
          </p>
        </div>

        <section className="stg-hud-panel-glow flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="tactical-edge flex size-12 shrink-0 items-center justify-center border border-[#38bdf8]/50 bg-[#38bdf8]/10 text-[#38bdf8]">
              <Server size={24} />
            </div>
            <div>
              <p className="tactical-label mb-2">Diagnostico interno</p>
              <h2 className="text-2xl font-black uppercase text-[#f8fafc] md:text-3xl">
                Teste de conexao API
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[#94a3b8]">
                Validacao rapida da API STG Core e endpoints publicos. Esta area nao expõe secrets e e restrita a admin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void runChecks()}
            disabled={status === "loading"}
            className="stg-button-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={status === "loading" ? "animate-spin" : ""} />
            Revalidar
          </button>
        </section>

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
            <p className="mt-2 text-xs text-[#94a3b8]">Configurada por VITE_API_BASE_URL no deploy.</p>
          </div>

          <div className="stg-hud-panel p-5">
            <div className="mb-3 flex items-center gap-2 text-[#f97316]">
              <ShieldAlert size={18} />
              <span className="tactical-label text-[#f97316]">Execucao</span>
            </div>
            <p className="text-sm font-bold text-[#f8fafc]">{lastRun || "Aguardando primeira validacao"}</p>
            <p className="mt-2 text-xs text-[#94a3b8]">Somente usuarios admin podem acessar esta tela.</p>
          </div>
        </section>

        <section className="stg-hud-panel-glow overflow-hidden p-0">
          <div className="border-b border-[#7c3aed]/25 p-5">
            <h2 className="text-lg font-black uppercase text-[#f8fafc]">Endpoints em teste</h2>
          </div>
          <div className="divide-y divide-[#7c3aed]/20">
            {(results.length > 0
              ? results
              : checks.map((check) => ({
                  label: check.label,
                  endpoint: check.endpoint,
                  ok: false,
                  detail: "Aguardando validacao",
                }))
            ).map((result) => (
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

        <section className="cod-mission-panel">
          <div className="cod-text-military mb-4 text-sm text-[#38bdf8]">GESTAO DE CONTEUDO</div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Noticias", "/admin/noticias"],
              ["Loja", "/admin/loja"],
              ["Torneios", "/admin/torneios"],
            ].map(([label, to]) => (
              <Link key={to} to={to} className="border border-[#a855f7]/25 bg-[#111827]/80 px-4 py-3 text-center text-sm font-black uppercase text-[#c084fc] transition-colors hover:border-[#a855f7]/60 hover:bg-[#a855f7]/15">
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="cod-mission-panel">
          <div className="cod-text-military mb-4 text-sm text-[#f97316]">INFORMACOES DO SISTEMA</div>
          <div className="cod-stats-grid">
            <div className="cod-stat-box">
              <div className="cod-stat-box-label">APP</div>
              <div className="font-mono text-xs text-white">STG</div>
            </div>
            <div className="cod-stat-box">
              <div className="cod-stat-box-label">VERSION</div>
              <div className="font-mono text-xs text-white">1.0.0</div>
            </div>
            <div className="cod-stat-box">
              <div className="cod-stat-box-label">FRAMEWORK</div>
              <div className="font-mono text-xs text-white">REACT+VITE</div>
            </div>
            <div className="cod-stat-box">
              <div className="cod-stat-box-label">STATUS</div>
              <div className={`text-xs font-black ${apiStatus === "online" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                {apiStatus === "online" ? "ONLINE" : "OFFLINE"}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 border border-[#f97316]/25 bg-[#f97316]/10 p-3 text-xs text-[#fed7aa]">
            <AlertCircle className="mt-0.5 shrink-0" size={16} />
            <p>
              Secrets de bot, autenticacao, banco e integracoes Discord nao sao exibidos nem editados pelo frontend.
            </p>
          </div>
        </section>
      </div>
    </Layout>
  );
}
