"""Content creator routes."""
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse, urlunparse
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from core.config import get_settings
from core.database import get_db
from core.dependencies import require_admin, require_content_creator, require_dashboard_access
from core.models import ContentCreator, CreatorChannel, CreatorContent, DiscordMember
from core.schemas import AuthUser, ContentCreatorCreate, ContentCreatorUpdate, CreatorChannelCreate, CreatorChannelUpdate
from core.services.content_checker import check_creator_content, sync_channel_public_profile, sync_creator_channel, sync_creator_content

router = APIRouter(tags=["creators"])
settings = get_settings()

def normalize_channel_identifier(value: str | None) -> str:
    return str(value or "").strip().lower().lstrip("@")

def normalize_channel_url(value: str | None) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""
    try:
        parsed = urlparse(raw)
        netloc = parsed.netloc.lower().removeprefix("www.")
        path = parsed.path.rstrip("/")
        return urlunparse((parsed.scheme.lower(), netloc, path, "", "", "")).lower()
    except Exception:
        return raw.rstrip("/").lower()

def is_same_creator_channel(left: CreatorChannel, right: CreatorChannel) -> bool:
    if normalize_channel_identifier(left.platform) != normalize_channel_identifier(right.platform):
        return False

    pairs = (
        (normalize_channel_identifier(left.channel_id), normalize_channel_identifier(right.channel_id)),
        (normalize_channel_identifier(left.handle), normalize_channel_identifier(right.handle)),
        (normalize_channel_url(left.channel_url), normalize_channel_url(right.channel_url)),
    )
    return any(a and b and a == b for a, b in pairs)

def serialize_channel(channel: CreatorChannel) -> dict:
    return {
        "id": str(channel.id),
        "creator_id": str(channel.creator_id),
        "platform": channel.platform,
        "channel_id": channel.channel_id,
        "channel_url": channel.channel_url,
        "channel_name": channel.channel_name,
        "handle": channel.handle,
        "description": channel.description,
        "thumbnail_url": channel.thumbnail_url,
        "subscriber_count": channel.subscriber_count,
        "video_count": channel.video_count,
        "view_count": channel.view_count,
        "metadata_json": channel.metadata_json or {},
        "is_active": channel.is_active,
        "last_checked_at": channel.last_checked_at.isoformat() if channel.last_checked_at else None,
        "created_at": channel.created_at.isoformat() if channel.created_at else None,
        "updated_at": channel.updated_at.isoformat() if channel.updated_at else None,
    }

def serialize_content(content: CreatorContent, include_creator: bool = True) -> dict:
    data = {
        "id": str(content.id),
        "creator_id": str(content.creator_id),
        "channel_id": str(content.channel_id),
        "platform": content.platform,
        "external_id": content.external_id,
        "content_type": content.content_type,
        "title": content.title,
        "description": content.description,
        "thumbnail_url": content.thumbnail_url,
        "content_url": content.content_url,
        "embed_url": content.embed_url,
        "published_at": content.published_at.isoformat() if content.published_at else None,
        "started_at": content.started_at.isoformat() if content.started_at else None,
        "ended_at": content.ended_at.isoformat() if content.ended_at else None,
        "is_live": content.is_live,
        "is_active": content.is_active,
    }
    if include_creator and content.creator:
        data["creator"] = {
            "id": str(content.creator.id),
            "display_name": content.creator.display_name,
            "username": content.creator.username,
            "avatar_url": content.creator.avatar_url,
        }
    return data

def serialize_creator(creator: ContentCreator, include_content: bool = False) -> dict:
    data = {
        "id": str(creator.id),
        "discord_id": creator.discord_id,
        "guild_id": creator.guild_id,
        "display_name": creator.display_name,
        "username": creator.username,
        "avatar_url": creator.avatar_url,
        "bio": creator.bio,
        "is_active": creator.is_active,
        "is_featured": creator.is_featured,
        "sort_order": creator.sort_order,
        "created_at": creator.created_at.isoformat() if creator.created_at else None,
        "updated_at": creator.updated_at.isoformat() if creator.updated_at else None,
        "channels": [serialize_channel(channel) for channel in getattr(creator, "channels", []) if channel.is_active],
    }
    if include_content:
        data["latest_content"] = [
            serialize_content(content, include_creator=False)
            for content in sorted(
                [item for item in getattr(creator, "contents", []) if item.is_active],
                key=lambda item: item.published_at or item.created_at,
                reverse=True,
            )[:12]
        ]
    return data

