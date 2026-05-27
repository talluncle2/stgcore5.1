import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthUser } from "../types/api";
import { clearAuthToken, getMe, API_BASE_URL, AUTH_TOKEN_KEY } from "../services/api";
import { Profile } from "../lib/supabase";
import { hasAdminAccess, hasDashboardAccess, hasModeratorAccess } from "../utils/permissions";

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  session: { access_token: string } | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  hasDashboardAccess: boolean;
  supabaseEnabled: boolean;
  loginWithDiscord: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithDiscord: () => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function profileFromUser(user: AuthUser | null): Profile | null {
  if (!user) return null;

  return {
    id: String(user.id ?? user.discord_id ?? ""),
    email: user.email || "",
    username:
      user.username ||
      user.global_name ||
      user.discord_username ||
      user.email?.split("@")[0] ||
      "Usuario",
    discord_id: user.discord_id ? String(user.discord_id) : undefined,
    avatar_url: user.avatar_url || user.discord_avatar_url || user.image_url,
    discord_avatar_url: user.discord_avatar_url || user.avatar_url,
    role: user.is_admin
      ? "admin"
      : user.is_moderator || user.is_staff
        ? "moderator"
        : "user",
    xp: user.xp ?? 0,
    level: user.level ?? 1,
    coins: user.coins ?? 0,
    created_at: "",
    updated_at: "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const me = await getMe();
      if (me) {
        setUser(me);
        if (import.meta.env.DEV) {
          console.log("Usuario carregado", {
            role: me.role,
            is_admin: me.is_admin === true,
            is_moderator: me.is_moderator === true,
          });
        }
      } else {
        clearAuthToken();
        setUser(null);
      }
    } catch {
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  function loginWithDiscord() {
    window.location.href = `${API_BASE_URL}/auth/discord/login`;
  }

  async function signInWithDiscord(): Promise<{ error: Error | null }> {
    loginWithDiscord();
    return { error: null };
  }

  async function logout() {
    clearAuthToken();
    setUser(null);
    window.location.href = "/";
  }

  async function signOut() {
    await logout();
  }

  async function signIn(email: string, password: string) {
    void email;
    void password;
    return { error: new Error("Login por email nao esta habilitado neste frontend. Use Discord.") };
  }

  async function signUp() {
    return { error: new Error("Cadastro pelo frontend ainda nao esta habilitado nesta fase.") };
  }

  async function updateProfile() {
    return { error: new Error("Edicao de perfil ainda nao esta habilitada nesta fase.") };
  }

  const profile = useMemo(() => profileFromUser(user), [user]);
  const isAuthenticated = !!user;
  const identity = user ?? profile;
  const isAdmin = hasAdminAccess(identity);
  const isModerator = hasModeratorAccess(identity);
  const canAccessDashboard = hasDashboardAccess(identity);
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const session = token ? { access_token: token } : null;

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    isAuthenticated,
    isAdmin,
    isModerator,
    hasDashboardAccess: canAccessDashboard,
    supabaseEnabled: false,
    loginWithDiscord,
    logout,
    refreshUser,
    signOut,
    signInWithDiscord,
    signIn,
    signUp,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
