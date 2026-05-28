"""Twitch creator content integration."""
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse
import aiohttp
from core.config import get_settings

settings = get_settings()
_token_cache: dict[str, str] = {}

async def get_twitch_token() -> str | None:
    if not settings.TWITCH_CLIENT_ID or not settings.TWITCH_CLIENT_SECRET:
        return None
    if _token_cache.get("access_token"):
        return _token_cache["access_token"]

    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://id.twitch.tv/oauth2/token",
            params={
                "client_id": settings.TWITCH_CLIENT_ID,
                "client_secret": settings.TWITCH_CLIENT_SECRET,
                "grant_type": "client_credentials",
            },
        ) as response:
            if response.status != 200:
                return None
            data = await response.json()
            _token_cache["access_token"] = data.get("access_token", "")
            return _token_cache["access_token"]

def extract_twitch_login(channel: Any) -> str | None:
    for value in (channel.handle, channel.channel_name):
        if value:
            return str(value).strip().lower().lstrip("@")

    raw_url = (channel.channel_url or "").strip()
    if raw_url:
        parsed = urlparse(raw_url if "://" in raw_url else f"https://{raw_url}")
        path_parts = [part for part in parsed.path.split("/") if part]
        if path_parts:
            return path_parts[0].strip().lower().lstrip("@")

    channel_id = (channel.channel_id or "").strip()
    if channel_id and not channel_id.isdigit():
        return channel_id.lower().lstrip("@")

    return None

async def fetch_twitch_channel_profile(channel: Any) -> dict:
    token = await get_twitch_token()
    if not token:
        return {"status": "not_configured", "message": "TWITCH_CLIENT_ID/SECRET nao configurados"}

    login = extract_twitch_login(channel)
    channel_id = (channel.channel_id or "").strip()
    if not login and not channel_id:
        return {"status": "missing_channel_reference"}

    headers = {
        "Client-ID": settings.TWITCH_CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }
    params = {"id": channel_id} if channel_id and channel_id.isdigit() and not login else {"login": login}

    async with aiohttp.ClientSession(headers=headers) as session:
        async with session.get("https://api.twitch.tv/helix/users", params=params) as response:
            if response.status != 200:
                return {"status": "error", "message": await response.text()}
            data = await response.json()

    users = data.get("data", [])
    if not users:
        return {"status": "not_found"}

    user = users[0]
    user_login = user.get("login") or login
    return {
        "status": "ok",
        "channel_id": user.get("id"),
        "channel_name": user.get("display_name") or user_login,
        "handle": user_login,
        "description": user.get("description"),
        "thumbnail_url": user.get("profile_image_url"),
        "view_count": int(user["view_count"]) if user.get("view_count") is not None else None,
        "channel_url": f"https://www.twitch.tv/{user_login}" if user_login else channel.channel_url,
        "metadata_json": {
            "offline_image_url": user.get("offline_image_url"),
            "broadcaster_type": user.get("broadcaster_type"),
            "created_at": user.get("created_at"),
            "raw": user,
        },
    }

def twitch_thumbnail_url(value: str | None) -> str | None:
    if not value:
        return value
    return (
        value.replace("{width}", "1280")
        .replace("{height}", "720")
        .replace("%{width}", "1280")
        .replace("%{height}", "720")
    )

async def check_twitch_channel(channel: Any) -> dict:
    token = await get_twitch_token()
    if not token:
        return {"status": "not_configured", "items": [], "message": "TWITCH_CLIENT_ID/SECRET nao configurados"}

    profile = await fetch_twitch_channel_profile(channel)
    if profile.get("status") != "ok":
        return {"status": profile.get("status"), "items": [], "message": profile.get("message")}

    login = profile.get("handle")
    channel_id = profile.get("channel_id")
    if not login and not channel_id:
        return {"status": "missing_channel_reference", "items": []}

    headers = {
        "Client-ID": settings.TWITCH_CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }
    items = []
    async with aiohttp.ClientSession(headers=headers) as session:
        stream_params = {"user_id": channel_id} if channel_id else {"user_login": login}
        async with session.get("https://api.twitch.tv/helix/streams", params=stream_params) as response:
            if response.status != 200:
                return {"status": "error", "items": [], "message": await response.text()}
            stream_data = await response.json()

        for stream in stream_data.get("data", []):
            stream_id = stream.get("id")
            started_at = stream.get("started_at")
            items.append({
                "platform": "twitch",
                "external_id": stream_id,
                "content_type": "live",
                "title": stream.get("title"),
                "thumbnail_url": twitch_thumbnail_url(stream.get("thumbnail_url")),
                "content_url": f"https://www.twitch.tv/{stream.get('user_login') or login}",
                "published_at": datetime.fromisoformat(started_at.replace("Z", "+00:00")) if started_at else datetime.now(timezone.utc),
                "started_at": datetime.fromisoformat(started_at.replace("Z", "+00:00")) if started_at else datetime.now(timezone.utc),
                "is_live": True,
                "raw_json": stream,
            })

        if channel_id:
            async with session.get(
                "https://api.twitch.tv/helix/videos",
                params={"user_id": channel_id, "first": "8", "sort": "time", "type": "all"},
            ) as response:
                if response.status == 200:
                    videos_data = await response.json()
                    for video in videos_data.get("data", []):
                        video_id = video.get("id")
                        created_at = video.get("created_at") or video.get("published_at")
                        items.append({
                            "platform": "twitch",
                            "external_id": video_id,
                            "content_type": "video",
                            "title": video.get("title"),
                            "description": video.get("description"),
                            "thumbnail_url": twitch_thumbnail_url(video.get("thumbnail_url")),
                            "content_url": video.get("url"),
                            "embed_url": f"https://player.twitch.tv/?video={video_id}" if video_id else None,
                            "published_at": datetime.fromisoformat(created_at.replace("Z", "+00:00")) if created_at else datetime.now(timezone.utc),
                            "is_live": False,
                            "raw_json": video,
                        })

    return {"status": "ok", "items": items}
