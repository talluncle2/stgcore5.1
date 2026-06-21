"""Bot Sync Routes - Receive data from Discord bot and save to Supabase"""
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from core.database import get_db
from core.config import get_settings
from core.models import (
    DiscordGuild, DiscordMember, DiscordRole, DiscordChannel,
    DiscordBotStatus, DiscordMetric, DiscordEvent
)
from core.schemas import (
    BotSyncMemberRequest, BotSyncMembersRequest, BotSyncRolesRequest,
    BotSyncChannelsRequest, BotSyncGuildRequest, BotSyncMetricsRequest,
    BotSyncStatusRequest, BotSyncEventRequest, SuccessResponse, ErrorResponse
)
from core.dependencies import verify_bot_api_key

router = APIRouter(prefix="/bot/sync", tags=["bot-sync"])
settings = get_settings()

def calculate_member_permissions(member_request: BotSyncMemberRequest, db: Session) -> tuple:
    """Calculate member permissions from configured Discord role IDs."""
    is_admin = False
    is_moderator = False
    can_access_dashboard = False
    is_content_creator = False
    
    role_ids = member_request.role_ids or []
    
    # Check role IDs against configured role lists
    for role_id in role_ids:
        if role_id in settings.ADMIN_ROLE_IDS:
            is_admin = True
            is_moderator = True  # Admins are also moderators
            can_access_dashboard = True
        elif role_id in settings.MODERATOR_ROLE_IDS:
            is_moderator = True
            can_access_dashboard = True
        elif role_id in settings.DASHBOARD_ALLOWED_ROLE_IDS:
            can_access_dashboard = True
        if role_id in settings.CONTENT_CREATOR_ROLE_IDS:
            is_content_creator = True
    
    return is_admin, is_moderator, can_access_dashboard, is_content_creator

@router.post("/guild", response_model=SuccessResponse)
async def sync_guild(
    request: BotSyncGuildRequest,
    db: Session = Depends(get_db),
    verified: bool = Depends(verify_bot_api_key)
):
    """Sync guild information from bot"""
    try:
        now = datetime.now(timezone.utc)
        
        # Upsert guild
        stmt = insert(DiscordGuild).values(
            guild_id=request.guild_id,
            guild_name=request.guild_name,
            icon_url=request.icon_url,
            owner_id=request.owner_id,
            member_count=request.member_count,
            human_members=request.human_members,
            bot_members=request.bot_members,
            online_members=request.online_members,
            channels_total=request.channels_total,
            text_channels=request.text_channels,
            voice_channels=request.voice_channels,
            roles_count=request.roles_count,
            emojis=request.emojis,
            boosts=request.boosts,
            premium_tier=request.premium_tier,
            latency_ms=request.latency_ms,
            uptime_seconds=request.uptime_seconds,
            last_sync_at=now,
            updated_at=now
        ).on_conflict_do_update(
            index_elements=["guild_id"],
            set_={
                "guild_name": request.guild_name,
                "icon_url": request.icon_url,
                "owner_id": request.owner_id,
                "member_count": request.member_count,
                "human_members": request.human_members,
                "bot_members": request.bot_members,
                "online_members": request.online_members,
                "channels_total": request.channels_total,
                "text_channels": request.text_channels,
                "voice_channels": request.voice_channels,
                "roles_count": request.roles_count,
                "emojis": request.emojis,
                "boosts": request.boosts,
                "premium_tier": request.premium_tier,
                "latency_ms": request.latency_ms,
                "uptime_seconds": request.uptime_seconds,
                "last_sync_at": now,
                "updated_at": now
            }
        )
        
        db.execute(stmt)
        db.commit()
        
        return SuccessResponse(message="Guild synced successfully")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync guild: {str(e)}"
        )

