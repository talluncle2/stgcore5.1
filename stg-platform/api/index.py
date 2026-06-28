"""STG Core Vercel API.

This serverless FastAPI app replaces the old Replit dependency for the web
surface. It keeps Discord, bot sync, admin reads and profile writes behind
server-side environment variables while the Vite app can call same-origin
`/api/*` routes.
"""

from __future__ import annotations

import json
import os
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Iterable
from urllib.parse import urlencode

import jwt
import requests
from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.pool import NullPool

try:
    from dotenv import load_dotenv

    load_dotenv()
except Exception:
    pass


API_VERSION = "2026.06.28-vercel"
DISCORD_API_BASE = "https://discord.com/api/v10"
OAUTH_STATE_COOKIE = "stg_discord_oauth_state"


def env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def split_env(name: str) -> list[str]:
    return [item.strip() for item in env(name).split(",") if item.strip()]


def role_set(name: str) -> set[str]:
    return {str(item) for item in split_env(name)}


def normalize_database_url(value: str) -> str:
    if value.startswith("postgres://"):
        return "postgresql://" + value[len("postgres://") :]
    return value


DATABASE_URL = normalize_database_url(env("DATABASE_URL"))
JWT_SECRET = env("SUPABASE_JWT_SECRET") or env("JWT_SECRET_KEY")
JWT_ALGORITHM = env("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(env("JWT_EXPIRATION_HOURS", "24") or "24")
FRONTEND_URL = env("FRONTEND_URL", "https://stgwarzone.vercel.app").rstrip("/")
GUILD_ID = env("GUILD_ID")
ADMIN_ROLE_IDS = role_set("ADMIN_ROLE_IDS")
MODERATOR_ROLE_IDS = role_set("MODERATOR_ROLE_IDS")
DASHBOARD_ALLOWED_ROLE_IDS = role_set("DASHBOARD_ALLOWED_ROLE_IDS")
CONTENT_CREATOR_ROLE_IDS = role_set("CONTENT_CREATOR_ROLE_IDS")


engine: Engine | None = None
if DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 10},
    )


app = FastAPI(
    title="STG Core API",
    version=API_VERSION,
    docs_url="/docs",
    openapi_url="/openapi.json",
)


@app.middleware("http")
async def normalize_api_prefix(request: Request, call_next):
    """Support both local `/health` and deployed `/api/health` paths."""
    path = request.scope.get("path", "")
    for prefix in ("/api/index.py", "/api"):
        if path == prefix:
            request.scope["path"] = "/"
            break
        if path.startswith(prefix + "/"):
            request.scope["path"] = path[len(prefix) :]
            break
    return await call_next(request)


cors_origins = {
    FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:5173",
    *split_env("CORS_ORIGINS"),
    *split_env("ALLOWED_FRONTEND_ORIGINS"),
}
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in cors_origins if origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter()


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def serialize(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, list):
        return [serialize(item) for item in value]
    if isinstance(value, dict):
        return {key: serialize(item) for key, item in value.items()}
    return value


def row_dict(row: Any) -> dict[str, Any]:
    return serialize(dict(row))


def get_db() -> Iterable[Connection]:
    if engine is None:
        raise HTTPException(status_code=503, detail="DATABASE_URL is not configured")
    with engine.begin() as conn:
        yield conn


def fetch_one(conn: Connection, sql: str, params: dict[str, Any] | None = None) -> dict[str, Any] | None:
    row = conn.execute(text(sql), params or {}).mappings().first()
    return row_dict(row) if row else None


def fetch_all(conn: Connection, sql: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    rows = conn.execute(text(sql), params or {}).mappings().all()
    return [row_dict(row) for row in rows]


def scalar(conn: Connection, sql: str, params: dict[str, Any] | None = None) -> Any:
    return conn.execute(text(sql), params or {}).scalar()


def safe_count(conn: Connection, table: str, where: str = "true") -> int:
    try:
        return int(scalar(conn, f"SELECT count(*) FROM public.{table} WHERE {where}") or 0)
    except SQLAlchemyError:
        return 0


def to_bigint(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(str(value))
    except (TypeError, ValueError):
        return None


def json_param(value: Any) -> str:
    return json.dumps(value if value is not None else {}, default=str)


def request_origin(request: Request) -> str:
    proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("x-forwarded-host", request.headers.get("host", ""))
    return f"{proto}://{host}".rstrip("/")


def discord_avatar_url(user: dict[str, Any]) -> str | None:
    avatar = user.get("avatar")
    discord_id = user.get("id")
    if not avatar or not discord_id:
        return None
    extension = "gif" if str(avatar).startswith("a_") else "png"
    return f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar}.{extension}?size=256"


def extract_clan_tag(*values: Any) -> str | None:
    for value in values:
        raw = str(value or "")
        match = re.search(r"\[([A-Za-z0-9_-]{2,12})\]", raw)
        if match:
            return match.group(1).upper()
    return None


def calculate_permissions(role_ids: list[Any]) -> dict[str, bool]:
    role_values = {str(role_id) for role_id in role_ids if role_id is not None}
    is_admin = bool(role_values & ADMIN_ROLE_IDS)
    is_moderator = is_admin or bool(role_values & MODERATOR_ROLE_IDS)
    can_access_dashboard = is_admin or is_moderator or bool(role_values & DASHBOARD_ALLOWED_ROLE_IDS)
    is_content_creator = bool(role_values & CONTENT_CREATOR_ROLE_IDS)
    return {
        "is_admin": is_admin,
        "is_moderator": is_moderator,
        "can_access_dashboard": can_access_dashboard,
        "is_content_creator": is_content_creator,
    }


def create_access_token(claims: dict[str, Any]) -> str:
    if not JWT_SECRET:
        raise HTTPException(status_code=503, detail="SUPABASE_JWT_SECRET is not configured")
    payload = claims.copy()
    discord_id = str(payload.get("discord_id") or "")
    payload.setdefault("sub", str(uuid.uuid5(uuid.NAMESPACE_URL, f"stg-discord:{discord_id}")))
    payload.setdefault("aud", "authenticated")
    payload.setdefault("role", "authenticated")
    payload.setdefault("iss", "stg-core-vercel")
    payload["iat"] = int(now_utc().timestamp())
    payload["exp"] = int((now_utc() + timedelta(hours=JWT_EXPIRATION_HOURS)).timestamp())
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    if not JWT_SECRET:
        raise HTTPException(status_code=503, detail="SUPABASE_JWT_SECRET is not configured")
    try:
        return jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"verify_aud": False},
        )
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Token expired") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc


def bearer_payload(authorization: str | None = Header(None)) -> dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    return decode_access_token(authorization.split(" ", 1)[1].strip())


