import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Radio } from "lucide-react";
import { ContentCreator, CreatorChannelPayload, ContentCreatorPayload } from "../../types/api";
import {
  adminAddCreatorChannel,
  adminCheckCreatorContent,
  adminDisableCreator,
  adminGetCreators,
  adminSyncCreatorsFromDiscord,
  adminUpdateCreator,
} from "../../services/creatorsService";
import { ContentEditorModal } from "./ContentEditorModal";
import { SettingsActionMenu } from "../settings/SettingsActionMenu";
import { SettingsStatusBadge } from "../settings/SettingsStatusBadge";

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

export function AdminCreators() {
  const [creators, setCreators] = useState<ContentCreator[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<ContentCreator | null>(null);
  const [form, setForm] = useState<ContentCreatorPayload>(emptyCreator);
  const [channelCreator, setChannelCreator] = useState<ContentCreator | null>(null);
  const [channelForm, setChannelForm] = useState<CreatorChannelPayload>({ platform: "youtube", channel_url: "", channel_id: "", handle: "", is_active: true });

  const load = async () => {
    setLoading(true);
    const data = await adminGetCreators();
    setCreators(data.creators);
    setCanManage(data.can_manage);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const featuredCount = useMemo(() => creators.filter((creator) => creator.is_featured).length, [creators]);

  async function saveCreator() {
    if (!editing) return;
    await adminUpdateCreator(editing.id, form);
    setEditing(null);
    await load();
  }

  async function saveChannel() {
    if (!channelCreator) return;
    await adminAddCreatorChannel(channelCreator.id, channelForm);
    setChannelCreator(null);
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="stg-hud-panel p-5"><SettingsStatusBadge tone="purple">Total</SettingsStatusBadge><p className="mt-3 text-3xl font-black text-white">{creators.length}</p></div>
        <div className="stg-hud-panel p-5"><SettingsStatusBadge tone="green">Destaques</SettingsStatusBadge><p className="mt-3 text-3xl font-black text-white">{featuredCount}</p></div>
        <div className="stg-hud-panel p-5"><SettingsStatusBadge tone={canManage ? "green" : "orange"}>{canManage ? "Edicao liberada" : "Somente leitura"}</SettingsStatusBadge><p className="mt-3 text-sm text-[#94a3b8]">Apenas admin real pode vincular canais.</p></div>
      </div>

      <div className="stg-hud-panel-glow flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-black uppercase text-white">Criadores detectados pelo Discord</h3>
          <p className="mt-1 text-sm text-[#94a3b8]">Sincronize membros com is_content_creator e vincule canais por plataforma.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={!canManage} onClick={async () => { const result = await adminSyncCreatorsFromDiscord(); setNotice(`Sincronizados: ${result.synced}`); await load(); }} className="stg-button-secondary inline-flex items-center gap-2 px-4 py-2 text-xs disabled:opacity-50">
            <RefreshCw size={15} /> Sincronizar Discord
          </button>
          <button disabled={!canManage} onClick={async () => { const result = await adminCheckCreatorContent(); setNotice(`Verificacao executada: ${JSON.stringify(result)}`); }} className="stg-button-primary inline-flex items-center gap-2 px-4 py-2 text-xs disabled:opacity-50">
            <Radio size={15} /> Verificar agora
          </button>
        </div>
      </div>

      {notice && <div className="border border-[#84cc16]/35 bg-[#84cc16]/10 p-3 text-sm font-bold text-[#bef264]">{notice}</div>}

      {loading ? (
        <div className="stg-hud-panel p-8 text-center text-[#94a3b8]">Carregando criadores...</div>
      ) : (
        <div className="grid gap-3">
          {creators.map((creator) => (
            <article key={creator.id} className="stg-hud-panel flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <img src={creator.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.display_name || "STG")}&background=a855f7&color=fff`} alt={creator.display_name || "Criador"} className="size-14 rounded-full border border-[#a855f7]/40 object-cover" />
                <div className="min-w-0">
                  <p className="truncate font-black uppercase text-white">{creator.display_name || creator.username || creator.discord_id}</p>
                  <p className="truncate font-mono text-xs text-[#94a3b8]">{creator.discord_id}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {creator.is_featured && <SettingsStatusBadge tone="green">Destaque</SettingsStatusBadge>}
                    <SettingsStatusBadge tone={creator.is_active ? "purple" : "red"}>{creator.is_active ? "Ativo" : "Inativo"}</SettingsStatusBadge>
                    {creator.channels.map((channel) => <SettingsStatusBadge key={channel.id} tone="blue">{channel.platform}</SettingsStatusBadge>)}
                  </div>
                </div>
              </div>
              <SettingsActionMenu
                actions={[
                  { label: "Editar", onClick: () => { setEditing(creator); setForm(creator); } },
                  { label: "Adicionar canal", onClick: () => setChannelCreator(creator) },
                  { label: "Desativar", onClick: async () => { await adminDisableCreator(creator.id); await load(); }, danger: true },
                ].map((action) => ({ ...action, onClick: canManage ? action.onClick : () => setNotice("Apenas admin real pode gerenciar criadores.") }))}
              />
            </article>
          ))}
          {creators.length === 0 && <div className="stg-hud-panel p-6 text-[#94a3b8]">Nenhum criador sincronizado. Use "Sincronizar Discord" quando a API estiver com CONTENT_CREATOR_ROLE_IDS configurado.</div>}
        </div>
      )}

      <ContentEditorModal open={Boolean(editing)} onOpenChange={() => setEditing(null)} title="Editar criador" onSave={saveCreator}>
        <input value={form.display_name || ""} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Nome publico" className="w-full border border-[#a855f7]/25 bg-[#111827] px-3 py-2 text-white" />
        <textarea value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Bio" className="min-h-24 w-full border border-[#a855f7]/25 bg-[#111827] px-3 py-2 text-white" />
        <input value={form.avatar_url || ""} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="Avatar URL" className="w-full border border-[#a855f7]/25 bg-[#111827] px-3 py-2 text-white" />
        <label className="flex items-center gap-2 text-sm text-white"><input type="checkbox" checked={Boolean(form.is_featured)} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Destaque</label>
        <label className="flex items-center gap-2 text-sm text-white"><input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Ativo</label>
      </ContentEditorModal>

      <ContentEditorModal open={Boolean(channelCreator)} onOpenChange={() => setChannelCreator(null)} title="Adicionar canal" onSave={saveChannel}>
        <select value={channelForm.platform} onChange={(e) => setChannelForm({ ...channelForm, platform: e.target.value as CreatorChannelPayload["platform"] })} className="w-full border border-[#a855f7]/25 bg-[#111827] px-3 py-2 text-white">
          <option value="youtube">YouTube</option>
          <option value="twitch">Twitch</option>
          <option value="kick">Kick</option>
          <option value="tiktok">TikTok</option>
        </select>
        <input value={channelForm.channel_url || ""} onChange={(e) => setChannelForm({ ...channelForm, channel_url: e.target.value })} placeholder="URL do canal" className="w-full border border-[#a855f7]/25 bg-[#111827] px-3 py-2 text-white" />
        <input value={channelForm.channel_id || ""} onChange={(e) => setChannelForm({ ...channelForm, channel_id: e.target.value })} placeholder="ID do canal" className="w-full border border-[#a855f7]/25 bg-[#111827] px-3 py-2 text-white" />
        <input value={channelForm.handle || ""} onChange={(e) => setChannelForm({ ...channelForm, handle: e.target.value })} placeholder="Handle/login" className="w-full border border-[#a855f7]/25 bg-[#111827] px-3 py-2 text-white" />
        <p className="text-xs text-[#94a3b8]">Kick e TikTok ficam como integracao aguardando backend ate haver API estavel.</p>
      </ContentEditorModal>
    </div>
  );
}
