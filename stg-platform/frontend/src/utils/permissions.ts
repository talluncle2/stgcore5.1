import { AuthUser } from "../types/api";
import { Profile } from "../lib/supabase";

export const DASHBOARD_ALLOWED_ROLES = [
  "admin",
  "administrator",
  "moderador",
  "moderator",
  "staff",
  "infraestrutura",
  "esportes",
  "financeiro",
  "marketing",
  "staff_esportes",
  "staff_moderacao",
  "staff_financeiro",
  "staff_infraestrutura",
];

type PermissionUser = AuthUser | Profile | Record<string, unknown> | null | undefined;

function normalizeValue(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function collectValues(user: PermissionUser): string[] {
  if (!user) return [];

  const source = user as Record<string, unknown>;
  const listFields = ["roles", "discord_roles", "guild_roles", "permissions", "sectors"];
  const values: string[] = [];

  for (const field of listFields) {
    const rawValue = source[field];
    if (Array.isArray(rawValue)) {
      values.push(...rawValue.map(normalizeValue));
    } else if (typeof rawValue === "string") {
      values.push(...rawValue.split(/[,\s]+/).map(normalizeValue));
    }
  }

  if (source.role) values.push(normalizeValue(source.role));

  return values.filter(Boolean);
}

export function hasDashboardAccess(user: PermissionUser): boolean {
  if (!user) return false;

  const source = user as Record<string, unknown>;
  if (
    source.can_access_dashboard === true ||
    source.is_admin === true ||
    source.is_staff === true ||
    source.is_moderator === true
  ) {
    return true;
  }

  const allowedRoles = DASHBOARD_ALLOWED_ROLES.map(normalizeValue);
  const values = collectValues(user);

  return values.some((value) => allowedRoles.includes(value));
}

export function hasAdminAccess(user: PermissionUser): boolean {
  if (!user) return false;

  const source = user as Record<string, unknown>;
  if (source.is_admin === true) return true;

  return collectValues(user).some((value) =>
    ["admin", "administrator"].includes(value)
  );
}

export function hasModeratorAccess(user: PermissionUser): boolean {
  if (!user) return false;
  if (hasAdminAccess(user)) return true;

  const source = user as Record<string, unknown>;
  if (source.is_moderator === true) return true;

  return collectValues(user).some((value) =>
    ["moderator", "moderador", "staff_moderacao", "mod"].includes(value)
  );
}

export function hasSettingsAccess(user: PermissionUser): boolean {
  return hasDashboardAccess(user);
}

export function hasCreatorAccess(user: PermissionUser): boolean {
  if (!user) return false;
  const source = user as Record<string, unknown>;
  return source.is_content_creator === true || hasAdminAccess(user);
}

export function canManageContent(user: PermissionUser): boolean {
  if (!user) return false;
  return hasDashboardAccess(user) || hasAdminAccess(user) || hasModeratorAccess(user);
}
