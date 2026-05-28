import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Gauge,
  LogOut,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Trophy,
  User as UserIcon,
  Video,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { hasAdminAccess, hasCreatorAccess, hasDashboardAccess, hasModeratorAccess, hasSettingsAccess } from "../../utils/permissions";

export function UserMenu() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  if (!profile && !user) return null;

  const identity = user ?? profile;
  const canOpenDashboard = hasDashboardAccess(identity);
  const canOpenAdmin = hasAdminAccess(identity);
  const canOpenModeration = hasModeratorAccess(identity);
  const canOpenSettings = hasSettingsAccess(identity);
  const canOpenCreatorAccounts = hasCreatorAccess(identity);

  const username =
    profile?.username ||
    user?.username ||
    user?.global_name ||
    user?.discord_username ||
    user?.email?.split("@")[0] ||
    "Operador";

  const email = profile?.email || user?.email || "";

  const avatarUrl =
    profile?.discord_avatar_url ||
    profile?.avatar_url ||
    user?.discord_avatar_url ||
    user?.avatar_url ||
    user?.image_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=a855f7&color=fff`;

  const roleLabel = canOpenAdmin
    ? "ADMIN"
    : canOpenModeration
      ? "MODERADOR"
      : canOpenDashboard
        ? "STAFF"
        : "MEMBRO";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="tactical-edge group flex max-w-[220px] items-center gap-2 border border-[#a855f7]/30 bg-[#111827]/85 px-2 py-1.5 transition-colors hover:border-[#84cc16]/55 hover:bg-[#111827] 2xl:max-w-[260px]"
        title={username}
      >
        <img
          src={avatarUrl}
          alt={username}
          className="size-8 rounded-full border-2 border-[#a855f7] object-cover transition-colors group-hover:border-[#84cc16] shadow-lg shadow-[#a855f7]/20 glow-purple"
        />
        <div className="hidden min-w-0 md:block">
          <p className="max-w-[125px] truncate text-left text-sm font-black uppercase tracking-[0.05em] text-[#f8fafc] 2xl:max-w-[165px]">
            {username}
          </p>
          <p className="truncate text-left text-xs font-bold uppercase tracking-[0.08em] text-[#94a3b8]">
            {roleLabel}
          </p>
        </div>
      </button>

      {isOpen && (
        <div className="stg-hud-panel-glow absolute right-0 z-50 mt-2 w-64 overflow-hidden border-[#a855f7]/30">
          <div className="relative border-b border-[#a855f7]/25 bg-[#111827]/95 px-4 py-3">
            <p className="text-sm font-black uppercase tracking-[0.06em] text-[#f8fafc]">{username}</p>
            {email && <p className="mt-1 text-xs text-[#94a3b8]">{email}</p>}
            <span className="mt-2 inline-block stg-badge-purple">{roleLabel}</span>
          </div>

          <div className="relative py-2">
            <button
              onClick={() => handleNavigate("/profile")}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold uppercase tracking-[0.04em] text-[#f8fafc] transition-colors hover:bg-[#a855f7]/12 hover:text-[#a855f7]"
            >
              <UserIcon size={16} />
              Perfil
            </button>
            <button
              onClick={() => handleNavigate("/profile?tab=publico")}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold uppercase tracking-[0.04em] text-[#f8fafc] transition-colors hover:bg-[#a855f7]/12 hover:text-[#a855f7]"
            >
              <UserIcon size={16} />
              Perfil publico
            </button>

            <button
              onClick={() => handleNavigate("/profile?tab=privacidade")}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold uppercase tracking-[0.04em] text-[#f8fafc] transition-colors hover:bg-[#a855f7]/12 hover:text-[#a855f7]"
            >
              <Settings size={16} />
              Configuracoes de perfil
            </button>

            {canOpenCreatorAccounts && (
              <button
                onClick={() => handleNavigate("/profile?tab=criador")}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-black uppercase tracking-[0.04em] text-[#ef4444] transition-colors hover:bg-[#ef4444]/10"
              >
                <Video size={16} />
                Contas de criador
              </button>
            )}

            {canOpenDashboard && (
              <>
                <div className="my-2 border-t border-[#a855f7]/25" />
                <button
                  onClick={() => handleNavigate("/dashboard")}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-black uppercase tracking-[0.04em] text-[#84cc16] transition-colors hover:bg-[#84cc16]/10"
                >
                  <Gauge size={16} />
                  Dashboard
                </button>
              </>
            )}

            {canOpenModeration && (
              <button
                onClick={() => handleNavigate("/moderation")}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-black uppercase tracking-[0.04em] text-[#38bdf8] transition-colors hover:bg-[#38bdf8]/10"
              >
                <ShieldCheck size={16} />
                Painel Moderador
              </button>
            )}

            {canOpenSettings && (
              <button
                onClick={() => handleNavigate(canOpenAdmin ? "/configuracoes?tab=criadores" : "/configuracoes?tab=loja")}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-black uppercase tracking-[0.04em] text-[#c084fc] transition-colors hover:bg-[#a855f7]/12"
              >
                <Settings size={16} />
                {canOpenAdmin ? "Admin Criadores" : "Configuracoes"}
              </button>
            )}

            <div className="my-2 border-t border-[#a855f7]/25" />
            <button
              onClick={() => handleNavigate("/loja")}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold uppercase tracking-[0.04em] text-[#f8fafc] transition-colors hover:bg-[#a855f7]/12 hover:text-[#a855f7]"
            >
              <ShoppingCart size={16} />
              Loja
            </button>
            <button
              onClick={() => handleNavigate("/torneios")}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold uppercase tracking-[0.04em] text-[#f8fafc] transition-colors hover:bg-[#a855f7]/12 hover:text-[#a855f7]"
            >
              <Trophy size={16} />
              Torneios
            </button>
          </div>

          <div className="relative border-t border-[#a855f7]/25" />
          <button
            onClick={handleSignOut}
            className="relative flex w-full items-center gap-3 px-4 py-2.5 text-sm font-black uppercase tracking-[0.04em] text-[#ef4444] transition-colors hover:bg-[#ef4444]/10"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
