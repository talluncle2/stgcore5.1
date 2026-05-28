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
