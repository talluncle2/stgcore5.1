import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ExternalLink, Link2, Plus, RefreshCw } from "lucide-react";
import {
  ContentCreator,
  ContentCreatorPayload,
  CreatorChannelPayload,
} from "../../types/api";
import {
  adminAddCreatorChannel,
  adminCheckCreatorContent,
  adminCreateCreator,
  adminDisableCreator,
  adminGetCreators,
  adminUpdateCreator,
  resolveCreatorProfileLink,
} from "../../services/creatorsService";
import { ContentEditorModal } from "./ContentEditorModal";
import { SettingsActionMenu } from "../settings/SettingsActionMenu";
import { SettingsStatusBadge } from "../settings/SettingsStatusBadge";
import { CreatorPlatformBadge } from "../creators/CreatorPlatformBadge";

const emptyCreator: ContentCreatorPayload = {
  discord_id: "",
  display_name: "",
  username: "",
  avatar_url: "",
  bio: "",
  is_active: true,
  is_featured: false,
  sort_order: 0,
};

const emptyChannel: CreatorChannelPayload = {
  channel_url: "",
  is_active: true,
};

export function AdminCreators() {
  const [creators, setCreators] = useState<ContentCreator[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ContentCreator | null>(null);
  const [form, setForm] = useState<ContentCreatorPayload>(emptyCreator);
  const [channelCreator, setChannelCreator] = useState<ContentCreator | null>(null);
  const [channelForm, setChannelForm] = useState<CreatorChannelPayload>(emptyChannel);

  async function load() {
    setLoading(true);
    try {
      const data = await adminGetCreators();
      setCreators(data.creators);
      setCanManage(data.can_manage);
      setNotice(null);
    } catch (error) {
      setCreators([]);
      setCanManage(false);
      setNotice(error instanceof Error ? error.message : "Nao foi possivel acessar o Supabase.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const featuredCount = useMemo(
    () => creators.filter((creator) => creator.is_featured && creator.is_active).length,
    [creators]
  );

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyCreator });
    setEditorOpen(true);
  }

  function openEdit(creator: ContentCreator) {
    setEditing(creator);
    setForm(creator);
    setEditorOpen(true);
  }

  async function saveCreator() {
    if (!form.display_name?.trim() || (!editing && !form.discord_id)) return;
    setSaving(true);
    try {
      if (editing) await adminUpdateCreator(editing.id, form);
      else await adminCreateCreator(form);
      setEditorOpen(false);
      setEditing(null);
      setForm({ ...emptyCreator });
      setNotice("Criador salvo diretamente no Supabase.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao salvar criador.");
    } finally {
      setSaving(false);
    }
  }

  async function saveChannel() {
    if (!channelCreator || !channelForm.channel_url) return;
    setSaving(true);
    try {
      const resolved = resolveCreatorProfileLink(channelForm.channel_url);
      await adminAddCreatorChannel(channelCreator.id, channelForm);
      setChannelCreator(null);
      setChannelForm({ ...emptyChannel });
      setNotice(`${resolved.channelName} vinculado como perfil ${resolved.platform}.`);
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao vincular perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function validateLinks() {
    setSaving(true);
    try {
      const result = await adminCheckCreatorContent();
      setNotice(
        `${String(result.linked || 0)} links validados; ${String(result.failed || 0)} falhas.`
      );
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao validar links.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="stg-hud-panel p-5">
          <SettingsStatusBadge tone="purple">Total</SettingsStatusBadge>
          <p className="mt-3 text-3xl font-black text-white">{creators.length}</p>
        </div>
        <div className="stg-hud-panel p-5">
          <SettingsStatusBadge tone="green">Destaques</SettingsStatusBadge>
          <p className="mt-3 text-3xl font-black text-white">{featuredCount}</p>
        </div>
        <div className="stg-hud-panel p-5">
          <SettingsStatusBadge tone={canManage ? "green" : "orange"}>
            {canManage ? "Supabase direto" : "Somente leitura"}
          </SettingsStatusBadge>
          <p className="mt-3 text-sm text-[#94a3b8]">
            Os links sao validados no site. Nenhuma rota externa de criadores e utilizada.
          </p>
        </div>
      </div>

      <div className="stg-hud-panel-glow flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-black uppercase text-white">Perfis de criadores</h3>
          <p className="mt-1 text-sm text-[#94a3b8]">
            Cadastre o criador e vincule YouTube, Twitch, Kick ou TikTok pelo link publico.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={!canManage || saving}
            onClick={() => void validateLinks()}
            className="stg-button-secondary inline-flex items-center gap-2 px-4 py-2 text-xs disabled:opacity-50"
          >
            <RefreshCw size={15} className={saving ? "animate-spin" : ""} />
            Validar links
          </button>
          <button
            disabled={!canManage}
            onClick={openCreate}
            className="stg-button-primary inline-flex items-center gap-2 px-4 py-2 text-xs disabled:opacity-50"
          >
            <Plus size={15} />
            Novo criador
          </button>
        </div>
      </div>

      {notice && (
        <div className="border border-[#84cc16]/35 bg-[#84cc16]/10 p-3 text-sm font-bold text-[#bef264]">
          {notice}
        </div>
      )}
      {!canManage && (
        <div className="flex items-start gap-3 border border-[#f97316]/35 bg-[#f97316]/10 p-3 text-sm text-[#fed7aa]">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>Apenas administradores podem alterar criadores e links vinculados.</p>
        </div>
      )}

      {loading ? (
        <div className="stg-hud-panel p-8 text-center text-[#94a3b8]">Carregando criadores...</div>
      ) : (
        <div className="grid gap-3">
          {creators.map((creator) => (
            <article
              key={creator.id}
              className="stg-hud-panel flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={
                    creator.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      creator.display_name || "STG"
                    )}&background=a855f7&color=fff`
                  }
                  alt={creator.display_name || "Criador"}
                  className="size-14 rounded-full border border-[#a855f7]/40 object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-black uppercase text-white">
                    {creator.display_name || creator.username || creator.discord_id}
                  </p>
                  <p className="truncate font-mono text-xs text-[#94a3b8]">
                    Discord {creator.discord_id}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {creator.is_featured && (
                      <SettingsStatusBadge tone="green">Destaque</SettingsStatusBadge>
                    )}
                    <SettingsStatusBadge tone={creator.is_active ? "purple" : "red"}>
                      {creator.is_active ? "Ativo" : "Inativo"}
                    </SettingsStatusBadge>
                    {creator.channels
                      .filter((channel) => channel.is_active)
                      .map((channel) => (
                        <CreatorPlatformBadge key={channel.id} platform={channel.platform} />
                      ))}
                  </div>
                  {creator.channels[0]?.channel_url && (
                    <a
                      href={creator.channels[0].channel_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-xs font-bold uppercase text-[#c084fc] hover:text-white"
                    >
                      Abrir perfil <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>
              <SettingsActionMenu
                actions={[
                  { label: "Editar", onClick: () => openEdit(creator) },
                  {
                    label: "Vincular perfil",
                    onClick: () => {
                      setChannelCreator(creator);
                      setChannelForm({ ...emptyChannel });
                    },
                  },
                  {
                    label: "Desativar",
                    onClick: async () => {
                      await adminDisableCreator(creator.id);
                      await load();
                    },
                    danger: true,
                  },
                ].map((action) => ({
                  ...action,
                  onClick: canManage
                    ? action.onClick
                    : () => setNotice("Apenas admin real pode gerenciar criadores."),
                }))}
              />
            </article>
          ))}
          {creators.length === 0 && (
            <div className="stg-hud-panel p-6 text-[#94a3b8]">
              Nenhum criador cadastrado no Supabase.
            </div>
          )}
        </div>
      )}

      <ContentEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={editing ? "Editar criador" : "Novo criador"}
        description="O Discord ID preserva a identidade do membro; os canais sao vinculados separadamente por URL."
        onSave={saveCreator}
        isSaving={saving}
      >
        {!editing && (
          <input
            value={String(form.discord_id || "")}
            onChange={(event) => setForm({ ...form, discord_id: event.target.value })}
            placeholder="Discord ID"
            className="stg-admin-input w-full"
          />
        )}
        <input
          value={form.display_name || ""}
          onChange={(event) => setForm({ ...form, display_name: event.target.value })}
          placeholder="Nome publico"
          className="stg-admin-input w-full"
        />
        <textarea
          value={form.bio || ""}
          onChange={(event) => setForm({ ...form, bio: event.target.value })}
          placeholder="Bio"
          className="stg-admin-input min-h-24 w-full"
        />
        <input
          value={form.avatar_url || ""}
          onChange={(event) => setForm({ ...form, avatar_url: event.target.value })}
          placeholder="Avatar URL opcional"
          className="stg-admin-input w-full"
        />
        <label className="flex items-center gap-2 text-sm text-white">
          <input
            type="checkbox"
            checked={Boolean(form.is_featured)}
            onChange={(event) => setForm({ ...form, is_featured: event.target.checked })}
          />
          Destaque
        </label>
        <label className="flex items-center gap-2 text-sm text-white">
          <input
            type="checkbox"
            checked={form.is_active !== false}
            onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
          />
          Ativo
        </label>
      </ContentEditorModal>

      <ContentEditorModal
        open={Boolean(channelCreator)}
        onOpenChange={(open) => !open && setChannelCreator(null)}
        title="Vincular perfil"
        description="A plataforma e o identificador sao detectados automaticamente pelo link."
        onSave={saveChannel}
        isSaving={saving}
      >
        <div className="flex items-center gap-3 border border-[#a855f7]/25 bg-[#a855f7]/10 p-3 text-sm text-[#e9d5ff]">
          <Link2 size={18} />
          YouTube, Twitch, Kick ou TikTok
        </div>
        <input
          value={channelForm.channel_url || ""}
          onChange={(event) =>
            setChannelForm({ channel_url: event.target.value, is_active: true })
          }
          placeholder="https://youtube.com/@seucanal"
          className="stg-admin-input w-full"
        />
        <p className="text-xs text-[#94a3b8]">
          Avatar, metricas e estado ao vivo exigem APIs oficiais das plataformas e nao sao
          simulados pelo navegador.
        </p>
      </ContentEditorModal>
    </div>
  );
}
