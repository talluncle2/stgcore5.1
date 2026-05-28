import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AtSign, ExternalLink, EyeOff, Link as LinkIcon, Lock, Plus, RefreshCw, Save, Trash2, User as UserIcon, Video } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { CreatorPlatformBadge } from "../components/creators/CreatorPlatformBadge";
import { useAuth } from "../context/AuthContext";
import {
  addMyCreatorChannel,
  disableMyCreatorChannel,
  getMyCreatorProfile,
  registerMyCreatorProfile,
  updateMyCreatorChannel,
} from "../services/creatorsService";
import { getMyPublicProfile, updateMyPublicProfile } from "../services/profileService";
import { AuthUser, ContentCreator, CreatorChannel, CreatorChannelPayload, CreatorPlatform, PublicProfilePayload } from "../types/api";
import { hasAdminAccess, hasCreatorAccess } from "../utils/permissions";

type ProfileTab = "resumo" | "publico" | "criador" | "privacidade";

const platforms: CreatorPlatform[] = ["youtube", "twitch", "kick", "tiktok", "instagram", "x"];

const emptyProfile: PublicProfilePayload = {
  public_name: "",
  public_avatar_url: "",
  public_banner_url: "",
  bio: "",
  public_email: "",
  location_optional: "",
  pronouns: "",
  sexual_orientation: "",
  sexual_orientation_visibility: "private",
  profile_visibility: "public",
};

const emptyChannel: CreatorChannelPayload = {
  platform: "youtube",
  channel_url: "",
  is_active: true,
};

function createLocalCreatorProfile(user: AuthUser, channel?: CreatorChannel): ContentCreator {
  return {
    id: channel?.creator_id || String(user.discord_id || user.id || "me"),
    discord_id: String(user.discord_id || ""),
    display_name: user.display_name || user.global_name || user.username || user.discord_username,
    username: user.username || user.discord_username,
    avatar_url: user.avatar_url || user.discord_avatar_url,
    is_active: true,
    is_featured: false,
    sort_order: 0,
    channels: channel ? [channel] : [],
    latest_content: [],
    latest_contents: [],
  };
}

function getChannelLabel(channel: CreatorChannel): string {
  if (channel.channel_name) return channel.channel_name;
  if (channel.handle) return channel.handle;
  if (!channel.channel_url) return "Canal cadastrado";
  try {
    const url = new URL(channel.channel_url);
    const cleanPath = url.pathname.replace(/^\/+|\/+$/g, "");
    return cleanPath || url.hostname.replace(/^www\./, "");
  } catch {
    return channel.channel_url;
  }
}