def get_or_create_my_creator(current_user: AuthUser, db: Session) -> ContentCreator:
    discord_id = str(current_user.discord_id)
    creator = db.query(ContentCreator).options(joinedload(ContentCreator.channels)).filter(
        ContentCreator.discord_id == discord_id
    ).first()
    if creator:
        if not creator.is_active:
            creator.is_active = True
        creator.display_name = creator.display_name or current_user.display_name or current_user.global_name or current_user.username
        creator.username = creator.username or current_user.username or current_user.discord_username
        creator.avatar_url = creator.avatar_url or current_user.avatar_url or current_user.discord_avatar_url
        creator.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(creator)
        return creator

    creator = ContentCreator(
        discord_id=discord_id,
        guild_id=str(settings.GUILD_ID) if settings.GUILD_ID else None,
        display_name=current_user.display_name or current_user.global_name or current_user.username,
        username=current_user.username or current_user.discord_username,
        avatar_url=current_user.avatar_url or current_user.discord_avatar_url,
        is_active=True,
    )
    db.add(creator)
    db.commit()
    db.refresh(creator)
    return creator

def should_auto_sync_channel(channel: CreatorChannel) -> bool:
    if not channel.is_active:
        return False
    if not channel.last_checked_at:
        return True
    last_checked_at = channel.last_checked_at
    if last_checked_at.tzinfo is None:
        last_checked_at = last_checked_at.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) - last_checked_at > timedelta(minutes=30)

async def auto_sync_creator_channels(db: Session, creator: ContentCreator) -> None:
    for channel in creator.channels:
        if should_auto_sync_channel(channel):
            await sync_creator_channel(db, channel)
    db.commit()

@router.get("/creators")
async def get_creators(db: Session = Depends(get_db), limit: int = Query(50, ge=1, le=100)):
    creators = db.query(ContentCreator).options(joinedload(ContentCreator.channels)).filter(
        ContentCreator.is_active == True
    ).order_by(ContentCreator.is_featured.desc(), ContentCreator.sort_order.asc(), ContentCreator.created_at.desc()).limit(limit).all()
    return {"creators": [serialize_creator(creator) for creator in creators]}

@router.get("/creators/featured")
async def get_featured_creators(db: Session = Depends(get_db), limit: int = Query(12, ge=1, le=50)):
    creators = db.query(ContentCreator).options(joinedload(ContentCreator.channels)).filter(
        ContentCreator.is_active == True,
        ContentCreator.is_featured == True,
    ).order_by(ContentCreator.sort_order.asc(), ContentCreator.created_at.desc()).limit(limit).all()
    return {"creators": [serialize_creator(creator) for creator in creators]}

@router.get("/creators/live")
async def get_live_content(db: Session = Depends(get_db), limit: int = Query(12, ge=1, le=50)):
    content = db.query(CreatorContent).options(joinedload(CreatorContent.creator)).filter(
        CreatorContent.is_active == True,
        CreatorContent.is_live == True,
    ).order_by(desc(CreatorContent.started_at)).limit(limit).all()
    return {"content": [serialize_content(item) for item in content]}

@router.get("/creators/latest")
async def get_latest_creator_content(db: Session = Depends(get_db), limit: int = Query(12, ge=1, le=50)):
    content = db.query(CreatorContent).options(joinedload(CreatorContent.creator)).filter(
        CreatorContent.is_active == True
    ).order_by(desc(CreatorContent.published_at), desc(CreatorContent.created_at)).limit(limit).all()
    return {"content": [serialize_content(item) for item in content]}

@router.get("/creators/me")
async def get_my_creator(
    current_user: AuthUser = Depends(require_content_creator),
    db: Session = Depends(get_db),
):
    creator = get_or_create_my_creator(current_user, db)
    await auto_sync_creator_channels(db, creator)
    db.refresh(creator)
    return serialize_creator(creator, include_content=True)

