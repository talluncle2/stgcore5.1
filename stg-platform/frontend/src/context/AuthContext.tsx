import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AuthUser } from "../types/api";
import {
  clearAuthToken,
  getMe,
  API_BASE_URL,
  AUTH_TOKEN_KEY,
  setAuthToken,
} from "../services/api";
import { Profile } from "../lib/supabase";
import {
  hasAdminAccess,
  hasCreatorAccess,
  hasDashboardAccess,
  hasModeratorAccess,
} from "../utils/permissions";

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
  signUp: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredToken(): string | null {
  return (
    localStorage.getItem(AUTH_TOKEN_KEY) ||
    localStorage.getItem("stg_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken")
  );
}

function persistToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem("stg_token", token);
  localStorage.setItem("token", token);
  localStorage.setItem("authToken", token);
  setAuthToken(token);
}

function clearStoredToken() {
  clearAuthToken();
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem("stg_token");
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
}

function profileFromUser(user: AuthUser | null): Profile | null {
  if (!user) return null;

  return {
    id: String(user.id ?? user.discord_id ?? ""),
    email: user.email || "",
    username:
      user.display_name ||
      user.global_name ||
      user.username ||
      user.discord_username ||
      user.email?.split("@")[0] ||
      "Usuario",
    discord_id: user.discord_id ? String(user.discord_id) : undefined,
    avatar_url: user.avatar_url || user.discord_avatar_url || user.image_url,
    discord_avatar_url: user.discord_avatar_url || user.avatar_url,
    roles: user.roles,
    role_ids: user.role_ids,
    discord_roles: user.discord_roles,
    guild_roles: user.guild_roles,
    permissions: user.permissions,
    sectors: user.sectors,
    is_content_creator: hasCreatorAccess(user),
    public_name: user.public_name,
    public_avatar_url: user.public_avatar_url,
    public_banner_url: user.public_banner_url,
    bio: user.bio,
    public_email: user.public_email,
    location_optional: user.location_optional,
    pronouns: user.pronouns,
    sexual_orientation: user.sexual_orientation,
    sexual_orientation_visibility: user.sexual_orientation_visibility || "private",
    profile_visibility: user.profile_visibility || "public",
    role: hasAdminAccess(user)
      ? "admin"
      : hasModeratorAccess(user)
        ? "moderator"
        : hasDashboardAccess(user)
          ? "staff"
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

    const token = getStoredToken();

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    /**
     * Garante que qualquer token encontrado em chave antiga
     * seja salvo também na chave oficial usada pelo api.ts.
     */
    persistToken(token);

    try {
      const me = await getMe();

      if (me) {
        setUser(me);

        if (import.meta.env.DEV) {
          console.log("Usuario carregado via /auth/me", {
            discord_id: me.discord_id,
            role: me.role,
            roles: me.roles,
            role_ids: me.role_ids,
            is_admin: me.is_admin === true,
            is_moderator: me.is_moderator === true,
            is_content_creator: me.is_content_creator === true,
            can_access_dashboard: me.can_access_dashboard === true,
          });
        }
      } else {
        clearStoredToken();
        setUser(null);
      }
    } catch (error) {
      console.error("Erro ao buscar /auth/me:", error);
      clearStoredToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  function loginWithDiscord() {
    if (!API_BASE_URL) {
      window.alert("VITE_API_BASE_URL nao esta configurado. Configure a URL da API Replit no deploy.");
      return;
    }
    window.location.href = `${API_BASE_URL}/auth/discord/login`;
  }

  async function signInWithDiscord(): Promise<{ error: Error | null }> {
    loginWithDiscord();
    return { error: null };
  }

  async function logout() {
    clearStoredToken();
    setUser(null);
    window.location.href = "/";
  }

  async function signOut() {
    await logout();
  }

  async function signIn(email: string, password: string) {
    void email;
    void password;
    return {
      error: new Error("Login por email nao esta habilitado neste frontend. Use Discord."),
    };
  }

  async function signUp() {
    return {
      error: new Error("Cadastro pelo frontend ainda nao esta habilitado nesta fase."),
    };
  }

  async function updateProfile() {
    return {
      error: new Error("Edicao de perfil ainda nao esta habilitada nesta fase."),
    };
  }

  const profile = useMemo(() => profileFromUser(user), [user]);

  const isAuthenticated = !!user;
  const identity = user ?? profile;

  const isAdmin = hasAdminAccess(identity);
  const isModerator = hasModeratorAccess(identity);
  const canAccessDashboard = hasDashboardAccess(identity);

  const token = getStoredToken();
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