export function Profile() {
  const { user, profile, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") as ProfileTab | null;
  const [activeTab, setActiveTabState] = useState<ProfileTab>(requestedTab || "resumo");
  const [publicForm, setPublicForm] = useState<PublicProfilePayload>(emptyProfile);
  const [creatorProfile, setCreatorProfile] = useState<ContentCreator | null>(null);
  const [channelForm, setChannelForm] = useState<CreatorChannelPayload>(emptyChannel);
  const [editingChannel, setEditingChannel] = useState<CreatorChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const identity = user ?? profile;
  const canManageCreator = hasCreatorAccess(identity);
  const isAdmin = hasAdminAccess(identity);
  const username = profile?.username || user?.display_name || user?.username || user?.discord_username || "Operador";
  const avatarUrl = publicForm.public_avatar_url || profile?.avatar_url || user?.avatar_url || user?.discord_avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=a855f7&color=fff`;
  const visibleCreatorProfile = user ? (creatorProfile || createLocalCreatorProfile(user)) : null;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [publicProfile, creator] = await Promise.all([
        getMyPublicProfile(),
        canManageCreator ? getMyCreatorProfile() : Promise.resolve(null),
      ]);
      const registeredCreator = !creator && canManageCreator ? await registerMyCreatorProfile() : null;
      setPublicForm({
        ...emptyProfile,
        public_name: publicProfile?.public_name || user?.public_name || username,
        public_avatar_url: publicProfile?.public_avatar_url || user?.public_avatar_url || "",
        public_banner_url: publicProfile?.public_banner_url || user?.public_banner_url || "",
        bio: publicProfile?.bio || user?.bio || "",
        public_email: publicProfile?.public_email || user?.public_email || "",
        location_optional: publicProfile?.location_optional || user?.location_optional || "",
        pronouns: publicProfile?.pronouns || user?.pronouns || "",
        sexual_orientation: publicProfile?.sexual_orientation || user?.sexual_orientation || "",
        sexual_orientation_visibility: publicProfile?.sexual_orientation_visibility || user?.sexual_orientation_visibility || "private",
        profile_visibility: publicProfile?.profile_visibility || user?.profile_visibility || "public",
      });
      setCreatorProfile(creator || registeredCreator?.creator || null);
      setLoading(false);
    }
    void load();
  }, [canManageCreator, user, username]);

  const tabs = useMemo(
    () => [
      { id: "resumo" as const, label: "Resumo", icon: UserIcon },
      { id: "publico" as const, label: "Perfil Publico", icon: AtSign },
      ...(canManageCreator ? [{ id: "criador" as const, label: "Contas de Criador", icon: Video }] : []),
      { id: "privacidade" as const, label: "Privacidade", icon: Lock },
    ],
    [canManageCreator]
  );

  const setActiveTab = (tab: ProfileTab) => {
    setActiveTabState(tab);
    setSearchParams(tab === "resumo" ? {} : { tab });
  };

  if (!user || !profile) {
    return (
      <Layout>
        <div className="stg-hud-panel p-8 text-center text-[#94a3b8]">Carregando perfil do operador...</div>
      </Layout>
    );
  }

  async function savePublicProfile(event?: FormEvent) {
    event?.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateMyPublicProfile(publicForm);
      await refreshUser();
      setNotice("Perfil publico salvo com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel salvar o perfil publico.");
    } finally {
      setSaving(false);
    }
  }

  async function saveChannel(event: FormEvent) {
    event.preventDefault();
    const currentUser = user;
    if (!currentUser) return;
    setSaving(true);
    setError(null);
    try {
      if (editingChannel) {
        const updatedChannel = await updateMyCreatorChannel(editingChannel.id, channelForm);
        setCreatorProfile((current) => {
          const base = current || createLocalCreatorProfile(currentUser, updatedChannel);
          return {
            ...base,
            channels: base.channels.map((channel) => channel.id === updatedChannel.id ? updatedChannel : channel),
          };
        });
        setNotice("Canal atualizado.");
      } else {
        const createdChannel = await addMyCreatorChannel(channelForm);
        setCreatorProfile((current) => {
          const base = current || createLocalCreatorProfile(currentUser, createdChannel);
          return {
            ...base,
            channels: [...base.channels.filter((channel) => channel.id !== createdChannel.id), createdChannel],
          };
        });
        setNotice("Canal cadastrado para monitoramento.");
      }
      setChannelForm(emptyChannel);
      setEditingChannel(null);
      const refreshedCreator = await getMyCreatorProfile();
      if (refreshedCreator) {
        setCreatorProfile(refreshedCreator);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel salvar o canal.");
    } finally {
      setSaving(false);
    }
  }

  async function removeChannel(channel: CreatorChannel) {
    setSaving(true);
    setError(null);
    try {
      await disableMyCreatorChannel(channel.id);
      setNotice("Canal removido/desativado.");
      setCreatorProfile((current) => current ? {
        ...current,
        channels: current.channels.filter((item) => item.id !== channel.id),
      } : current);
      const refreshedCreator = await getMyCreatorProfile();
      if (refreshedCreator) {
        setCreatorProfile(refreshedCreator);
      }
    } catch {
      setError("Recurso aguardando integração da API para remover canais.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden border border-[#a855f7]/35 bg-[#050608]">
          <div className="h-44 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.82), rgba(46,16,101,.42)), url("${publicForm.public_banner_url || "/assets/tactical-ops-bg.png"}")` }} />
          <div className="-mt-14 flex flex-col gap-4 p-6 md:flex-row md:items-end">
            <img src={avatarUrl} alt={username} className="size-28 rounded-full border-4 border-[#050608] object-cover shadow-xl shadow-[#a855f7]/20" />
            <div className="min-w-0 flex-1">
              <p className="tactical-label">Perfil operacional</p>
              <h1 className="mt-1 text-3xl font-black uppercase tracking-[0.08em] text-white">{publicForm.public_name || username}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="stg-badge-purple">Discord sincronizado</span>
                {user.is_content_creator && <span className="stg-badge-danger">Criador STG</span>}
                {isAdmin && <span className="stg-badge-success">Admin</span>}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 border px-4 py-2 text-xs font-black uppercase tracking-[0.08em] ${
                  activeTab === tab.id ? "border-[#a855f7]/55 bg-[#a855f7]/20 text-white" : "border-[#a855f7]/18 bg-[#111827]/70 text-[#94a3b8]"
                }`}
              >
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        {notice && <div className="border border-[#84cc16]/35 bg-[#84cc16]/10 p-3 text-sm font-bold text-[#bef264]">{notice}</div>}
        {error && <div className="border border-[#ef4444]/35 bg-[#ef4444]/10 p-3 text-sm font-bold text-[#fecaca]">{error}</div>}

        {activeTab === "resumo" && (
          <section className="grid gap-4 md:grid-cols-3">
            <div className="stg-hud-panel p-5"><p className="tactical-label">Discord ID</p><p className="mt-2 break-all font-mono text-sm text-white">{user.discord_id || profile.discord_id || "N/A"}</p></div>
            <div className="stg-hud-panel p-5"><p className="tactical-label">Rank</p><p className="mt-2 text-2xl font-black text-white">{profile.level}</p></div>
            <div className="stg-hud-panel p-5"><p className="tactical-label">Coins</p><p className="mt-2 text-2xl font-black text-white">{profile.coins}</p></div>
            <div className="stg-hud-panel md:col-span-3 p-5">
              <p className="tactical-label">Campos protegidos</p>
              <p className="mt-2 text-sm text-[#94a3b8]">Cargos, Discord ID, flags de admin/moderador/criador e role_ids vêm da API/Discord e nao podem ser alterados pelo site.</p>
            </div>
          </section>
        )}

        {(activeTab === "publico" || activeTab === "privacidade") && (
          <form onSubmit={savePublicProfile} className="stg-hud-panel grid gap-4 p-5 md:grid-cols-2">
            {activeTab === "publico" ? (
              <>
                <ProfileInput label="Nome publico" value={publicForm.public_name || ""} onChange={(value) => setPublicForm({ ...publicForm, public_name: value })} />
                <ProfileInput label="Email publico" value={publicForm.public_email || ""} onChange={(value) => setPublicForm({ ...publicForm, public_email: value })} />
                <ProfileInput label="Avatar publico URL" value={publicForm.public_avatar_url || ""} onChange={(value) => setPublicForm({ ...publicForm, public_avatar_url: value })} />
                <ProfileInput label="Banner publico URL" value={publicForm.public_banner_url || ""} onChange={(value) => setPublicForm({ ...publicForm, public_banner_url: value })} />
                <ProfileInput label="Localizacao opcional" value={publicForm.location_optional || ""} onChange={(value) => setPublicForm({ ...publicForm, location_optional: value })} />
                <ProfileInput label="Pronomes" value={publicForm.pronouns || ""} onChange={(value) => setPublicForm({ ...publicForm, pronouns: value })} />
                <label className="md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.08em] text-[#94a3b8]">Bio</span>
                  <textarea value={publicForm.bio || ""} onChange={(e) => setPublicForm({ ...publicForm, bio: e.target.value })} className="mt-2 min-h-28 w-full border border-[#a855f7]/25 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#a855f7]/60" />
                </label>
              </>
            ) : (
              <>
                <label>
                  <span className="text-xs font-black uppercase tracking-[0.08em] text-[#94a3b8]">Visibilidade do perfil</span>
                  <select value={publicForm.profile_visibility} onChange={(e) => setPublicForm({ ...publicForm, profile_visibility: e.target.value as PublicProfilePayload["profile_visibility"] })} className="mt-2 w-full border border-[#a855f7]/25 bg-black/40 px-3 py-2 text-white">
                    <option value="public">Publico</option>
                    <option value="members">Membros</option>
                    <option value="private">Privado</option>
                  </select>
                </label>
                <ProfileInput label="Orientacao sexual opcional" value={publicForm.sexual_orientation || ""} onChange={(value) => setPublicForm({ ...publicForm, sexual_orientation: value })} />
                <label>
                  <span className="text-xs font-black uppercase tracking-[0.08em] text-[#94a3b8]">Visibilidade da orientacao</span>
                  <select value={publicForm.sexual_orientation_visibility} onChange={(e) => setPublicForm({ ...publicForm, sexual_orientation_visibility: e.target.value as PublicProfilePayload["sexual_orientation_visibility"] })} className="mt-2 w-full border border-[#a855f7]/25 bg-black/40 px-3 py-2 text-white">
                    <option value="private">Privada</option>
                    <option value="public">Publica</option>
                  </select>
                </label>
                <div className="stg-hud-panel md:col-span-2 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-[#94a3b8]"><EyeOff size={16} /> Email publico so sera exibido quando a API considerar o campo publico.</p>
                </div>
              </>
            )}
            <button type="submit" disabled={saving || loading} className="stg-button-primary md:col-span-2 inline-flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />} Salvar perfil
            </button>
          </form>
        )}

        {activeTab === "criador" && canManageCreator && (
          <section className="space-y-5">
            <form onSubmit={saveChannel} className="stg-hud-panel grid gap-4 p-5 md:grid-cols-[220px_1fr_auto] md:items-end">
              <label>
                <span className="text-xs font-black uppercase tracking-[0.08em] text-[#94a3b8]">Plataforma</span>
                <select value={channelForm.platform} onChange={(e) => setChannelForm({ ...channelForm, platform: e.target.value as CreatorPlatform })} className="mt-2 w-full border border-[#a855f7]/25 bg-black/40 px-3 py-2 text-white">
                  {platforms.map((platform) => <option key={platform} value={platform}>{platform}</option>)}
                </select>
              </label>
              <ProfileInput label="URL publica do canal/perfil" value={channelForm.channel_url || ""} onChange={(value) => setChannelForm({ ...channelForm, channel_url: value })} />
              <button type="submit" disabled={saving} className="stg-button-primary inline-flex items-center justify-center gap-2 disabled:opacity-50">
                <Plus size={16} /> {editingChannel ? "Atualizar" : "Adicionar"}
              </button>
              <p className="md:col-span-3 text-xs text-[#94a3b8]">Informe apenas URLs publicas. Nao ha API key, OAuth ou token no frontend.</p>
            </form>

            {visibleCreatorProfile && (
              <section className="overflow-hidden border border-[#a855f7]/35 bg-[#050608] shadow-xl shadow-[#a855f7]/10">
                <div
                  className="min-h-44 bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.88), rgba(17,24,39,.72), rgba(88,28,135,.38)), url("${publicForm.public_banner_url || visibleCreatorProfile.public_banner_url || "/assets/tactical-ops-bg.png"}")`,
                  }}
                >
                  <div className="flex min-h-44 flex-col justify-end gap-5 p-5 md:flex-row md:items-end md:justify-between">
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
                      <img
                        src={publicForm.public_avatar_url || visibleCreatorProfile.public_avatar_url || visibleCreatorProfile.avatar_url || avatarUrl}
                        alt={visibleCreatorProfile.public_name || visibleCreatorProfile.display_name || username}
                        className="size-24 rounded-full border-4 border-[#050608] object-cover shadow-xl shadow-[#a855f7]/20"
                      />
                      <div className="min-w-0">
                        <p className="tactical-label">Perfil de criador</p>
                        <h2 className="mt-1 break-words text-2xl font-black uppercase tracking-[0.08em] text-white">
                          {visibleCreatorProfile.public_name || visibleCreatorProfile.display_name || publicForm.public_name || username}
                        </h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="stg-badge-danger">Criador STG</span>
                          <span className="stg-badge-purple">{visibleCreatorProfile.channels.length} plataforma{visibleCreatorProfile.channels.length === 1 ? "" : "s"}</span>
                          {visibleCreatorProfile.is_featured && <span className="stg-badge-success">Destaque</span>}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2 text-left md:min-w-64">
                      <div>
                        <p className="tactical-label">Discord ID</p>
                        <p className="break-all font-mono text-sm font-bold text-white">{visibleCreatorProfile.discord_id || user.discord_id || "N/A"}</p>
                      </div>
                      <div>
                        <p className="tactical-label">Usuario</p>
                        <p className="break-all text-sm font-bold text-white">{visibleCreatorProfile.username || user.discord_username || username}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1.4fr]">
                  <div className="space-y-4">
                    <div>
                      <p className="tactical-label">Bio publica</p>
                      <p className="mt-2 text-sm leading-6 text-[#cbd5e1]">{visibleCreatorProfile.bio || publicForm.bio || "Sem bio publica cadastrada."}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="border border-[#a855f7]/20 bg-black/25 p-3">
                        <p className="tactical-label">Email publico</p>
                        <p className="mt-1 break-all text-sm font-bold text-white">{publicForm.public_email || visibleCreatorProfile.public_email || "Nao informado"}</p>
                      </div>
                      <div className="border border-[#a855f7]/20 bg-black/25 p-3">
                        <p className="tactical-label">Visibilidade</p>
                        <p className="mt-1 text-sm font-bold uppercase text-white">{publicForm.profile_visibility || visibleCreatorProfile.profile_visibility || "public"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="tactical-label">Plataformas cadastradas</p>
                      {visibleCreatorProfile.channels.length === 0 && <span className="text-xs font-bold text-[#94a3b8]">Nenhuma plataforma cadastrada</span>}
                    </div>

                    {visibleCreatorProfile.channels.map((channel) => (
                      <div key={channel.id} className="border border-[#a855f7]/24 bg-[#111827]/70 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <CreatorPlatformBadge platform={channel.platform} />
                              <span className={channel.is_active ? "stg-badge-success" : "stg-badge-danger"}>{channel.is_active ? "Ativo" : "Inativo"}</span>
                            </div>
                            <p className="mt-3 break-words text-lg font-black uppercase tracking-[0.04em] text-white">{getChannelLabel(channel)}</p>
                            <div className="mt-3 grid gap-2 text-sm text-[#cbd5e1]">
                              {channel.handle && <p><span className="font-black uppercase text-[#94a3b8]">Handle:</span> {channel.handle}</p>}
                              {channel.channel_id && <p><span className="font-black uppercase text-[#94a3b8]">ID:</span> {channel.channel_id}</p>}
                              {channel.channel_url && (
                                <a href={channel.channel_url} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-2 break-all font-bold text-[#c084fc] hover:text-white">
                                  <ExternalLink size={14} /> {channel.channel_url}
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button type="button" onClick={() => { setEditingChannel(channel); setChannelForm({ platform: channel.platform, channel_url: channel.channel_url || "", is_active: channel.is_active }); }} className="stg-button-outline inline-flex items-center gap-2 px-3 py-2 text-xs"><LinkIcon size={14} /> Editar</button>
                            <button type="button" onClick={() => void removeChannel(channel)} className="stg-button-danger inline-flex items-center gap-2 px-3 py-2 text-xs"><Trash2 size={14} /> Remover</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <div className="hidden">
              {(creatorProfile?.channels ?? []).map((channel) => (
                <div key={channel.id} className="stg-hud-panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <CreatorPlatformBadge platform={channel.platform} />
                    <p className="mt-2 break-all text-sm font-bold text-white">{channel.channel_url || channel.handle || "Canal sem URL retornada"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setEditingChannel(channel); setChannelForm({ platform: channel.platform, channel_url: channel.channel_url || "", is_active: channel.is_active }); }} className="stg-button-outline inline-flex items-center gap-2 px-3 py-2 text-xs"><LinkIcon size={14} /> Editar</button>
                    <button type="button" onClick={() => void removeChannel(channel)} className="stg-button-danger inline-flex items-center gap-2 px-3 py-2 text-xs"><Trash2 size={14} /> Remover</button>
                  </div>
                </div>
              ))}
              {!creatorProfile && <div className="stg-hud-panel p-5 text-[#94a3b8]">Recurso aguardando integração da API para retornar seu perfil de criador.</div>}
              {creatorProfile && creatorProfile.channels.length === 0 && <div className="stg-hud-panel p-5 text-[#94a3b8]">Nenhum canal cadastrado ainda.</div>}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

function ProfileInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-[0.08em] text-[#94a3b8]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-[#a855f7]/25 bg-black/40 px-3 py-2 text-white outline-none placeholder:text-[#64748b] focus:border-[#a855f7]/60"
      />
    </label>
  );
}