def find_member(conn: Connection, discord_id: str | int | None) -> dict[str, Any] | None:
    if not discord_id:
        return None
    if GUILD_ID:
        return fetch_one(
            conn,
            """
            SELECT * FROM public.discord_members
            WHERE discord_id = :discord_id AND guild_id = :guild_id
            ORDER BY updated_at DESC NULLS LAST
            LIMIT 1
            """,
            {"discord_id": to_bigint(discord_id), "guild_id": to_bigint(GUILD_ID)},
        )
    return fetch_one(
        conn,
        """
        SELECT * FROM public.discord_members
        WHERE discord_id = :discord_id
        ORDER BY updated_at DESC NULLS LAST
        LIMIT 1
        """,
        {"discord_id": to_bigint(discord_id)},
    )


def find_public_profile(conn: Connection, discord_id: str | int | None) -> dict[str, Any] | None:
    if not discord_id:
        return None
    try:
        return fetch_one(
            conn,
            "SELECT * FROM public.user_public_profiles WHERE discord_id = :discord_id LIMIT 1",
            {"discord_id": str(discord_id)},
        )
    except SQLAlchemyError:
        return None


def auth_user_from_sources(payload: dict[str, Any], member: dict[str, Any] | None, profile: dict[str, Any] | None) -> dict[str, Any]:
    role = "user"
    source = member or {}
    if source.get("is_admin") or payload.get("is_admin"):
        role = "admin"
    elif source.get("is_moderator") or payload.get("is_moderator"):
        role = "moderator"
    elif source.get("can_access_dashboard") or payload.get("can_access_dashboard"):
        role = "staff"

    role_ids = source.get("role_ids") or payload.get("role_ids") or []
    roles_json = source.get("roles_json") or payload.get("roles_json") or {}
    username = source.get("username") or payload.get("username") or payload.get("discord_username")
    display_name = source.get("display_name") or source.get("global_name") or username
    avatar_url = source.get("avatar_url") or payload.get("avatar_url")
    discord_id = source.get("discord_id") or payload.get("discord_id")

    public_profile = profile or {}
    return {
        "id": payload.get("sub") or str(discord_id or ""),
        "discord_id": str(discord_id or ""),
        "discord_username": source.get("discord_username") or username,
        "username": username,
        "global_name": source.get("global_name") or display_name,
        "display_name": display_name,
        "email": payload.get("email"),
        "avatar_url": avatar_url,
        "discord_avatar_url": avatar_url,
        "role": role,
        "roles": role_ids,
        "role_ids": role_ids,
        "discord_roles": role_ids,
        "roles_json": roles_json,
        "is_admin": bool(source.get("is_admin") or payload.get("is_admin")),
        "is_moderator": bool(source.get("is_moderator") or payload.get("is_moderator")),
        "can_access_dashboard": bool(source.get("can_access_dashboard") or payload.get("can_access_dashboard")),
        "is_staff": bool(source.get("can_access_dashboard") or payload.get("can_access_dashboard")),
        "is_content_creator": bool(source.get("is_content_creator") or payload.get("is_content_creator")),
        "clan_tag": payload.get("clan_tag") or extract_clan_tag(source.get("nick"), display_name, username),
        "last_discord_sync_at": source.get("last_discord_sync_at"),
        "public_name": public_profile.get("public_name"),
        "public_avatar_url": public_profile.get("public_avatar_url"),
        "public_banner_url": public_profile.get("public_banner_url"),
        "bio": public_profile.get("bio"),
        "public_email": public_profile.get("public_email"),
        "location_optional": public_profile.get("location_optional"),
        "pronouns": public_profile.get("pronouns"),
        "sexual_orientation": public_profile.get("sexual_orientation"),
        "sexual_orientation_visibility": public_profile.get("sexual_orientation_visibility") or "private",
        "profile_visibility": public_profile.get("profile_visibility") or "public",
        "xp": 0,
        "level": 1,
        "coins": 0,
    }


def current_user(
    payload: dict[str, Any] = Depends(bearer_payload),
    conn: Connection = Depends(get_db),
) -> dict[str, Any]:
    discord_id = payload.get("discord_id")
    member = find_member(conn, discord_id)
    profile = find_public_profile(conn, discord_id)
    return auth_user_from_sources(payload, member, profile)


