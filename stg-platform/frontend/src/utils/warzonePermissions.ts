import { AuthUser } from "../types/api";

const RESERVED_VALUES = new Set([
  "ADMIN",
  "ADMINISTRATOR",
  "MOD",
  "MODERADOR",
  "MODERATOR",
  "STAFF",
  "MEMBRO",
  "MEMBER",
  "USER",
  "CRIADOR",
  "CREATOR",
]);

export function normalizeClanTag(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/^\[|\]$/g, "")
    .toUpperCase();
}

function extractTagFromName(value: unknown): string | null {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const bracketMatch = text.match(/^\[([A-Za-z0-9_-]{2,12})\]/);
  if (bracketMatch) return normalizeClanTag(bracketMatch[1]);

  const separatorMatch = text.match(/^([A-Za-z0-9_-]{2,12})\s*(?:\||•|·|[-:])\s+/);
  if (separatorMatch) return normalizeClanTag(separatorMatch[1]);

  return null;
}

export function getOperatorClanTag(user: AuthUser | null | undefined): string | null {
  if (!user) return null;

  const explicitTag = normalizeClanTag(user.clan_tag || user.clanTag);
  if (explicitTag) return explicitTag;

  const nameCandidates = [
    user.display_name,
    user.global_name,
    user.username,
    user.discord_username,
  ];

  for (const candidate of nameCandidates) {
    const tag = extractTagFromName(candidate);
    if (tag) return tag;
  }

  const roleCandidates = [
    ...(user.roles ?? []),
    ...(user.discord_roles ?? []),
    ...(user.guild_roles ?? []),
  ];

  for (const role of roleCandidates) {
    if (typeof role !== "string") continue;
    const bracketTag = extractTagFromName(role);
    if (bracketTag) return bracketTag;

    const normalized = normalizeClanTag(role);
    if (/^[A-Z0-9_-]{2,12}$/.test(normalized) && !RESERVED_VALUES.has(normalized)) {
      return normalized;
    }
  }

  return null;
}

export function canClanParticipate(allowedClans: string[], clanTag: string | null): boolean {
  const normalizedAllowed = allowedClans.map(normalizeClanTag).filter(Boolean);
  if (normalizedAllowed.includes("ALL")) return true;
  if (!clanTag) return false;
  return normalizedAllowed.includes(normalizeClanTag(clanTag));
}

export function getParticipationReason(
  allowedClans: string[],
  clanTag: string | null
): { allowed: boolean; message: string } {
  if (allowedClans.map(normalizeClanTag).includes("ALL")) {
    return { allowed: true, message: "Operacao aberta para todos os clas." };
  }

  if (!clanTag) {
    return {
      allowed: false,
      message: "Nenhuma tag de cla foi identificada no seu perfil Discord.",
    };
  }

  if (canClanParticipate(allowedClans, clanTag)) {
    return { allowed: true, message: `Tag ${normalizeClanTag(clanTag)} autorizada.` };
  }

  return {
    allowed: false,
    message: `A tag ${normalizeClanTag(clanTag)} nao esta permitida nesta operacao.`,
  };
}