@router.post("/member", response_model=SuccessResponse)
async def sync_member(
    request: BotSyncMemberRequest,
    db: Session = Depends(get_db),
    verified: bool = Depends(verify_bot_api_key)
):
    """Sync single member from bot"""
    try:
        now = datetime.now(timezone.utc)
        
        # Calculate permissions
        is_admin, is_moderator, can_access_dashboard, is_content_creator = calculate_member_permissions(request, db)
        
        stmt = insert(DiscordMember).values(
            guild_id=request.guild_id,
            discord_id=request.discord_id,
            username=request.username,
            discord_username=request.discord_username,
            global_name=request.global_name,
            display_name=request.display_name or request.discord_username,
            nick=request.nick,
            avatar_url=request.avatar_url,
            joined_at=request.joined_at,
            role_ids=request.role_ids or [],
            roles_json=request.roles_json or {},
            is_bot=request.is_bot,
            status=request.status,
            is_admin=is_admin,
            is_moderator=is_moderator,
            can_access_dashboard=can_access_dashboard,
            is_content_creator=is_content_creator,
            last_discord_sync_at=now,
            updated_at=now
        ).on_conflict_do_update(
            constraint="uq_guild_discord_id",
            set_={
                "username": request.username,
                "discord_username": request.discord_username,
                "global_name": request.global_name,
                "display_name": request.display_name or request.discord_username,
                "nick": request.nick,
                "avatar_url": request.avatar_url,
                "joined_at": request.joined_at,
                "role_ids": request.role_ids or [],
                "roles_json": request.roles_json or {},
                "is_bot": request.is_bot,
                "status": request.status,
                "is_admin": is_admin,
                "is_moderator": is_moderator,
                "can_access_dashboard": can_access_dashboard,
                "is_content_creator": is_content_creator,
                "last_discord_sync_at": now,
                "updated_at": now
            }
        )
        
        db.execute(stmt)
        db.commit()
        
        return SuccessResponse(message="Member synced successfully")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync member: {str(e)}"
        )

@router.post("/members", response_model=SuccessResponse)
async def sync_members(
    request: BotSyncMembersRequest,
    db: Session = Depends(get_db),
    verified: bool = Depends(verify_bot_api_key)
):
    """Sync multiple members from bot (bulk operation)"""
    try:
        now = datetime.now(timezone.utc)
        synced_count = 0
        
        for member_request in request.members:
            # Calculate permissions
            is_admin, is_moderator, can_access_dashboard, is_content_creator = calculate_member_permissions(member_request, db)
            
            stmt = insert(DiscordMember).values(
                guild_id=request.guild_id,
                discord_id=member_request.discord_id,
                username=member_request.username,
                discord_username=member_request.discord_username,
                global_name=member_request.global_name,
                display_name=member_request.display_name or member_request.discord_username,
                nick=member_request.nick,
                avatar_url=member_request.avatar_url,
                joined_at=member_request.joined_at,
                role_ids=member_request.role_ids or [],
                roles_json=member_request.roles_json or {},
                is_bot=member_request.is_bot,
                status=member_request.status,
                is_admin=is_admin,
                is_moderator=is_moderator,
                can_access_dashboard=can_access_dashboard,
                is_content_creator=is_content_creator,
                last_discord_sync_at=now,
                updated_at=now
            ).on_conflict_do_update(
                constraint="uq_guild_discord_id",
                set_={
                    "username": member_request.username,
                    "discord_username": member_request.discord_username,
                    "global_name": member_request.global_name,
                    "display_name": member_request.display_name or member_request.discord_username,
                    "nick": member_request.nick,
                    "avatar_url": member_request.avatar_url,
                    "joined_at": member_request.joined_at,
                    "role_ids": member_request.role_ids or [],
                    "roles_json": member_request.roles_json or {},
                    "is_bot": member_request.is_bot,
                    "status": member_request.status,
                    "is_admin": is_admin,
                    "is_moderator": is_moderator,
                    "can_access_dashboard": can_access_dashboard,
                    "is_content_creator": is_content_creator,
                    "last_discord_sync_at": now,
                    "updated_at": now
                }
            )
            
            db.execute(stmt)
            synced_count += 1
        
        db.commit()
        return SuccessResponse(message=f"Synced {synced_count} members successfully")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync members: {str(e)}"
        )

@router.post("/roles", response_model=SuccessResponse)
async def sync_roles(
    request: BotSyncRolesRequest,
    db: Session = Depends(get_db),
    verified: bool = Depends(verify_bot_api_key)
):
    """Sync roles from bot"""
    try:
        now = datetime.now(timezone.utc)
        
        for role_request in request.roles:
            stmt = insert(DiscordRole).values(
                guild_id=request.guild_id,
                role_id=role_request.role_id,
                name=role_request.name,
                color=role_request.color,
                position=role_request.position,
                permissions=role_request.permissions,
                mentionable=role_request.mentionable,
                last_sync_at=now,
                updated_at=now
            ).on_conflict_do_update(
                constraint="uq_guild_role_id",
                set_={
                    "name": role_request.name,
                    "color": role_request.color,
                    "position": role_request.position,
                    "permissions": role_request.permissions,
                    "mentionable": role_request.mentionable,
                    "last_sync_at": now,
                    "updated_at": now
                }
            )
            db.execute(stmt)
        
        db.commit()
        return SuccessResponse(message=f"Synced {len(request.roles)} roles successfully")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync roles: {str(e)}"
        )

