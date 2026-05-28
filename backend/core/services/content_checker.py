"""Creator live/video checker service."""
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from core.models import CreatorChannel, CreatorContent
from core.services.platforms.youtube import check_youtube_channel, fetch_youtube_channel_profile
from core.services.platforms.twitch import check_twitch_channel, fetch_twitch_channel_profile
from core.services.platforms.kick import check_kick_channel
from core.services.platforms.tiktok import check_tiktok_channel

CHECKERS = {
    "youtube": check_youtube_channel,
    "twitch": check_twitch_channel,
    "kick": check_kick_channel,
    "tiktok": check_tiktok_channel,
}

PROFILE_SYNCERS = {
    "youtube": fetch_youtube_channel_profile,
    "twitch": fetch_twitch_channel_profile,
}

PROFILE_FIELDS = (
    "channel_id",
    "channel_name",
    "handle",
    "description",
    "thumbnail_url",
    "subscriber_count",
    "video_count",
    "view_count",
    "channel_url",
)

def merge_platform_summary(summary: dict, platform: str, result: dict, saved_items: int) -> None:
    platform_summary = summary["platforms"].setdefault(
        platform,
        {"status": result.get("status"), "items": 0, "saved_items": 0},
    )
    platform_summary["status"] = result.get("status")
    platform_summary["message"] = result.get("message")
    platform_summary["items"] += len(result.get("items", []))
    platform_summary["saved_items"] += saved_items

async def sync_channel_public_profile(channel: CreatorChannel) -> dict:
    platform = str(channel.platform or "").lower()
    channel.platform = platform
    syncer = PROFILE_SYNCERS.get(platform)
    now = datetime.now(timezone.utc)

    if not syncer:
        result = {
            "status": "not_implemented",
            "message": f"Sincronizacao de perfil publico ainda nao implementada para {platform}.",
        }
        channel.metadata_json = {
            **(channel.metadata_json or {}),
            "profile_sync_status": result["status"],
            "profile_sync_message": result["message"],
            "profile_synced_at": now.isoformat(),
        }
        channel.updated_at = now
        return result

    result = await syncer(channel)
    if result.get("status") != "ok":
        channel.metadata_json = {
            **(channel.metadata_json or {}),
            "profile_sync_status": result.get("status"),
            "profile_sync_message": result.get("message"),
            "profile_synced_at": now.isoformat(),
        }
        channel.updated_at = now
        return result

    for key in PROFILE_FIELDS:
        value = result.get(key)
        if value is not None:
            setattr(channel, key, value)

    channel.metadata_json = {
        **(channel.metadata_json or {}),
        **(result.get("metadata_json") or {}),
        "profile_sync_status": "ok",
        "profile_sync_message": None,
        "profile_synced_at": now.isoformat(),
    }
    channel.updated_at = now
    return result

async def sync_creator_channel(db: Session, channel: CreatorChannel, sync_profile: bool = True) -> dict:
    platform = str(channel.platform or "").lower()
    channel.platform = platform

    if sync_profile:
        await sync_channel_public_profile(channel)

    checker = CHECKERS.get(platform)
    if not checker:
        result = {
            "status": "not_implemented",
            "items": [],
            "message": f"Monitoramento de conteudo ainda nao implementado para {platform}.",
        }
    else:
        result = await checker(channel)

    items = result.get("items", [])
    now = datetime.now(timezone.utc)
    saved_items = 0

    if channel.id is None:
        db.flush()

    for item in items:
        if not item.get("external_id"):
            continue
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
        saved_items += 1

    channel.metadata_json = {
        **(channel.metadata_json or {}),
        "content_sync_status": result.get("status"),
        "content_sync_message": result.get("message"),
        "content_synced_at": now.isoformat(),
    }
    channel.last_checked_at = now
    channel.updated_at = now
    return {**result, "saved_items": saved_items}

async def sync_creator_content(db: Session, creator) -> dict:
    summary = {"checked_channels": 0, "saved_items": 0, "platforms": {}}
    for channel in [item for item in getattr(creator, "channels", []) if item.is_active]:
        result = await sync_creator_channel(db, channel)
        summary["checked_channels"] += 1
        summary["saved_items"] += result.get("saved_items", 0)
        merge_platform_summary(summary, str(channel.platform).lower(), result, result.get("saved_items", 0))

    db.commit()
    return summary

async def check_creator_content(db: Session) -> dict:
    channels = db.query(CreatorChannel).filter(CreatorChannel.is_active == True).all()
    summary = {"checked_channels": 0, "saved_items": 0, "platforms": {}}

    for channel in channels:
        result = await sync_creator_channel(db, channel)
        saved_items = result.get("saved_items", 0)
        summary["saved_items"] += saved_items
        merge_platform_summary(summary, str(channel.platform).lower(), result, saved_items)
        summary["checked_channels"] += 1

    db.commit()
    return summary
