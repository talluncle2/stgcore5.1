"""Creator live/video checker service."""
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from core.models import CreatorChannel, CreatorContent
from core.services.platforms.youtube import check_youtube_channel, fetch_youtube_channel_profile
from core.services.platforms.twitch import check_twitch_channel
from core.services.platforms.kick import check_kick_channel
from core.services.platforms.tiktok import check_tiktok_channel

CHECKERS = {
    "youtube": check_youtube_channel,
    "twitch": check_twitch_channel,
    "kick": check_kick_channel,
    "tiktok": check_tiktok_channel,
}

async def check_creator_content(db: Session) -> dict:
    channels = db.query(CreatorChannel).filter(CreatorChannel.is_active == True).all()
    now = datetime.now(timezone.utc)
    summary = {"checked_channels": 0, "saved_items": 0, "platforms": {}}

    for channel in channels:
        platform = str(channel.platform).lower()
        checker = CHECKERS.get(platform)
        if not checker:
            summary["platforms"][platform] = {"status": "not_implemented", "items": 0}
            continue

        if platform == "youtube":
            profile = await fetch_youtube_channel_profile(channel)
            if profile.get("status") == "ok":
                for key in (
                    "channel_id",
                    "channel_name",
                    "handle",
                    "description",
                    "thumbnail_url",
                    "subscriber_count",
                    "video_count",
                    "view_count",
                    "channel_url",
                    "metadata_json",
                ):
                    value = profile.get(key)
                    if value is not None:
                        setattr(channel, key, value)
            else:
                channel.metadata_json = {
                    **(channel.metadata_json or {}),
                    "profile_sync_status": profile.get("status"),
                    "profile_sync_message": profile.get("message"),
                }

        result = await checker(channel)
        items = result.get("items", [])
        summary["platforms"][platform] = {
            "status": result.get("status"),
            "items": len(items),
            "message": result.get("message"),
        }

        for item in items:
            values = {
                "creator_id": channel.creator_id,
                "channel_id": channel.id,
                "platform": item["platform"],
                "external_id": item["external_id"],
                "content_type": item["content_type"],
                "title": item.get("title"),
                "description": item.get("description"),
                "thumbnail_url": item.get("thumbnail_url"),
                "content_url": item.get("content_url"),
                "embed_url": item.get("embed_url"),
                "published_at": item.get("published_at"),
                "started_at": item.get("started_at"),
                "ended_at": item.get("ended_at"),
                "is_live": item.get("is_live", False),
                "is_active": True,
                "raw_json": item.get("raw_json", {}),
                "updated_at": now,
            }
            stmt = insert(CreatorContent).values(**values).on_conflict_do_update(
                constraint="uq_creator_content_platform_external",
                set_={
                    "title": values["title"],
                    "description": values["description"],
                    "thumbnail_url": values["thumbnail_url"],
                    "content_url": values["content_url"],
                    "embed_url": values["embed_url"],
                    "published_at": values["published_at"],
                    "started_at": values["started_at"],
                    "ended_at": values["ended_at"],
                    "is_live": values["is_live"],
                    "is_active": True,
                    "raw_json": values["raw_json"],
                    "updated_at": now,
                },
            )
            db.execute(stmt)
            summary["saved_items"] += 1

        channel.last_checked_at = now
        channel.updated_at = now
        summary["checked_channels"] += 1

    db.commit()
    return summary
