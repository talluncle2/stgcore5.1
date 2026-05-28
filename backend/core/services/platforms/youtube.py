"""YouTube creator content integration."""
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse
import aiohttp
from core.config import get_settings

settings = get_settings()

def extract_youtube_channel_reference(channel: Any) -> dict:
    raw_url = (channel.channel_url or "").strip()
    channel_id = (channel.channel_id or "").strip()
    handle = (channel.handle or "").strip()

    if channel_id:
        return {"type": "id", "value": channel_id}
    if handle:
        return {"type": "handle", "value": handle if handle.startswith("@") else f"@{handle}"}
    if not raw_url:
        return {"type": "missing", "value": ""}

    parsed = urlparse(raw_url if "://" in raw_url else f"https://{raw_url}")
    path_parts = [part for part in parsed.path.split("/") if part]
    if not path_parts:
        return {"type": "missing", "value": ""}

    first = path_parts[0]
    if first == "channel" and len(path_parts) > 1:
        return {"type": "id", "value": path_parts[1]}
    if first.startswith("@"):
        return {"type": "handle", "value": first}
    if first == "user" and len(path_parts) > 1:
        return {"type": "username", "value": path_parts[1]}
    if first == "c" and len(path_parts) > 1:
        return {"type": "search", "value": path_parts[1]}
    return {"type": "search", "value": first}

def best_thumbnail(thumbnails: dict) -> str | None:
    for key in ("high", "medium", "default"):
        url = thumbnails.get(key, {}).get("url")
        if url:
            return url
    return None

async def fetch_youtube_channel_profile(channel: Any) -> dict:
    if not settings.YOUTUBE_API_KEY:
        return {"status": "not_configured", "message": "YOUTUBE_API_KEY nao configurada"}

    reference = extract_youtube_channel_reference(channel)
    if reference["type"] == "missing":
        return {"status": "missing_channel_reference"}

    params = {
        "key": settings.YOUTUBE_API_KEY,
        "part": "snippet,statistics,brandingSettings",
        "maxResults": "1",
    }
    if reference["type"] == "id":
        params["id"] = reference["value"]
    elif reference["type"] == "handle":
        params["forHandle"] = reference["value"]
    elif reference["type"] == "username":
        params["forUsername"] = reference["value"]
    else:
        params["id"] = await search_youtube_channel_id(reference["value"])
        if not params["id"]:
            return {"status": "not_found"}

    async with aiohttp.ClientSession() as session:
        async with session.get("https://www.googleapis.com/youtube/v3/channels", params=params) as response:
            if response.status != 200:
                return {"status": "error", "message": await response.text()}
            data = await response.json()

    items = data.get("items", [])
    if not items:
        return {"status": "not_found"}

    item = items[0]
    snippet = item.get("snippet", {})
    statistics = item.get("statistics", {})
    branding = item.get("brandingSettings", {}).get("channel", {})
    custom_url = snippet.get("customUrl")
    channel_id = item.get("id")
    return {
        "status": "ok",
        "channel_id": channel_id,
        "channel_name": snippet.get("title"),
        "handle": custom_url,
        "description": snippet.get("description") or branding.get("description"),
        "thumbnail_url": best_thumbnail(snippet.get("thumbnails", {})),
        "subscriber_count": int(statistics["subscriberCount"]) if statistics.get("subscriberCount") is not None else None,
        "video_count": int(statistics["videoCount"]) if statistics.get("videoCount") is not None else None,
        "view_count": int(statistics["viewCount"]) if statistics.get("viewCount") is not None else None,
        "channel_url": f"https://www.youtube.com/channel/{channel_id}" if channel_id else channel.channel_url,
        "metadata_json": {
            "published_at": snippet.get("publishedAt"),
            "country": snippet.get("country"),
            "custom_url": custom_url,
            "hidden_subscriber_count": statistics.get("hiddenSubscriberCount"),
            "raw": item,
        },
    }

async def search_youtube_channel_id(query: str) -> str | None:
    if not query:
        return None
    params = {
        "key": settings.YOUTUBE_API_KEY,
        "part": "snippet",
        "q": query.lstrip("@"),
        "type": "channel",
        "maxResults": "1",
    }
    async with aiohttp.ClientSession() as session:
        async with session.get("https://www.googleapis.com/youtube/v3/search", params=params) as response:
            if response.status != 200:
                return None
            data = await response.json()
    items = data.get("items", [])
    if not items:
        return None
    return items[0].get("id", {}).get("channelId")

async def check_youtube_channel(channel: Any) -> dict:
    if not settings.YOUTUBE_API_KEY:
        return {"status": "not_configured", "items": [], "message": "YOUTUBE_API_KEY nao configurada"}

    channel_id = channel.channel_id
    if not channel_id:
        profile = await fetch_youtube_channel_profile(channel)
        channel_id = profile.get("channel_id")
        if not channel_id:
            return {"status": "missing_channel_id", "items": [], "message": profile.get("message")}

    params = {
        "key": settings.YOUTUBE_API_KEY,
        "channelId": channel_id,
        "part": "snippet",
        "order": "date",
        "type": "video",
        "maxResults": "8",
    }

    async with aiohttp.ClientSession() as session:
        async with session.get("https://www.googleapis.com/youtube/v3/search", params=params) as response:
            if response.status != 200:
                return {"status": "error", "items": [], "message": await response.text()}
            data = await response.json()

    items = []
    for item in data.get("items", []):
        video_id = item.get("id", {}).get("videoId")
        snippet = item.get("snippet", {})
        if not video_id:
            continue
        published_at = snippet.get("publishedAt")
        items.append({
            "platform": "youtube",
            "external_id": video_id,
            "content_type": "video",
            "title": snippet.get("title"),
            "description": snippet.get("description"),
            "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url") or snippet.get("thumbnails", {}).get("default", {}).get("url"),
            "content_url": f"https://www.youtube.com/watch?v={video_id}",
            "embed_url": f"https://www.youtube.com/embed/{video_id}",
            "published_at": datetime.fromisoformat(published_at.replace("Z", "+00:00")) if published_at else datetime.now(timezone.utc),
            "is_live": False,
            "raw_json": item,
        })

    return {"status": "ok", "items": items}
