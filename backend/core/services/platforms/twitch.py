"""Twitch creator content integration."""
from datetime import datetime, timezone
from typing import Any
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

async def check_twitch_channel(channel: Any) -> dict:
    token = await get_twitch_token()
    if not token:
        return {"status": "not_configured", "items": [], "message": "TWITCH_CLIENT_ID/SECRET nao configurados"}

    login = channel.handle or channel.channel_name or channel.channel_id
    if not login:
        return {"status": "missing_handle", "items": []}

    headers = {
        "Client-ID": settings.TWITCH_CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }
    async with aiohttp.ClientSession(headers=headers) as session:
        async with session.get("https://api.twitch.tv/helix/streams", params={"user_login": login}) as response:
            if response.status != 200:
                return {"status": "error", "items": [], "message": await response.text()}
            data = await response.json()

    items = []
    for stream in data.get("data", []):
        stream_id = stream.get("id")
        started_at = stream.get("started_at")
        items.append({
            "platform": "twitch",
            "external_id": stream_id,
            "content_type": "live",
            "title": stream.get("title"),
            "thumbnail_url": stream.get("thumbnail_url", "").replace("{width}", "1280").replace("{height}", "720"),
            "content_url": f"https://www.twitch.tv/{stream.get('user_login') or login}",
            "published_at": datetime.fromisoformat(started_at.replace("Z", "+00:00")) if started_at else datetime.now(timezone.utc),
            "started_at": datetime.fromisoformat(started_at.replace("Z", "+00:00")) if started_at else datetime.now(timezone.utc),
            "is_live": True,
            "raw_json": stream,
        })

    return {"status": "ok", "items": items}