@router.post("/creators/me/register")
async def register_my_creator(
    current_user: AuthUser = Depends(require_content_creator),
    db: Session = Depends(get_db),
):
    creator = get_or_create_my_creator(current_user, db)
    await auto_sync_creator_channels(db, creator)
    db.refresh(creator)
    return {"creator": serialize_creator(creator, include_content=True), "channels": [serialize_channel(channel) for channel in creator.channels]}

@router.post("/creators/me/sync")
async def sync_my_creator_profile(
    current_user: AuthUser = Depends(require_content_creator),
    db: Session = Depends(get_db),
):
    creator = get_or_create_my_creator(current_user, db)
    summary = await sync_creator_content(db, creator)
    db.refresh(creator)
    return {"success": True, "summary": summary, "creator": serialize_creator(creator, include_content=True)}

@router.post("/creators/me/channels")
async def add_my_creator_channel(
    payload: CreatorChannelCreate,
    current_user: AuthUser = Depends(require_content_creator),
    db: Session = Depends(get_db),
):
    creator = get_or_create_my_creator(current_user, db)
    channel = CreatorChannel(creator_id=creator.id, **payload.model_dump())
    await sync_channel_public_profile(channel)

    existing = next((item for item in creator.channels if is_same_creator_channel(item, channel)), None)
    if existing:
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(existing, key, value)
        existing.channel_id = channel.channel_id or existing.channel_id
        existing.channel_name = channel.channel_name or existing.channel_name
        existing.handle = channel.handle or existing.handle
        existing.description = channel.description or existing.description
        existing.thumbnail_url = channel.thumbnail_url or existing.thumbnail_url
        existing.subscriber_count = channel.subscriber_count if channel.subscriber_count is not None else existing.subscriber_count
        existing.video_count = channel.video_count if channel.video_count is not None else existing.video_count
        existing.view_count = channel.view_count if channel.view_count is not None else existing.view_count
        existing.metadata_json = channel.metadata_json or existing.metadata_json
        existing.last_checked_at = channel.last_checked_at or existing.last_checked_at
        existing.is_active = True
        existing.updated_at = datetime.now(timezone.utc)
        await sync_creator_channel(db, existing, sync_profile=False)
        db.commit()
        db.refresh(existing)
        return serialize_channel(existing)

    active_channel = next((item for item in creator.channels if item.is_active), None)
    if active_channel:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Creator account already registered. Edit or remove the current account before adding another.",
        )

    db.add(channel)
    db.flush()
    await sync_creator_channel(db, channel, sync_profile=False)
    db.commit()
    db.refresh(channel)
    return serialize_channel(channel)

@router.put("/creators/me/channels/{channel_id}")
async def update_my_creator_channel(
    channel_id: str,
    payload: CreatorChannelUpdate,
    current_user: AuthUser = Depends(require_content_creator),
    db: Session = Depends(get_db),
):
    creator = get_or_create_my_creator(current_user, db)
    channel = db.query(CreatorChannel).filter(
        CreatorChannel.id == channel_id,
        CreatorChannel.creator_id == creator.id,
    ).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(channel, key, value)
    await sync_channel_public_profile(channel)
    await sync_creator_channel(db, channel, sync_profile=False)
    channel.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(channel)
    return serialize_channel(channel)

@router.delete("/creators/me/channels/{channel_id}")
async def disable_my_creator_channel(
    channel_id: str,
    current_user: AuthUser = Depends(require_content_creator),
    db: Session = Depends(get_db),
):
    creator = get_or_create_my_creator(current_user, db)
    channel = db.query(CreatorChannel).filter(
        CreatorChannel.id == channel_id,
        CreatorChannel.creator_id == creator.id,
    ).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    channel.is_active = False
    channel.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"success": True}

@router.get("/creators/{creator_id}")
async def get_creator(creator_id: str, db: Session = Depends(get_db)):
    creator = db.query(ContentCreator).options(
        joinedload(ContentCreator.channels),
        joinedload(ContentCreator.contents),
    ).filter(ContentCreator.id == creator_id, ContentCreator.is_active == True).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    return serialize_creator(creator, include_content=True)

@router.get("/admin/creators")
async def admin_get_creators(current_user: AuthUser = Depends(require_dashboard_access), db: Session = Depends(get_db)):
    creators = db.query(ContentCreator).options(joinedload(ContentCreator.channels)).order_by(
        ContentCreator.is_active.desc(), ContentCreator.is_featured.desc(), ContentCreator.sort_order.asc()
    ).all()
    return {"creators": [serialize_creator(creator) for creator in creators], "can_manage": current_user.is_admin}

