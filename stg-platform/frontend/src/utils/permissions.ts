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

export const CONTENT_CREATOR_ROLES = [
  "criador",
  "criador_de_conteudo",
  "criador_conteudo",
  "content_creator",
  "content-creator",
  "creator",
  "stg_creator",
  "creator_stg",
];

type PermissionUser = AuthUser | Profile | Record<string, unknown> | null | undefined;

function normalizeValue(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function pushNormalized(values: string[], value: unknown) {
  if (value === null || value === undefined) return;

  if (typeof value === "object") {
    const source = value as Record<string, unknown>;
    pushNormalized(values, source.name ?? source.label ?? source.role ?? source.id ?? source.role_id);
    return;
  }

  const normalized = normalizeValue(value);
  if (!normalized) return;
  values.push(normalized);

  if (typeof value === "string") {
    values.push(...value.split(/[,\s]+/).map(normalizeValue).filter(Boolean));
  }
}

function collectValues(user: PermissionUser): string[] {
  if (!user) return [];

  const source = user as Record<string, unknown>;
  const listFields = ["roles", "role_ids", "roles_json", "discord_roles", "guild_roles", "permissions", "sectors"];
  const values: string[] = [];

  for (const field of listFields) {
    const rawValue = source[field];
    if (Array.isArray(rawValue)) {
      rawValue.forEach((value) => pushNormalized(values, value));
    } else if (typeof rawValue === "string" || typeof rawValue === "number") {
      pushNormalized(values, rawValue);
    } else if (rawValue && typeof rawValue === "object") {
      Object.values(rawValue as Record<string, unknown>).forEach((value) => pushNormalized(values, value));
    }
  }

  if (source.role) pushNormalized(values, source.role);

  return Array.from(new Set(values.filter(Boolean)));
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
  if (source.is_content_creator === true || hasAdminAccess(user)) return true;

  const values = collectValues(user);
  return values.some((value) =>
    CONTENT_CREATOR_ROLES.includes(value) ||
    (value.includes("criador") && value.includes("conteudo")) ||
    (value.includes("content") && value.includes("creator"))
  );
}

export function canManageContent(user: PermissionUser): boolean {
  if (!user) return false;
  return hasDashboardAccess(user) || hasAdminAccess(user) || hasModeratorAccess(user);
}
