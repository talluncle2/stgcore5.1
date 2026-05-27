import { useState, useEffect } from "react";
import { Bell, Circle, Crosshair } from "lucide-react";
import { getHealth } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { UserMenu } from "./UserMenu";

export function Topbar() {
  const [apiStatus, setApiStatus] = useState<"online" | "offline">("offline");
  const [apiLoading, setApiLoading] = useState(true);
  const { isAuthenticated, loginWithDiscord } = useAuth();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const result = await getHealth();
        setApiStatus(result.status);
      } catch {
        setApiStatus("offline");
      } finally {
        setApiLoading(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="stg-premium-topbar fixed left-0 right-0 top-0 z-30 flex h-16 items-center border-b border-[#a855f7]/20 bg-[#050608]/94 px-4 pl-16 text-center shadow-lg shadow-black/25 backdrop-blur-xl lg:left-64 lg:px-6">
      <div className="flex-1 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="tactical-edge hidden size-9 items-center justify-center border border-[#a855f7]/35 bg-[#111827] text-[#a855f7] sm:flex">
            <Crosshair size={18} />
          </div>
          <div className="min-w-0">
            <p className="tactical-label hidden sm:block">COMANDO STG</p>
            <h1 className="text-left text-lg font-black uppercase tracking-[0.07em] gradient-text sm:text-xl">
              <span className="sm:hidden">COMANDO</span>
              <span className="hidden sm:inline">CENTRO DE COMANDO</span>
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {/* API Status */}
          <div className="tactical-edge flex items-center gap-2 border border-[#84cc16]/25 bg-[#111827]/90 px-4 py-2">
            <Circle
              size={8}
              className={`fill-current ${
                apiLoading
                  ? "text-[#94a3b8]"
                  : apiStatus === "online"
                    ? "text-[#84cc16]"
                    : "text-[#f97316]"
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#94a3b8]">
              {apiLoading ? "Verificando..." : apiStatus === "online" ? "API ONLINE" : "API OFFLINE"}
            </span>
          </div>

          {/* Notifications */}
          <button className="tactical-edge hidden border border-[#a855f7]/20 bg-[#111827]/80 p-2 text-[#94a3b8] transition-colors hover:border-[#a855f7]/45 hover:text-[#a855f7] sm:block">
            <Bell size={20} />
          </button>

          {/* User Menu or Login Link */}
          {!isAuthenticated && (
            <button
              type="button"
              onClick={loginWithDiscord}
              className="tactical-edge flex items-center gap-2 bg-[#a855f7] px-4 py-2 text-sm font-black uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#c084fc] glow-purple"
            >
              Conectar-se
            </button>
          )}
          {isAuthenticated && <UserMenu />}
        </div>
      </div>
    </header>
  );
}