@router.post("/admin/creators")
async def admin_create_creator(payload: ContentCreatorCreate, current_user: AuthUser = Depends(require_admin), db: Session = Depends(get_db)):
    creator = ContentCreator(**payload.model_dump())
    db.add(creator)
    db.commit()
    db.refresh(creator)
    return serialize_creator(creator)

@router.put("/admin/creators/{creator_id}")
async def admin_update_creator(creator_id: str, payload: ContentCreatorUpdate, current_user: AuthUser = Depends(require_admin), db: Session = Depends(get_db)):
    creator = db.query(ContentCreator).filter(ContentCreator.id == creator_id).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(creator, key, value)
    creator.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(creator)
    return serialize_creator(creator)

@router.delete("/admin/creators/{creator_id}")
async def admin_disable_creator(creator_id: str, current_user: AuthUser = Depends(require_admin), db: Session = Depends(get_db)):
    creator = db.query(ContentCreator).filter(ContentCreator.id == creator_id).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    creator.is_active = False
    creator.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"success": True}

@router.post("/admin/creators/sync-from-discord")
async def admin_sync_creators_from_discord(current_user: AuthUser = Depends(require_admin), db: Session = Depends(get_db)):
    members = db.query(DiscordMember).filter(DiscordMember.is_content_creator == True).all()
    synced = 0
    for member in members:
        creator = db.query(ContentCreator).filter(ContentCreator.discord_id == str(member.discord_id)).first()
        if not creator:
            creator = ContentCreator(discord_id=str(member.discord_id), guild_id=str(member.guild_id))
            db.add(creator)
        creator.display_name = member.display_name or member.global_name or member.username or member.discord_username
        creator.username = member.username or member.discord_username
        creator.avatar_url = member.avatar_url
        creator.is_active = True
        creator.updated_at = datetime.now(timezone.utc)
        synced += 1
    db.commit()
    return {"success": True, "synced": synced}

@router.post("/admin/creators/{creator_id}/channels")
async def admin_add_channel(creator_id: str, payload: CreatorChannelCreate, current_user: AuthUser = Depends(require_admin), db: Session = Depends(get_db)):
    creator = db.query(ContentCreator).filter(ContentCreator.id == creator_id).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    channel = CreatorChannel(creator_id=creator.id, **payload.model_dump())
    await sync_channel_public_profile(channel)
    db.add(channel)
    db.flush()
    await sync_creator_channel(db, channel, sync_profile=False)
    db.commit()
    db.refresh(channel)
    return serialize_channel(channel)

@router.put("/admin/creators/channels/{channel_id}")
async def admin_update_channel(channel_id: str, payload: CreatorChannelUpdate, current_user: AuthUser = Depends(require_admin), db: Session = Depends(get_db)):
    channel = db.query(CreatorChannel).filter(CreatorChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(channel, key, value)
    await sync_channel_public_profile(channel)
    await sync_creator_channel(db, channel, sync_profile=False)
    channel.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(channel)
    return serialize_channel(channel)

@router.delete("/admin/creators/channels/{channel_id}")
async def admin_disable_channel(channel_id: str, current_user: AuthUser = Depends(require_admin), db: Session = Depends(get_db)):
    channel = db.query(CreatorChannel).filter(CreatorChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    channel.is_active = False
    channel.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"success": True}

@router.post("/admin/creators/check-content")
async def admin_check_content(current_user: AuthUser = Depends(require_dashboard_access), db: Session = Depends(get_db)):
    return await check_creator_content(db)

@router.post("/internal/creators/check-content")
async def internal_check_content(
    x_internal_sync_key: str | None = Header(None),
    x_bot_api_key: str | None = Header(None),
    db: Session = Depends(get_db),
):
    valid_internal = settings.INTERNAL_SYNC_KEY and x_internal_sync_key == settings.INTERNAL_SYNC_KEY
    valid_bot = settings.BOT_API_KEY and x_bot_api_key == settings.BOT_API_KEY
    if not (valid_internal or valid_bot):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid sync key")
    return await check_creator_content(db)