def require_dashboard(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    if not (user.get("is_admin") or user.get("is_moderator") or user.get("can_access_dashboard")):
        raise HTTPException(status_code=403, detail="Dashboard access required")
    return user


def require_admin(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def verify_bot_key(x_bot_api_key: str | None = Header(None)) -> None:
    expected = env("BOT_API_KEY")
    if not expected or not x_bot_api_key or not secrets.compare_digest(expected, x_bot_api_key):
        raise HTTPException(status_code=403, detail="Invalid bot API key")


def ensure_guild(conn: Connection, guild_id: Any, guild_name: str = "STG Discord") -> None:
    guild = to_bigint(guild_id)
    if guild is None:
        return
    conn.execute(
        text(
            """
            INSERT INTO public.discord_guilds (guild_id, guild_name, updated_at, last_sync_at)
            VALUES (:guild_id, :guild_name, now(), now())
            ON CONFLICT (guild_id) DO UPDATE SET updated_at = now()
            """
        ),
        {"guild_id": guild, "guild_name": guild_name or "STG Discord"},
    )


def upsert_member(conn: Connection, data: dict[str, Any]) -> dict[str, Any]:
    guild_id = to_bigint(data.get("guild_id") or GUILD_ID)
    discord_id = to_bigint(data.get("discord_id") or data.get("id"))
    if guild_id is None or discord_id is None:
        raise HTTPException(status_code=422, detail="guild_id and discord_id are required")

    ensure_guild(conn, guild_id)
    role_ids = data.get("role_ids") or data.get("roles") or []
    permissions = calculate_permissions(role_ids)
    display_name = data.get("display_name") or data.get("global_name") or data.get("username") or data.get("discord_username")
    conn.execute(
        text(
            """
            INSERT INTO public.discord_members (
              guild_id, discord_id, username, discord_username, global_name,
              display_name, nick, avatar_url, joined_at, role_ids, roles_json,
              is_bot, status, is_admin, is_moderator, can_access_dashboard,
              is_content_creator, last_discord_sync_at, updated_at
            )
            VALUES (
              :guild_id, :discord_id, :username, :discord_username, :global_name,
              :display_name, :nick, :avatar_url, :joined_at,
              CAST(:role_ids AS jsonb), CAST(:roles_json AS jsonb),
              :is_bot, :status, :is_admin, :is_moderator, :can_access_dashboard,
              :is_content_creator, now(), now()
            )
            ON CONFLICT (guild_id, discord_id) DO UPDATE SET
              username = EXCLUDED.username,
              discord_username = EXCLUDED.discord_username,
              global_name = EXCLUDED.global_name,
              display_name = EXCLUDED.display_name,
              nick = EXCLUDED.nick,
              avatar_url = EXCLUDED.avatar_url,
              joined_at = EXCLUDED.joined_at,
              role_ids = EXCLUDED.role_ids,
              roles_json = EXCLUDED.roles_json,
              is_bot = EXCLUDED.is_bot,
              status = EXCLUDED.status,
              is_admin = EXCLUDED.is_admin,
              is_moderator = EXCLUDED.is_moderator,
              can_access_dashboard = EXCLUDED.can_access_dashboard,
              is_content_creator = EXCLUDED.is_content_creator,
              last_discord_sync_at = now(),
              updated_at = now()
            """
        ),
        {
            "guild_id": guild_id,
            "discord_id": discord_id,
            "username": data.get("username") or data.get("discord_username"),
            "discord_username": data.get("discord_username") or data.get("username"),
            "global_name": data.get("global_name"),
            "display_name": display_name,
            "nick": data.get("nick"),
            "avatar_url": data.get("avatar_url"),
            "joined_at": data.get("joined_at"),
            "role_ids": json_param(role_ids if isinstance(role_ids, list) else []),
            "roles_json": json_param(data.get("roles_json") or {}),
            "is_bot": bool(data.get("is_bot", False)),
            "status": data.get("status"),
            **permissions,
        },
    )
    return find_member(conn, discord_id) or {}


def site_items(conn: Connection, content_type: str, limit: int = 100) -> list[dict[str, Any]]:
    try:
        rows = fetch_all(
            conn,
            """
            SELECT item_id, payload, created_at, updated_at
            FROM public.site_content_items
            WHERE content_type = :content_type
            ORDER BY priority DESC, created_at DESC
            LIMIT :limit
            """,
            {"content_type": content_type, "limit": limit},
        )
    except SQLAlchemyError:
        return []
    items = []
    for row in rows:
        payload = row.get("payload") or {}
        if isinstance(payload, str):
            payload = json.loads(payload)
        payload.setdefault("id", row.get("item_id"))
        payload.setdefault("createdAt", row.get("created_at"))
        payload.setdefault("updatedAt", row.get("updated_at"))
        items.append(payload)
    return items


def save_site_item(conn: Connection, content_type: str, item_id: str | None, payload: dict[str, Any]) -> dict[str, Any]:
    saved_id = item_id or str(payload.get("id") or uuid.uuid4())
    payload = {**payload, "id": saved_id}
    is_active = bool(payload.get("isActive", payload.get("is_active", True)))
    is_featured = bool(payload.get("isFeatured", payload.get("is_featured", False)))
    priority = int(payload.get("priority") or payload.get("position") or 0)
    row = fetch_one(
        conn,
        """
        INSERT INTO public.site_content_items (
          content_type, item_id, payload, is_active, is_featured, priority, updated_at
        )
        VALUES (
          :content_type, :item_id, CAST(:payload AS jsonb),
          :is_active, :is_featured, :priority, now()
        )
        ON CONFLICT (content_type, item_id) DO UPDATE SET
          payload = EXCLUDED.payload,
          is_active = EXCLUDED.is_active,
          is_featured = EXCLUDED.is_featured,
          priority = EXCLUDED.priority,
          updated_at = now()
        RETURNING item_id, payload, created_at, updated_at
        """,
        {
            "content_type": content_type,
            "item_id": saved_id,
            "payload": json_param(payload),
            "is_active": is_active,
            "is_featured": is_featured,
            "priority": priority,
        },
    )
    result = row.get("payload", payload) if row else payload
    if isinstance(result, str):
        result = json.loads(result)
    result.setdefault("id", saved_id)
    return result


def delete_site_item(conn: Connection, content_type: str, item_id: str) -> None:
    conn.execute(
        text("DELETE FROM public.site_content_items WHERE content_type = :content_type AND item_id = :item_id"),
        {"content_type": content_type, "item_id": item_id},
    )


def get_setting(conn: Connection, key: str, fallback: dict[str, Any]) -> dict[str, Any]:
    try:
        row = fetch_one(conn, "SELECT payload FROM public.site_settings WHERE key = :key", {"key": key})
    except SQLAlchemyError:
        return fallback
    payload = row.get("payload") if row else None
    return payload if isinstance(payload, dict) else fallback


def save_setting(conn: Connection, key: str, payload: dict[str, Any]) -> dict[str, Any]:
    row = fetch_one(
        conn,
        """
        INSERT INTO public.site_settings (key, payload, updated_at)
        VALUES (:key, CAST(:payload AS jsonb), now())
        ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()
        RETURNING payload
        """,
        {"key": key, "payload": json_param(payload)},
    )
    return row.get("payload", payload) if row else payload


@router.get("/")
def root() -> dict[str, Any]:
    return {"service": "STG Core API", "version": API_VERSION, "docs": "/api/docs"}


@router.get("/health")
def health(conn: Connection = Depends(get_db)) -> dict[str, Any]:
    try:
        scalar(conn, "SELECT 1")
        database = "online"
    except Exception:
        database = "offline"
    return {
        "status": "online",
        "service": "STG Core API",
        "version": API_VERSION,
        "database": database,
        "environment": env("ENVIRONMENT", "production"),
    }


@router.get("/status")
def status(conn: Connection = Depends(get_db)) -> dict[str, Any]:
    return health(conn)


@router.get("/auth/discord/login")
def discord_login(request: Request) -> RedirectResponse:
    client_id = env("DISCORD_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=503, detail="DISCORD_CLIENT_ID is not configured")
    state = secrets.token_urlsafe(32)
    redirect_uri = env("DISCORD_REDIRECT_URI") or f"{request_origin(request)}/api/auth/discord/callback"
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "identify email guilds.members.read",
        "state": state,
    }
    response = RedirectResponse(f"https://discord.com/oauth2/authorize?{urlencode(params)}")
    response.set_cookie(
        OAUTH_STATE_COOKIE,
        state,
        max_age=600,
        httponly=True,
        secure=request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https",
        samesite="lax",
        path="/",
    )
    return response


@router.get("/auth/discord/callback")
def discord_callback(
    request: Request,
    code: str = Query(...),
    state: str | None = Query(None),
    conn: Connection = Depends(get_db),
) -> RedirectResponse:
    expected_state = request.cookies.get(OAUTH_STATE_COOKIE)
    frontend_url = env("FRONTEND_URL", FRONTEND_URL).rstrip("/")
    if expected_state and state and not secrets.compare_digest(expected_state, state):
        return RedirectResponse(f"{frontend_url}/auth/callback?error=invalid_oauth_state")

    client_id = env("DISCORD_CLIENT_ID")
    client_secret = env("DISCORD_CLIENT_SECRET")
    redirect_uri = env("DISCORD_REDIRECT_URI") or f"{request_origin(request)}/api/auth/discord/callback"
    if not client_id or not client_secret:
        raise HTTPException(status_code=503, detail="Discord OAuth is not configured")

    token_response = requests.post(
        f"{DISCORD_API_BASE}/oauth2/token",
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )
    if token_response.status_code >= 400:
        return RedirectResponse(f"{frontend_url}/auth/callback?error=discord_token_exchange_failed")

    discord_token = token_response.json().get("access_token")
    user_response = requests.get(
        f"{DISCORD_API_BASE}/users/@me",
        headers={"Authorization": f"Bearer {discord_token}"},
        timeout=15,
    )
    if user_response.status_code >= 400:
        return RedirectResponse(f"{frontend_url}/auth/callback?error=discord_user_fetch_failed")

    discord_user = user_response.json()
    role_ids: list[str] = []
    nick = None
    joined_at = None
    if GUILD_ID:
        member_response = requests.get(
            f"{DISCORD_API_BASE}/users/@me/guilds/{GUILD_ID}/member",
            headers={"Authorization": f"Bearer {discord_token}"},
            timeout=15,
        )
        if member_response.ok:
            member_data = member_response.json()
            role_ids = [str(item) for item in member_data.get("roles", [])]
            nick = member_data.get("nick")
            joined_at = member_data.get("joined_at")

    avatar_url = discord_avatar_url(discord_user)
    member = upsert_member(
        conn,
        {
            "guild_id": GUILD_ID,
            "discord_id": discord_user.get("id"),
            "username": discord_user.get("username"),
            "discord_username": discord_user.get("username"),
            "global_name": discord_user.get("global_name"),
            "display_name": nick or discord_user.get("global_name") or discord_user.get("username"),
            "nick": nick,
            "avatar_url": avatar_url,
            "joined_at": joined_at,
            "role_ids": role_ids,
            "roles_json": {},
            "is_bot": False,
            "status": "online",
        },
    )
    profile = find_public_profile(conn, discord_user.get("id"))
    permissions = calculate_permissions(role_ids)
    clan_tag = extract_clan_tag(nick, discord_user.get("global_name"), discord_user.get("username"))
    claims = {
        "discord_id": str(discord_user.get("id")),
        "username": discord_user.get("username"),
        "discord_username": discord_user.get("username"),
        "display_name": member.get("display_name"),
        "global_name": discord_user.get("global_name"),
        "email": discord_user.get("email"),
        "avatar_url": avatar_url,
        "role_ids": role_ids,
        "roles": role_ids,
        "clan_tag": clan_tag,
        **permissions,
    }
    user = auth_user_from_sources(claims, member, profile)
    token = create_access_token({**claims, "app_role": user["role"]})
    response = RedirectResponse(f"{frontend_url}/auth/callback?token={token}")
    response.delete_cookie(OAUTH_STATE_COOKIE, path="/")
    return response


@router.get("/auth/me")
def auth_me(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    return user


@router.post("/auth/logout")
def auth_logout() -> dict[str, Any]:
    return {"success": True}


@router.get("/public/overview")
def public_overview(conn: Connection = Depends(get_db)) -> dict[str, Any]:
    ranking = public_ranking(limit=5, conn=conn).get("ranking", [])
    guild = fetch_one(
        conn,
        "SELECT * FROM public.discord_guilds ORDER BY updated_at DESC NULLS LAST LIMIT 1",
    )
    return {
        "api": "online",
        "project": "STG | Supremo Tribunal Gamer",
        "guild_id": str((guild or {}).get("guild_id") or GUILD_ID or ""),
        "guild_name": (guild or {}).get("guild_name") or "",
        "users_total": safe_count(conn, "discord_members", "is_bot = false"),
        "products_total": safe_count(conn, "store_items", "is_active = true"),
        "tournaments_total": safe_count(conn, "tournament_items", "is_active = true"),
        "punishments_total": 0,
        "ranking_top": ranking,
        "last_sync": now_utc().isoformat(),
    }


@router.get("/public/stats")
def public_stats(conn: Connection = Depends(get_db)) -> dict[str, Any]:
    today = now_utc().date().isoformat()
    return {
        "users_active_today": safe_count(conn, "discord_members", f"updated_at::date = DATE '{today}'"),
        "tournaments_created_today": safe_count(conn, "tournament_items", f"created_at::date = DATE '{today}'"),
        "transactions_today": 0,
        "xp_distributed_today": 0,
    }


@router.get("/public/ranking")
def public_ranking(limit: int = Query(20, ge=1, le=100), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    custom = site_items(conn, "ranking", limit)
    if custom:
        return {"ranking": custom}
    rows = fetch_all(
        conn,
        """
        SELECT
          discord_id,
          COALESCE(display_name, global_name, username, discord_username, 'Operador') AS discord_username,
          COALESCE(username, discord_username, display_name, 'Operador') AS username,
          0 AS xp,
          1 AS level,
          0 AS coins,
          row_number() OVER (ORDER BY updated_at DESC NULLS LAST, id ASC) AS position
        FROM public.discord_members
        WHERE COALESCE(is_bot, false) = false
        ORDER BY updated_at DESC NULLS LAST, id ASC
        LIMIT :limit
        """,
        {"limit": limit},
    )
    return {"ranking": rows}


@router.get("/public/punishments")
def public_punishments() -> dict[str, Any]:
    return {"punishments": []}


@router.get("/public/products")
def public_products(conn: Connection = Depends(get_db)) -> dict[str, Any]:
    try:
        products = fetch_all(
            conn,
            """
            SELECT
              id AS product_id,
              id,
              name,
              description,
              category,
              image_url,
              price_coins AS price,
              price_coins,
              price_brl AS price_real,
              sale_price_coins,
              sale_price_brl,
              discount_percent,
              stock,
              is_active,
              is_featured
            FROM public.store_items
            WHERE is_active = true
            ORDER BY is_featured DESC, created_at DESC
            """,
        )
    except SQLAlchemyError:
        products = []
    return {"products": products}


@router.get("/public/news")
def public_news(conn: Connection = Depends(get_db)) -> dict[str, Any]:
    return {"news": site_items(conn, "news", 100)}


@router.get("/public/home")
def public_home(conn: Connection = Depends(get_db)) -> dict[str, Any]:
    return {"home": site_items(conn, "home", 20)}


@router.get("/public/discord/status")
def public_discord_status(conn: Connection = Depends(get_db)) -> dict[str, Any]:
    status_row = fetch_one(
        conn,
        "SELECT * FROM public.discord_bot_status ORDER BY created_at DESC LIMIT 1",
    )
    guild = fetch_one(
        conn,
        "SELECT * FROM public.discord_guilds ORDER BY updated_at DESC NULLS LAST LIMIT 1",
    )
    online = bool(status_row and str(status_row.get("status", "")).lower() in {"online", "ready", "connected"})
    return {
        "bot_online": online,
        "bot_latency_ms": (status_row or {}).get("latency_ms", 0),
        "uptime_seconds": (status_row or {}).get("uptime_seconds", 0),
        "member_count": (guild or {}).get("member_count", 0),
        "online_count": (guild or {}).get("online_members", 0),
        "bots_count": (guild or {}).get("bot_members", 0),
        "roles_count": (guild or {}).get("roles_count", 0),
        "channels_count": (guild or {}).get("channels_total", 0),
        "text_channels_count": (guild or {}).get("text_channels", 0),
        "voice_channels_count": (guild or {}).get("voice_channels", 0),
        "last_sync": (status_row or guild or {}).get("last_sync_at"),
        "guild": {
            "id": (guild or {}).get("guild_id"),
            "name": (guild or {}).get("guild_name"),
            "icon_url": (guild or {}).get("icon_url"),
        },
    }


@router.get("/admin/discord/status")
def admin_discord_status(_: dict[str, Any] = Depends(require_dashboard), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    return public_discord_status(conn)


@router.get("/admin/discord/metrics")
def admin_discord_metrics(
    _: dict[str, Any] = Depends(require_dashboard),
    conn: Connection = Depends(get_db),
    limit: int = Query(10, ge=1, le=100),
) -> dict[str, Any]:
    rows = fetch_all(
        conn,
        """
        SELECT id, guild_id, metrics_json, last_sync_at, created_at
        FROM public.discord_metrics
        ORDER BY created_at DESC
        LIMIT :limit
        """,
        {"limit": limit},
    )
    return {"metrics": rows}


@router.get("/admin/discord/guild")
def admin_discord_guild(_: dict[str, Any] = Depends(require_dashboard), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    guild = fetch_one(conn, "SELECT * FROM public.discord_guilds ORDER BY updated_at DESC NULLS LAST LIMIT 1")
    if not guild:
        raise HTTPException(status_code=404, detail="Guild not found")
    return guild


@router.get("/admin/discord/members")
def admin_discord_members(
    _: dict[str, Any] = Depends(require_dashboard),
    conn: Connection = Depends(get_db),
    is_admin: bool | None = Query(None),
    is_moderator: bool | None = Query(None),
    is_content_creator: bool | None = Query(None),
    is_bot: bool | None = Query(None),
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
) -> list[dict[str, Any]]:
    conditions = []
    params: dict[str, Any] = {"limit": limit, "offset": offset}
    if GUILD_ID:
        conditions.append("guild_id = :guild_id")
        params["guild_id"] = to_bigint(GUILD_ID)
    for key, value in {
        "is_admin": is_admin,
        "is_moderator": is_moderator,
        "is_content_creator": is_content_creator,
        "is_bot": is_bot,
    }.items():
        if value is not None:
            conditions.append(f"{key} = :{key}")
            params[key] = value
    where = "WHERE " + " AND ".join(conditions) if conditions else ""
    return fetch_all(
        conn,
        f"""
        SELECT * FROM public.discord_members
        {where}
        ORDER BY updated_at DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        params,
    )


@router.get("/admin/discord/members/{discord_id}")
def admin_discord_member(
    discord_id: str,
    _: dict[str, Any] = Depends(require_dashboard),
    conn: Connection = Depends(get_db),
) -> dict[str, Any]:
    member = find_member(conn, discord_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member


@router.get("/admin/discord/roles")
def admin_discord_roles(
    _: dict[str, Any] = Depends(require_dashboard),
    conn: Connection = Depends(get_db),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
) -> list[dict[str, Any]]:
    return fetch_all(
        conn,
        """
        SELECT * FROM public.discord_roles
        ORDER BY position DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        {"limit": limit, "offset": offset},
    )


@router.get("/admin/discord/roles/{role_id}")
def admin_discord_role(
    role_id: str,
    _: dict[str, Any] = Depends(require_dashboard),
    conn: Connection = Depends(get_db),
) -> dict[str, Any]:
    role = fetch_one(conn, "SELECT * FROM public.discord_roles WHERE role_id = :role_id LIMIT 1", {"role_id": to_bigint(role_id)})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role


@router.get("/admin/discord/channels")
def admin_discord_channels(
    _: dict[str, Any] = Depends(require_dashboard),
    conn: Connection = Depends(get_db),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
) -> list[dict[str, Any]]:
    return fetch_all(
        conn,
        """
        SELECT * FROM public.discord_channels
        ORDER BY position ASC NULLS LAST
        LIMIT :limit OFFSET :offset
        """,
        {"limit": limit, "offset": offset},
    )


@router.get("/admin/discord/channels/{channel_id}")
def admin_discord_channel(
    channel_id: str,
    _: dict[str, Any] = Depends(require_dashboard),
    conn: Connection = Depends(get_db),
) -> dict[str, Any]:
    channel = fetch_one(
        conn,
        "SELECT * FROM public.discord_channels WHERE channel_id = :channel_id LIMIT 1",
        {"channel_id": to_bigint(channel_id)},
    )
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    return channel


@router.get("/admin/discord/events")
def admin_discord_events(
    _: dict[str, Any] = Depends(require_dashboard),
    conn: Connection = Depends(get_db),
    event_type: str | None = Query(None),
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
) -> dict[str, Any]:
    params: dict[str, Any] = {"limit": limit, "offset": offset}
    where = ""
    if event_type:
        where = "WHERE event_type = :event_type"
        params["event_type"] = event_type
    events = fetch_all(
        conn,
        f"""
        SELECT * FROM public.discord_events
        {where}
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
        """,
        params,
    )
    return {"events": events}


@router.get("/admin/discord/stats")
def admin_discord_stats(_: dict[str, Any] = Depends(require_dashboard), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    guild = fetch_one(conn, "SELECT * FROM public.discord_guilds ORDER BY updated_at DESC NULLS LAST LIMIT 1")
    if not guild:
        return {"guild_found": False, "stats": {}}
    return {
        "guild_found": True,
        "stats": {
            "guild_name": guild.get("guild_name"),
            "total_members": safe_count(conn, "discord_members", "is_bot = false"),
            "admin_count": safe_count(conn, "discord_members", "is_admin = true"),
            "moderator_count": safe_count(conn, "discord_members", "is_moderator = true"),
            "total_roles": safe_count(conn, "discord_roles"),
            "total_channels": safe_count(conn, "discord_channels"),
            "last_sync_at": guild.get("last_sync_at"),
        },
    }


@router.get("/admin/members")
def admin_members_alias(
    user: dict[str, Any] = Depends(require_dashboard),
    conn: Connection = Depends(get_db),
    limit: int = Query(200, ge=1, le=1000),
) -> dict[str, Any]:
    members = admin_discord_members(
        user,
        conn,
        is_admin=None,
        is_moderator=None,
        is_content_creator=None,
        is_bot=None,
        limit=limit,
        offset=0,
    )
    return {"members": members}


@router.post("/admin/members")
def admin_create_member(
    payload: dict[str, Any],
    _: dict[str, Any] = Depends(require_admin),
    conn: Connection = Depends(get_db),
) -> dict[str, Any]:
    return upsert_member(conn, {**payload, "guild_id": payload.get("guild_id") or GUILD_ID})


@router.put("/admin/members/{member_id}")
def admin_update_member(
    member_id: str,
    payload: dict[str, Any],
    _: dict[str, Any] = Depends(require_admin),
    conn: Connection = Depends(get_db),
) -> dict[str, Any]:
    member = find_member(conn, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    merged = {**member, **payload, "discord_id": member.get("discord_id"), "guild_id": member.get("guild_id")}
    return upsert_member(conn, merged)


@router.delete("/admin/members/{member_id}")
def admin_delete_member(
    member_id: str,
    _: dict[str, Any] = Depends(require_admin),
    conn: Connection = Depends(get_db),
) -> JSONResponse:
    conn.execute(text("DELETE FROM public.discord_members WHERE discord_id = :discord_id"), {"discord_id": to_bigint(member_id)})
    return JSONResponse(status_code=204, content=None)


@router.get("/admin/settings")
def admin_get_settings(_: dict[str, Any] = Depends(require_dashboard), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    fallback = {
        "admin_role_ids": split_env("ADMIN_ROLE_IDS"),
        "moderator_role_ids": split_env("MODERATOR_ROLE_IDS"),
        "dashboard_role_ids": split_env("DASHBOARD_ALLOWED_ROLE_IDS"),
        "options": {"source": "vercel-env"},
    }
    return get_setting(conn, "admin_settings", fallback)


@router.put("/admin/settings")
def admin_put_settings(
    payload: dict[str, Any],
    _: dict[str, Any] = Depends(require_admin),
    conn: Connection = Depends(get_db),
) -> dict[str, Any]:
    return save_setting(conn, "admin_settings", payload)


@router.get("/admin/moderation/config")
def admin_get_moderation(_: dict[str, Any] = Depends(require_dashboard), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    return get_setting(conn, "moderation_config", {})


@router.put("/admin/moderation/config")
def admin_put_moderation(
    payload: dict[str, Any],
    _: dict[str, Any] = Depends(require_admin),
    conn: Connection = Depends(get_db),
) -> dict[str, Any]:
    return save_setting(conn, "moderation_config", payload)


@router.post("/admin/news")
def admin_create_news(payload: dict[str, Any], _: dict[str, Any] = Depends(require_dashboard), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    return save_site_item(conn, "news", None, payload)


@router.put("/admin/news/{item_id}")
def admin_update_news(item_id: str, payload: dict[str, Any], _: dict[str, Any] = Depends(require_dashboard), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    return save_site_item(conn, "news", item_id, payload)


@router.delete("/admin/news/{item_id}")
def admin_delete_news(item_id: str, _: dict[str, Any] = Depends(require_dashboard), conn: Connection = Depends(get_db)) -> JSONResponse:
    delete_site_item(conn, "news", item_id)
    return JSONResponse(status_code=204, content=None)


@router.post("/admin/home")
def admin_create_home(payload: dict[str, Any], _: dict[str, Any] = Depends(require_dashboard), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    return save_site_item(conn, "home", None, payload)


@router.put("/admin/home/{item_id}")
def admin_update_home(item_id: str, payload: dict[str, Any], _: dict[str, Any] = Depends(require_dashboard), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    return save_site_item(conn, "home", item_id, payload)


@router.delete("/admin/home/{item_id}")
def admin_delete_home(item_id: str, _: dict[str, Any] = Depends(require_dashboard), conn: Connection = Depends(get_db)) -> JSONResponse:
    delete_site_item(conn, "home", item_id)
    return JSONResponse(status_code=204, content=None)


@router.post("/admin/ranking")
def admin_create_ranking(payload: dict[str, Any], _: dict[str, Any] = Depends(require_dashboard), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    return save_site_item(conn, "ranking", None, payload)


@router.put("/admin/ranking/{item_id}")
def admin_update_ranking(item_id: str, payload: dict[str, Any], _: dict[str, Any] = Depends(require_dashboard), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    return save_site_item(conn, "ranking", item_id, payload)


@router.delete("/admin/ranking/{item_id}")
def admin_delete_ranking(item_id: str, _: dict[str, Any] = Depends(require_dashboard), conn: Connection = Depends(get_db)) -> JSONResponse:
    delete_site_item(conn, "ranking", item_id)
    return JSONResponse(status_code=204, content=None)


@router.get("/profile/me")
def get_my_profile(user: dict[str, Any] = Depends(current_user), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    discord_id = str(user.get("discord_id") or "")
    if not discord_id:
        raise HTTPException(status_code=401, detail="Discord identity missing")
    conn.execute(
        text(
            """
            INSERT INTO public.user_public_profiles (discord_id, public_name, public_avatar_url)
            VALUES (:discord_id, :public_name, :public_avatar_url)
            ON CONFLICT (discord_id) DO NOTHING
            """
        ),
        {
            "discord_id": discord_id,
            "public_name": user.get("display_name") or user.get("username"),
            "public_avatar_url": user.get("avatar_url"),
        },
    )
    profile = find_public_profile(conn, discord_id) or {}
    return profile


@router.put("/profile/me")
def update_my_profile(
    payload: dict[str, Any],
    user: dict[str, Any] = Depends(current_user),
    conn: Connection = Depends(get_db),
) -> dict[str, Any]:
    discord_id = str(user.get("discord_id") or "")
    allowed = {
        "public_name",
        "public_avatar_url",
        "public_banner_url",
        "bio",
        "public_email",
        "location_optional",
        "pronouns",
        "sexual_orientation",
        "sexual_orientation_visibility",
        "profile_visibility",
    }
    clean = {key: payload.get(key) for key in allowed}
    row = fetch_one(
        conn,
        """
        INSERT INTO public.user_public_profiles (
          discord_id, public_name, public_avatar_url, public_banner_url, bio,
          public_email, location_optional, pronouns, sexual_orientation,
          sexual_orientation_visibility, profile_visibility, updated_at
        )
        VALUES (
          :discord_id, :public_name, :public_avatar_url, :public_banner_url, :bio,
          :public_email, :location_optional, :pronouns, :sexual_orientation,
          COALESCE(:sexual_orientation_visibility, 'private'),
          COALESCE(:profile_visibility, 'public'),
          now()
        )
        ON CONFLICT (discord_id) DO UPDATE SET
          public_name = EXCLUDED.public_name,
          public_avatar_url = EXCLUDED.public_avatar_url,
          public_banner_url = EXCLUDED.public_banner_url,
          bio = EXCLUDED.bio,
          public_email = EXCLUDED.public_email,
          location_optional = EXCLUDED.location_optional,
          pronouns = EXCLUDED.pronouns,
          sexual_orientation = EXCLUDED.sexual_orientation,
          sexual_orientation_visibility = EXCLUDED.sexual_orientation_visibility,
          profile_visibility = EXCLUDED.profile_visibility,
          updated_at = now()
        RETURNING *
        """,
        {"discord_id": discord_id, **clean},
    )
    return row or {}


async def upload_profile_asset(request: Request, kind: str) -> dict[str, str]:
    supabase_url = env("SUPABASE_URL").rstrip("/")
    service_key = env("SUPABASE_SERVICE_ROLE_KEY")
    bucket = env("SUPABASE_STORAGE_BUCKET", "profile-images")
    if not supabase_url or not service_key:
        raise HTTPException(status_code=503, detail="Supabase Storage is not configured")
    form = await request.form()
    file = form.get("file")
    if not file or not hasattr(file, "read"):
        raise HTTPException(status_code=422, detail="file is required")
    content = await file.read()
    if len(content) > 4_000_000:
        raise HTTPException(status_code=413, detail="File too large for Vercel function payload")
    filename = getattr(file, "filename", "") or f"{kind}.png"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "png"
    if ext not in {"png", "jpg", "jpeg", "webp", "gif"}:
        raise HTTPException(status_code=422, detail="Unsupported image type")
    path = f"{kind}/{uuid.uuid4()}.{ext}"
    content_type = getattr(file, "content_type", None) or f"image/{ext}"
    response = requests.post(
        f"{supabase_url}/storage/v1/object/{bucket}/{path}",
        data=content,
        headers={
            "Authorization": f"Bearer {service_key}",
            "apikey": service_key,
            "Content-Type": content_type,
            "x-upsert": "true",
        },
        timeout=20,
    )
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Supabase Storage upload failed")
    return {"url": f"{supabase_url}/storage/v1/object/public/{bucket}/{path}"}


@router.post("/uploads/profile-image")
async def upload_profile_image(request: Request, _: dict[str, Any] = Depends(current_user)) -> dict[str, str]:
    return await upload_profile_asset(request, "avatars")


@router.post("/uploads/banner-image")
async def upload_banner_image(request: Request, _: dict[str, Any] = Depends(current_user)) -> dict[str, str]:
    return await upload_profile_asset(request, "banners")


@router.get("/bot/sync/config")
def bot_sync_config(_: None = Depends(verify_bot_key)) -> dict[str, Any]:
    return {
        "guild_id": GUILD_ID,
        "admin_role_ids": split_env("ADMIN_ROLE_IDS"),
        "moderator_role_ids": split_env("MODERATOR_ROLE_IDS"),
        "dashboard_allowed_role_ids": split_env("DASHBOARD_ALLOWED_ROLE_IDS"),
        "content_creator_role_ids": split_env("CONTENT_CREATOR_ROLE_IDS"),
    }


@router.post("/bot/sync/guild")
async def bot_sync_guild(request: Request, _: None = Depends(verify_bot_key), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    data = await request.json()
    guild_id = to_bigint(data.get("guild_id") or GUILD_ID)
    if guild_id is None:
        raise HTTPException(status_code=422, detail="guild_id is required")
    conn.execute(
        text(
            """
            INSERT INTO public.discord_guilds (
              guild_id, guild_name, icon_url, owner_id, member_count,
              human_members, bot_members, online_members, channels_total,
              text_channels, voice_channels, roles_count, emojis, boosts,
              premium_tier, latency_ms, uptime_seconds, last_sync_at, updated_at
            )
            VALUES (
              :guild_id, :guild_name, :icon_url, :owner_id, :member_count,
              :human_members, :bot_members, :online_members, :channels_total,
              :text_channels, :voice_channels, :roles_count, :emojis, :boosts,
              :premium_tier, :latency_ms, :uptime_seconds, now(), now()
            )
            ON CONFLICT (guild_id) DO UPDATE SET
              guild_name = EXCLUDED.guild_name,
              icon_url = EXCLUDED.icon_url,
              owner_id = EXCLUDED.owner_id,
              member_count = EXCLUDED.member_count,
              human_members = EXCLUDED.human_members,
              bot_members = EXCLUDED.bot_members,
              online_members = EXCLUDED.online_members,
              channels_total = EXCLUDED.channels_total,
              text_channels = EXCLUDED.text_channels,
              voice_channels = EXCLUDED.voice_channels,
              roles_count = EXCLUDED.roles_count,
              emojis = EXCLUDED.emojis,
              boosts = EXCLUDED.boosts,
              premium_tier = EXCLUDED.premium_tier,
              latency_ms = EXCLUDED.latency_ms,
              uptime_seconds = EXCLUDED.uptime_seconds,
              last_sync_at = now(),
              updated_at = now()
            """
        ),
        {
            "guild_id": guild_id,
            "guild_name": data.get("guild_name") or data.get("name") or "STG Discord",
            "icon_url": data.get("icon_url"),
            "owner_id": to_bigint(data.get("owner_id")),
            "member_count": data.get("member_count") or 0,
            "human_members": data.get("human_members") or 0,
            "bot_members": data.get("bot_members") or 0,
            "online_members": data.get("online_members") or 0,
            "channels_total": data.get("channels_total") or 0,
            "text_channels": data.get("text_channels") or 0,
            "voice_channels": data.get("voice_channels") or 0,
            "roles_count": data.get("roles_count") or 0,
            "emojis": data.get("emojis") or 0,
            "boosts": data.get("boosts") or 0,
            "premium_tier": data.get("premium_tier") or 0,
            "latency_ms": data.get("latency_ms"),
            "uptime_seconds": data.get("uptime_seconds"),
        },
    )
    return {"success": True, "message": "Guild synced successfully"}


@router.post("/bot/sync/member")
async def bot_sync_member(request: Request, _: None = Depends(verify_bot_key), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    data = await request.json()
    upsert_member(conn, data)
    return {"success": True, "message": "Member synced successfully"}


@router.post("/bot/sync/members")
async def bot_sync_members(request: Request, _: None = Depends(verify_bot_key), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    data = await request.json()
    guild_id = data.get("guild_id") or GUILD_ID
    members = data.get("members") or []
    for member in members:
        upsert_member(conn, {**member, "guild_id": guild_id})
    return {"success": True, "message": f"Synced {len(members)} members successfully"}


@router.post("/bot/sync/roles")
async def bot_sync_roles(request: Request, _: None = Depends(verify_bot_key), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    data = await request.json()
    guild_id = to_bigint(data.get("guild_id") or GUILD_ID)
    ensure_guild(conn, guild_id)
    roles = data.get("roles") or []
    for role in roles:
        conn.execute(
            text(
                """
                INSERT INTO public.discord_roles (
                  guild_id, role_id, name, color, position, permissions,
                  mentionable, last_sync_at, updated_at
                )
                VALUES (
                  :guild_id, :role_id, :name, :color, :position, :permissions,
                  :mentionable, now(), now()
                )
                ON CONFLICT (guild_id, role_id) DO UPDATE SET
                  name = EXCLUDED.name,
                  color = EXCLUDED.color,
                  position = EXCLUDED.position,
                  permissions = EXCLUDED.permissions,
                  mentionable = EXCLUDED.mentionable,
                  last_sync_at = now(),
                  updated_at = now()
                """
            ),
            {
                "guild_id": guild_id,
                "role_id": to_bigint(role.get("role_id") or role.get("id")),
                "name": role.get("name") or "Role",
                "color": role.get("color"),
                "position": role.get("position"),
                "permissions": to_bigint(role.get("permissions")),
                "mentionable": bool(role.get("mentionable", False)),
            },
        )
    return {"success": True, "message": f"Synced {len(roles)} roles successfully"}


@router.post("/bot/sync/channels")
async def bot_sync_channels(request: Request, _: None = Depends(verify_bot_key), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    data = await request.json()
    guild_id = to_bigint(data.get("guild_id") or GUILD_ID)
    ensure_guild(conn, guild_id)
    channels = data.get("channels") or []
    for channel in channels:
        conn.execute(
            text(
                """
                INSERT INTO public.discord_channels (
                  guild_id, channel_id, name, type, position, category_id,
                  nsfw, last_sync_at, updated_at
                )
                VALUES (
                  :guild_id, :channel_id, :name, :type, :position, :category_id,
                  :nsfw, now(), now()
                )
                ON CONFLICT (guild_id, channel_id) DO UPDATE SET
                  name = EXCLUDED.name,
                  type = EXCLUDED.type,
                  position = EXCLUDED.position,
                  category_id = EXCLUDED.category_id,
                  nsfw = EXCLUDED.nsfw,
                  last_sync_at = now(),
                  updated_at = now()
                """
            ),
            {
                "guild_id": guild_id,
                "channel_id": to_bigint(channel.get("channel_id") or channel.get("id")),
                "name": channel.get("name") or "channel",
                "type": channel.get("type"),
                "position": channel.get("position"),
                "category_id": to_bigint(channel.get("category_id")),
                "nsfw": bool(channel.get("nsfw", False)),
            },
        )
    return {"success": True, "message": f"Synced {len(channels)} channels successfully"}


@router.post("/bot/sync/status")
async def bot_sync_status(request: Request, _: None = Depends(verify_bot_key), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    data = await request.json()
    guild_id = to_bigint(data.get("guild_id") or GUILD_ID)
    ensure_guild(conn, guild_id)
    conn.execute(
        text(
            """
            INSERT INTO public.discord_bot_status (
              bot_id, bot_name, guild_id, status, latency_ms, uptime_seconds,
              guild_count, version, last_sync_at, updated_at
            )
            VALUES (
              :bot_id, :bot_name, :guild_id, :status, :latency_ms, :uptime_seconds,
              :guild_count, :version, now(), now()
            )
            """
        ),
        {
            "bot_id": to_bigint(data.get("bot_id") or 0) or 0,
            "bot_name": data.get("bot_name") or "STG Bot",
            "guild_id": guild_id,
            "status": data.get("status") or "online",
            "latency_ms": data.get("latency_ms"),
            "uptime_seconds": data.get("uptime_seconds"),
            "guild_count": data.get("guild_count"),
            "version": data.get("version"),
        },
    )
    return {"success": True, "message": "Bot status synced successfully"}


@router.post("/bot/sync/heartbeat")
async def bot_sync_heartbeat(request: Request, _: None = Depends(verify_bot_key), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    return await bot_sync_status(request, None, conn)


@router.post("/bot/sync/metrics")
async def bot_sync_metrics(request: Request, _: None = Depends(verify_bot_key), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    data = await request.json()
    guild_id = to_bigint(data.get("guild_id") or GUILD_ID)
    ensure_guild(conn, guild_id)
    conn.execute(
        text(
            """
            INSERT INTO public.discord_metrics (guild_id, metrics_json, last_sync_at)
            VALUES (:guild_id, CAST(:metrics_json AS jsonb), now())
            """
        ),
        {"guild_id": guild_id, "metrics_json": json_param(data.get("metrics_json") or data.get("metrics") or data)},
    )
    return {"success": True, "message": "Metrics synced successfully"}


@router.post("/bot/sync/events")
@router.post("/bot/sync/message-event")
@router.post("/bot/sync/voice")
async def bot_sync_event(request: Request, _: None = Depends(verify_bot_key), conn: Connection = Depends(get_db)) -> dict[str, Any]:
    data = await request.json()
    guild_id = to_bigint(data.get("guild_id") or GUILD_ID)
    ensure_guild(conn, guild_id)
    conn.execute(
        text(
            """
            INSERT INTO public.discord_events (
              guild_id, event_type, discord_id, channel_id, payload_json
            )
            VALUES (
              :guild_id, :event_type, :discord_id, :channel_id, CAST(:payload_json AS jsonb)
            )
            """
        ),
        {
            "guild_id": guild_id,
            "event_type": data.get("event_type") or "event",
            "discord_id": to_bigint(data.get("discord_id")),
            "channel_id": to_bigint(data.get("channel_id")),
            "payload_json": json_param(data.get("payload_json") or data),
        },
    )
    return {"success": True, "message": "Event synced successfully"}


@router.get("/bot/sync/data/{filename}")
def bot_sync_data(filename: str, _: None = Depends(verify_bot_key)) -> dict[str, Any]:
    return {"filename": filename, "data": {}}


@app.exception_handler(SQLAlchemyError)
def sqlalchemy_exception_handler(_: Request, exc: SQLAlchemyError) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Database error", "detail": str(exc)},
    )


app.include_router(router)
