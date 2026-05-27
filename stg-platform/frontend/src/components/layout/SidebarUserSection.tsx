import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function SidebarUserSection({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  if (!profile && !user) return null;

  const username =
    profile?.username ||
    user?.username ||
    user?.discord_username ||
    user?.email?.split("@")[0] ||
    "Operador";

  const avatarUrl =
    profile?.discord_avatar_url ||
    profile?.avatar_url ||
    user?.discord_avatar_url ||
    user?.avatar_url ||
    user?.image_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=d6a23f&color=080a05`;

  const level = profile?.level ?? user?.level ?? 1;

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => handleNavigate("/profile")}
        className="tactical-edge group flex w-full items-center gap-3 border border-[#d6a23f]/30 bg-[#10130e]/92 p-3 transition-colors hover:border-[#b7ff4a]/50 hover:bg-[#151a10]"
      >
        <img
          src={avatarUrl}
          alt={username}
          className="size-10 flex-shrink-0 rounded-full border-2 border-[#d6a23f] object-cover transition-colors group-hover:border-[#b7ff4a]"
        />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-black uppercase tracking-[0.05em] text-[#f1f0e7]">
            {username}
          </p>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#9ca58d]">
            Nivel {level}
          </p>
        </div>
      </button>

      <button
        onClick={handleSignOut}
        className="tactical-edge flex w-full items-center gap-2 border border-transparent px-4 py-2 font-black uppercase tracking-[0.06em] text-[#f05b24] transition-all hover:border-[#f05b24]/30 hover:bg-[#f05b24]/10"
      >
        <LogOut size={16} />
        <span className="text-sm">Sair</span>
      </button>
    </div>
  );
}
