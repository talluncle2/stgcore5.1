export const isSupabaseEnabled = false;
export const supabase = null;

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
  xp: number;
  level: number;
  coins: number;
  created_at: string;
  updated_at: string;
};
