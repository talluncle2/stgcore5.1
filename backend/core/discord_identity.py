"""Helpers for identity claims derived from Discord sync data."""
import re
from core.models import DiscordMember

RESERVED_ROLE_NAMES = {
    "ADMIN", "ADMINISTRATOR", "MOD", "MODERADOR", "MODERATOR",
    "STAFF", "MEMBRO", "MEMBER", "USER", "CRIADOR", "CREATOR",
}

def extract_clan_tag(member: DiscordMember | None) -> str | None:
    """Extract a conservative clan tag from synced Discord member data."""
    if not member:
        return None

    for value in [
        member.display_name,
        member.global_name,
        member.username,
        member.discord_username,
        member.nick,
    ]:
        text = str(value or "").strip()
        bracket_match = re.match(r"^\[([A-Za-z0-9_-]{2,12})\]", text)
        if bracket_match:
            return bracket_match.group(1).upper()
        separator_match = re.match(r"^([A-Za-z0-9_-]{2,12})\s*(?:\||-|:)\s+", text)
        if separator_match:
            return separator_match.group(1).upper()

    roles_json = member.roles_json or {}
    role_names = []
    if isinstance(roles_json, list):
        role_names = [role.get("name") for role in roles_json if isinstance(role, dict)]
    elif isinstance(roles_json, dict):
        role_names = [
            role.get("name") if isinstance(role, dict) else role
            for role in roles_json.values()
        ]

    for role_name in role_names:
        normalized = str(role_name or "").strip().upper()
        if re.fullmatch(r"[A-Z0-9_-]{2,12}", normalized) and normalized not in RESERVED_ROLE_NAMES:
            return normalized

    return None
