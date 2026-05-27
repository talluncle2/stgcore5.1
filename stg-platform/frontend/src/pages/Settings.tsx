import { useEffect, useState } from "react";
import { Layout } from "../components/layout/Layout";
import { getHealth, API_BASE_URL } from "../services/api";
import { Shield, AlertCircle, RefreshCw } from "lucide-react";

export function Settings() {
  const [apiStatus, setApiStatus] = useState<"online" | "offline">("offline");
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const checkHealth = async () => {
    setTesting(true);
    try {
      const result = await getHealth();
      setApiStatus(result.status);
    } catch {
      setApiStatus("offline");
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    checkHealth();
    setLoading(false);
  }, []);

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="cod-military-bg p-6 rounded-lg border-2 border-[#a855f7]/50">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-[#a855f7]" size={28} />
            <h1 className="cod-header-highlight">CENTRO DE CONTROLE</h1>
          </div>
          <p className="text-[#94a3b8] text-sm ml-11">Configurações e diagnóstico do sistema</p>
        </div>

        {/* API Connection */}
        <div className="cod-mission-panel active">
          <div className="cod-text-military text-sm text-[#22c55e] mb-4">🔌 CONEXÃO DA API</div>

          <div className="space-y-4">
            {/* URL */}
            <div>
              <label className="block text-[#94a3b8] text-xs font-black uppercase mb-2">
                URL Base
              </label>
              <div className="cod-combat-stat cod-combat-stat-blue">
                <code className="text-white text-xs font-mono">{API_BASE_URL}</code>
              </div>
              <p className="text-[#64748b] text-xs mt-2 font-mono">VITE_API_BASE_URL</p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[#94a3b8] text-xs font-black uppercase mb-2">
                Status
              </label>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 ${
                apiStatus === "online"
                  ? "bg-[#22c55e]/10 border-[#22c55e]/30 cod-pulse"
                  : "bg-[#ef4444]/10 border-[#ef4444]/30"
              }`}>
                {apiStatus === "online" ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></div>
                    <span className="text-[#22c55e] font-black text-sm uppercase">OPERACIONAL</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="text-[#ef4444]" size={18} />
                    <span className="text-[#ef4444] font-black text-sm uppercase">DESCONECTADO</span>
                  </>
                )}
              </div>
            </div>

            {/* Test Button */}
            <button
              onClick={checkHealth}
              disabled={testing || loading}
              className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#a855f7] to-[#7c3aed] text-white font-black disabled:opacity-50 flex items-center justify-center gap-2 transition-all text-sm uppercase hover:shadow-lg hover:shadow-[#a855f7]/50"
            >
              <RefreshCw size={16} className={testing ? "animate-spin" : ""} />
              {testing ? "TESTANDO..." : "TESTAR"}
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="cod-mission-panel">
          <div className="cod-text-military text-sm text-[#f97316] mb-4">📊 INFORMAÇÕES DO SISTEMA</div>

          <div className="cod-stats-grid">
            <div className="cod-stat-box">
              <div className="cod-stat-box-label">APP</div>
              <div className="text-xs text-white font-mono">STG</div>
            </div>

            <div className="cod-stat-box">
              <div className="cod-stat-box-label">VERSION</div>
              <div className="text-xs text-white font-mono">1.0.0</div>
            </div>

            <div className="cod-stat-box">
              <div className="cod-stat-box-label">FRAMEWORK</div>
              <div className="text-xs text-white font-mono">REACT+VITE</div>
            </div>

            <div className="cod-stat-box">
              <div className="cod-stat-box-label">STATUS</div>
              <div className={`text-xs font-black ${apiStatus === "online" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                {apiStatus === "online" ? "ONLINE" : "OFFLINE"}
              </div>
            </div>
          </div>

          <div className="cod-crosshair my-4"></div>

          <div className="text-xs text-[#94a3b8] space-y-2 font-mono">
            <p>🏢 PROJETO: Supremo Tribunal Gamer</p>
            <p>📅 DATA: {new Date().toLocaleDateString("pt-BR")}</p>
            <p>⏰ HORA: {new Date().toLocaleTimeString("pt-BR")}</p>
          </div>
        </div>

        {/* Environment */}
        <div className="cod-mission-panel">
          <div className="cod-text-military text-sm text-[#38bdf8] mb-4">⚙️ VARIÁVEIS DE AMBIENTE</div>

          <div className="bg-[#0f172a]/50 rounded-lg p-4 font-mono text-[10px] text-[#94a3b8] space-y-1 max-h-48 overflow-y-auto border border-[#2d3748]">
            <div className="flex justify-between">
              <span className="text-[#a855f7]">VITE_API_BASE_URL</span>
              <span className="text-[#22c55e]">✓</span>
            </div>
            <div className="flex justify-between opacity-50">
              <span>Additional vars</span>
              <span>Configured</span>
            </div>
          </div>

          <p className="text-[#64748b] text-xs mt-3 font-mono">Configuradas via .env (dev) ou deploy (prod)</p>
        </div>

        {/* Documentation */}
        <div className="cod-mission-panel">
          <div className="cod-text-military text-sm text-[#38bdf8] mb-4">📖 DOCUMENTAÇÃO</div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "GUIA DO USUÁRIO", icon: "📘" },
              { label: "API DOCS", icon: "📡" },
              { label: "FAQ", icon: "❓" },
              { label: "SUPORTE", icon: "🆘" },
            ].map((item) => (
              <button
                key={item.label}
                className="px-3 py-2 rounded-lg border-2 border-[#2d3748] text-[#a855f7] font-black text-xs uppercase hover:border-[#a855f7] transition-colors"
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="cod-mission-panel failed">
          <div className="cod-text-military text-sm text-[#ef4444] mb-4">⚠️ ZONA RESTRITA</div>

          <p className="text-[#ef4444] text-xs mb-4 font-mono">
            AÇÕES AQUI PODEM TER CONSEQUÊNCIAS IRREVERSÍVEIS
          </p>

          <button className="w-full px-4 py-2 rounded-lg border-2 border-[#ef4444] text-[#ef4444] font-black hover:bg-[#ef4444]/10 transition-colors text-xs uppercase">
            🗑️ LIMPAR CACHE LOCAL
          </button>
        </div>
      </div>
    </Layout>
  );
}
