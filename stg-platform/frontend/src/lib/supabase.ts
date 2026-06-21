import { createClient } from "@supabase/supabase-js";
import { AUTH_TOKEN_KEY } from "../services/api";

// Publishable Supabase values are safe to ship to browsers. Authorization is
// enforced by RLS and the Discord JWT, never by hiding this client key.
const DEFAULT_SUPABASE_URL = "https://dczcobkcxnlclypahbod.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable__91UWFLN7xGrnqDU4k_nPA_pnpzFgLA";

const supabaseUrl = String(
  import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
).trim();
const supabasePublishableKey = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_PUBLISHABLE_KEY
).trim();

export const isSupabaseEnabled = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl, supabasePublishableKey, {
      accessToken: async () => localStorage.getItem(AUTH_TOKEN_KEY),
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    })
  : null;

export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  username: string;
  discord_id?: string;
  avatar_url?: string;
  discord_avatar_url?: string;
  role: "user" | "admin" | "moderator" | "staff";
  roles?: Array<string | number>;
  role_ids?: Array<string | number>;
  discord_roles?: Array<string | number>;
  guild_roles?: Array<string | number>;
  permissions?: Array<string | number>;
  sectors?: Array<string | number>;
  is_content_creator?: boolean;
  public_name?: string;
  public_avatar_url?: string;
  public_banner_url?: string;
  bio?: string;
  public_email?: string;
  location_optional?: string;
  pronouns?: string;
  sexual_orientation?: string;
  sexual_orientation_visibility?: "public" | "private";
  profile_visibility?: "public" | "members" | "private";
  xp: number;
  level: number;
  coins: number;
  created_at: string;
  updated_at: string;
};