@router.post("/channels", response_model=SuccessResponse)
async def sync_channels(
    request: BotSyncChannelsRequest,
    db: Session = Depends(get_db),
    verified: bool = Depends(verify_bot_api_key)
):
    """Sync channels from bot"""
    try:
        now = datetime.now(timezone.utc)
        
        for channel_request in request.channels:
            stmt = insert(DiscordChannel).values(
                guild_id=request.guild_id,
                channel_id=channel_request.channel_id,
                name=channel_request.name,
                type=channel_request.type,
                position=channel_request.position,
                category_id=channel_request.category_id,
                nsfw=channel_request.nsfw,
                last_sync_at=now,
                updated_at=now
            ).on_conflict_do_update(
                constraint="uq_guild_channel_id",
                set_={
                    "name": channel_request.name,
                    "type": channel_request.type,
                    "position": channel_request.position,
                    "category_id": channel_request.category_id,
                    "nsfw": channel_request.nsfw,
                    "last_sync_at": now,
                    "updated_at": now
                }
            )
            db.execute(stmt)
        
        db.commit()
        return SuccessResponse(message=f"Synced {len(request.channels)} channels successfully")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync channels: {str(e)}"
        )

@router.post("/metrics", response_model=SuccessResponse)
async def sync_metrics(
    request: BotSyncMetricsRequest,
    db: Session = Depends(get_db),
    verified: bool = Depends(verify_bot_api_key)
):
    """Sync metrics from bot"""
    try:
        now = datetime.now(timezone.utc)
        
        metric = DiscordMetric(
            guild_id=request.guild_id,
            metrics_json=request.metrics_json,
            last_sync_at=now
        )
        db.add(metric)
        db.commit()
        
        return SuccessResponse(message="Metrics synced successfully")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync metrics: {str(e)}"
        )

@router.post("/status", response_model=SuccessResponse)
async def sync_status(
    request: BotSyncStatusRequest,
    db: Session = Depends(get_db),
    verified: bool = Depends(verify_bot_api_key)
):
    """Sync bot status from bot"""
    try:
        now = datetime.now(timezone.utc)
        
        status_record = DiscordBotStatus(
            bot_id=request.bot_id,
            bot_name=request.bot_name,
            guild_id=request.guild_id,
            status=request.status,
            latency_ms=request.latency_ms,
            uptime_seconds=request.uptime_seconds,
            guild_count=request.guild_count,
            version=request.version,
            last_sync_at=now
        )
        db.add(status_record)
        db.commit()
        
        return SuccessResponse(message="Bot status synced successfully")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync bot status: {str(e)}"
        )

@router.post("/events", response_model=SuccessResponse)
async def sync_event(
    request: BotSyncEventRequest,
    db: Session = Depends(get_db),
    verified: bool = Depends(verify_bot_api_key)
):
    """Sync event from bot"""
    try:
        event = DiscordEvent(
            guild_id=request.guild_id,
            event_type=request.event_type,
            discord_id=request.discord_id,
            channel_id=request.channel_id,
            payload_json=request.payload_json or {}
        )
        db.add(event)
        db.commit()
        
        return SuccessResponse(message="Event synced successfully")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync event: {str(e)}"
        )

@router.post("/message-event", response_model=SuccessResponse)
async def sync_message_event(
    request: BotSyncEventRequest,
    db: Session = Depends(get_db),
    verified: bool = Depends(verify_bot_api_key)
):
    """Sync message event from bot"""
    # Alias for /events
    return await sync_event(request, db, verified)

@router.post("/voice", response_model=SuccessResponse)
async def sync_voice(
    request: dict,
    db: Session = Depends(get_db),
    verified: bool = Depends(verify_bot_api_key)
):
    """Sync voice event from bot"""
    try:
        # Store as event with type 'voice'
        event_req = BotSyncEventRequest(
            guild_id=request.get("guild_id"),
            event_type="voice",
            payload_json=request
        )
        return await sync_event(event_req, db, verified)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync voice event: {str(e)}"
        )
