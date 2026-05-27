import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Clock, Crosshair, Save, ShieldAlert } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { useAuth } from "../context/AuthContext";
import { usePolling } from "../hooks/usePolling";
import { getPunishments } from "../services/api";
import { getModerationConfig, updateModerationConfig } from "../services/moderationService";
import { hasAdminAccess } from "../utils/permissions";
import { ModerationConfig, Punishment } from "../types/api";

const inputClass =
  "w-full rounded-lg border-2 border-[#2d3748] bg-[#0f172a] px-3 py-2 text-sm text-white placeholder-[#64748b] focus:border-[#a855f7] focus:outline-none";

export function Moderation() {
  const { user } = useAuth();
  const isAdmin = hasAdminAccess(user);
  const [punishments, setPunishments] = useState<Punishment[]>([]);
  const [filteredPunishments, setFilteredPunishments] = useState<Punishment[]>([]);
  const [config, setConfig] = useState<ModerationConfig | null>(null);
  const [configText, setConfigText] = useState("{}");
  const [status, setStatus] = useState<string>("todos");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [punishmentData, configData] = await Promise.all([
        getPunishments(100),
        isAdmin ? getModerationConfig() : Promise.resolve(null),
      ]);
      setPunishments(punishmentData);
      setFilteredPunishments(punishmentData);
      setConfig(configData);
      if (configData) setConfigText(JSON.stringify(configData, null, 2));
    } catch (error) {
      console.error("Error loading moderation data:", error);
      setPunishments([]);
      setFilteredPunishments([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  usePolling(loadData, 20000);

  const normalizeStatus = (value: string) => {
    const map: Record<string, string> = {
      active: "ativo",
      expired: "expirado",
      revoked: "removido",
    };
    return map[value] || value;
  };

  useEffect(() => {
    if (status === "todos") {
      setFilteredPunishments(punishments);
    } else {
      setFilteredPunishments(punishments.filter((p) => normalizeStatus(p.status) === status));
    }
  }, [status, punishments]);

  const getStatusBadge = (statusValue: string) => {
    const normalized = normalizeStatus(statusValue);
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      ativo: { bg: "bg-[#ef4444]/10", text: "text-[#ef4444]", icon: "!" },
      expirado: { bg: "bg-[#64748b]/10", text: "text-[#64748b]", icon: "o" },
      removido: { bg: "bg-[#22c55e]/10", text: "text-[#22c55e]", icon: "ok" },
    };
    return colors[normalized] || colors.expirado;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      mute: { bg: "bg-[#f97316]/10", text: "text-[#f97316]", icon: "mute" },
      warn: { bg: "bg-[#f97316]/10", text: "text-[#f97316]", icon: "warn" },
      kick: { bg: "bg-[#ef4444]/10", text: "text-[#ef4444]", icon: "kick" },
      ban: { bg: "bg-[#ef4444]/10", text: "text-[#ef4444]", icon: "ban" },
      timeout: { bg: "bg-[#a855f7]/10", text: "text-[#a855f7]", icon: "time" },
    };
    return colors[type] || colors.warn;
  };

  async function saveConfig() {
    if (!isAdmin) {
      setNotice("Voce nao possui permissao administrativa.");
      return;
    }

    setSaving(true);
    setNotice("");
    try {
      const parsed = JSON.parse(configText) as ModerationConfig;
      const saved = await updateModerationConfig(parsed, user);
      setConfig(saved);
      setConfigText(JSON.stringify(saved, null, 2));
      setNotice("Dados atualizados com sucesso.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Erro ao salvar alteracoes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="cod-military-bg rounded-lg border-2 border-[#a855f7]/50 p-6">
          <div className="mb-2 flex items-center gap-3">
            <Crosshair className="text-[#ef4444]" size={28} />
            <h1 className="cod-header-highlight">CENTRO DE DISCIPLINA</h1>
          </div>
          <p className="ml-11 text-sm text-[#94a3b8]">Punicoes publicas e configuracao real de moderacao via API.</p>
        </div>

        {notice && (
          <div className="rounded-lg border border-[#a855f7]/30 bg-[#a855f7]/10 p-3 text-sm font-bold text-[#f8fafc]">
            {notice}
          </div>
        )}

        <div className="cod-mission-panel active">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="text-[#f97316]" size={20} />
            <h2 className="font-black uppercase text-white">Configuracoes de Moderacao</h2>
          </div>
          {!isAdmin && (
            <p className="mb-3 text-sm text-[#f97316]">Apenas administradores podem executar esta acao.</p>
          )}
          {!config && isAdmin && (
            <p className="mb-3 text-sm text-[#94a3b8]">
              Dados indisponiveis no momento. Confirme se a API expoe /admin/moderation/config.
            </p>
          )}
          <textarea
            className={`${inputClass} min-h-56 font-mono`}
            value={configText}
            disabled={!isAdmin}
            onChange={(e) => setConfigText(e.target.value)}
          />
          <button
            disabled={!isAdmin || saving}
            onClick={saveConfig}
            className="stg-button-primary mt-4 flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Salvando..." : "Salvar configuracoes"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { label: "TODOS", value: "todos", color: "from-[#a855f7] to-[#7c3aed]" },
            { label: `ATIVOS (${punishments.filter((p) => normalizeStatus(p.status) === "ativo").length})`, value: "ativo", color: "from-[#ef4444] to-[#c41e3a]" },
            { label: "EXPIRADOS", value: "expirado", color: "from-[#64748b] to-[#475569]" },
            { label: "REMOVIDOS", value: "removido", color: "from-[#22c55e] to-[#16a34a]" },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setStatus(btn.value)}
              className={`rounded-lg px-3 py-2 text-xs font-black uppercase transition-all ${
                status === btn.value
                  ? `bg-gradient-to-r ${btn.color} text-white shadow-lg shadow-[#a855f7]/50`
                  : "border-2 border-[#2d3748] bg-[#0f172a] text-[#94a3b8] hover:border-[#a855f7]"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="cod-loading text-2xl text-[#a855f7]"></div>
          </div>
        ) : filteredPunishments.length > 0 ? (
          <div className="space-y-3">
            {filteredPunishments.map((punishment) => {
              const statusBadge = getStatusBadge(punishment.status);
              const typeBadge = getTypeBadge(punishment.type);

              return (
                <div key={punishment.punishment_id} className="cod-mission-panel hover:border-[#a855f7]">
                  <div className="flex items-start gap-4">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-black ${typeBadge.bg} ${typeBadge.text}`}>
                      {typeBadge.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-black text-white">{punishment.username || punishment.discord_username || "Desconhecido"}</h3>
                        <span className={`rounded-lg px-2 py-1 text-xs font-black ${typeBadge.bg} ${typeBadge.text}`}>
                          {punishment.type.toUpperCase()}
                        </span>
                        <span className={`rounded-lg px-2 py-1 text-xs font-black ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.icon} {normalizeStatus(punishment.status)}
                        </span>
                      </div>
                      <p className="mb-2 font-mono text-xs text-[#64748b]">ID: {punishment.discord_id?.toString() || "N/A"}</p>
                      <p className="mb-3 text-sm text-[#94a3b8]">
                        <strong>Motivo:</strong> {punishment.reason || "Nao especificado"}
                      </p>
                      <div className="flex items-center gap-4 font-mono text-[10px] text-[#64748b]">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {punishment.created_at ? new Date(punishment.created_at).toLocaleDateString("pt-BR") : "N/A"}
                        </div>
                        {punishment.expires_at && (
                          <div className="flex items-center gap-1">
                            <AlertTriangle size={12} />
                            Expira: {new Date(punishment.expires_at).toLocaleDateString("pt-BR")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="cod-mission-panel flex h-48 items-center justify-center text-center">
            <div>
              <AlertTriangle className="mx-auto mb-3 text-[#94a3b8]" size={40} />
              <p className="font-mono text-[#94a3b8]">Nenhuma punicao encontrada</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
