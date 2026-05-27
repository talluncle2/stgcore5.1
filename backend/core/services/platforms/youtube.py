"""YouTube creator content integration."""
from datetime import datetime, timezone
from typing import Any
import aiohttp
from core.config import get_settings

settings = get_settings()

async def check_youtube_channel(channel: Any) -> dict:
    if not settings.YOUTUBE_API_KEY:
        return {"status": "not_configured", "items": [], "message": "YOUTUBE_API_KEY nao configurada"}

    channel_id = channel.channel_id
    if not channel_id:
        return {"status": "missing_channel_id", "items": []}

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
