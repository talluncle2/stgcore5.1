"""Admin Routes - Secure endpoints for dashboard"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from core.database import get_db
from core.config import get_settings
from core.models import (
    DiscordGuild, DiscordMember, DiscordRole, DiscordChannel,
    DiscordBotStatus, DiscordMetric, DiscordEvent
)
from core.schemas import (
    DiscordGuildSchema, DiscordMemberSchema, DiscordRoleSchema,
    DiscordChannelSchema, DiscordBotStatusSchema, DiscordEventSchema,
    AuthUser
)
from core.dependencies import require_admin, require_dashboard_access

router = APIRouter(prefix="/admin/discord", tags=["admin"])
settings = get_settings()

@router.get("/status", response_model=DiscordBotStatusSchema)
async def get_discord_status(
    current_user: AuthUser = Depends(require_dashboard_access),
    db: Session = Depends(get_db)
):
    """Get latest bot status"""
    try:
        status_record = db.query(DiscordBotStatus).filter(
            DiscordBotStatus.guild_id == settings.GUILD_ID
        ).order_by(desc(DiscordBotStatus.created_at)).first()
        
        if not status_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No bot status found"
            )
        
        return status_record
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch bot status: {str(e)}"
        )

@router.get("/metrics")
async def get_discord_metrics(
    current_user: AuthUser = Depends(require_dashboard_access),
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=100)
):
    """Get latest Discord metrics"""
    try:
        metrics = db.query(DiscordMetric).filter(
            DiscordMetric.guild_id == settings.GUILD_ID
        ).order_by(desc(DiscordMetric.created_at)).limit(limit).all()
        
        return {
            "metrics": [
                {
                    "id": m.id,
                    "created_at": m.created_at.isoformat() if m.created_at else None,
                    "last_sync_at": m.last_sync_at.isoformat() if m.last_sync_at else None,
                    "metrics_json": m.metrics_json
                }
                for m in metrics
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch metrics: {str(e)}"
        )

@router.get("/guild", response_model=DiscordGuildSchema)
async def get_discord_guild(
    current_user: AuthUser = Depends(require_dashboard_access),
    db: Session = Depends(get_db)
):
    """Get guild information"""
    try:
        guild = db.query(DiscordGuild).filter(
            DiscordGuild.guild_id == settings.GUILD_ID
        ).first()
        
        if not guild:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Guild not found"
            )
        
        return guild
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch guild: {str(e)}"
        )

@router.get("/members", response_model=List[DiscordMemberSchema])
async def get_discord_members(
    current_user: AuthUser = Depends(require_dashboard_access),
    db: Session = Depends(get_db),
    is_admin: bool = Query(None),
    is_moderator: bool = Query(None),
    is_content_creator: bool = Query(None),
    is_bot: bool = Query(None),
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get Discord members with optional filters"""
    try:
        query = db.query(DiscordMember).filter(
            DiscordMember.guild_id == settings.GUILD_ID
        )
        
        if is_admin is not None:
            query = query.filter(DiscordMember.is_admin == is_admin)
        
        if is_moderator is not None:
            query = query.filter(DiscordMember.is_moderator == is_moderator)

        if is_content_creator is not None:
            query = query.filter(DiscordMember.is_content_creator == is_content_creator)
        
        if is_bot is not None:
            query = query.filter(DiscordMember.is_bot == is_bot)
        
        members = query.order_by(DiscordMember.updated_at.desc()).offset(offset).limit(limit).all()
        
        return members
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch members: {str(e)}"
        )

@router.get("/members/{discord_id}", response_model=DiscordMemberSchema)
async def get_discord_member(
    discord_id: int,
    current_user: AuthUser = Depends(require_dashboard_access),
    db: Session = Depends(get_db)
):
    """Get specific Discord member"""
    try:
        member = db.query(DiscordMember).filter(
            DiscordMember.guild_id == settings.GUILD_ID,
            DiscordMember.discord_id == discord_id
        ).first()
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )
        
        return member
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch member: {str(e)}"
        )

@router.get("/roles", response_model=List[DiscordRoleSchema])
async def get_discord_roles(
    current_user: AuthUser = Depends(require_dashboard_access),
    db: Session = Depends(get_db),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get Discord roles"""
    try:
        roles = db.query(DiscordRole).filter(
            DiscordRole.guild_id == settings.GUILD_ID
        ).order_by(DiscordRole.position.desc()).offset(offset).limit(limit).all()
        
        return roles
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch roles: {str(e)}"
        )

@router.get("/roles/{role_id}", response_model=DiscordRoleSchema)
async def get_discord_role(
    role_id: int,
    current_user: AuthUser = Depends(require_dashboard_access),
    db: Session = Depends(get_db)
):
    """Get specific Discord role"""
    try:
        role = db.query(DiscordRole).filter(
            DiscordRole.guild_id == settings.GUILD_ID,
            DiscordRole.role_id == role_id
        ).first()
        
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        return role
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch role: {str(e)}"
        )

@router.get("/channels", response_model=List[DiscordChannelSchema])
async def get_discord_channels(
    current_user: AuthUser = Depends(require_dashboard_access),
    db: Session = Depends(get_db),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get Discord channels"""
    try:
        channels = db.query(DiscordChannel).filter(
            DiscordChannel.guild_id == settings.GUILD_ID
        ).order_by(DiscordChannel.position).offset(offset).limit(limit).all()
        
        return channels
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch channels: {str(e)}"
        )

@router.get("/channels/{channel_id}", response_model=DiscordChannelSchema)
async def get_discord_channel(
    channel_id: int,
    current_user: AuthUser = Depends(require_dashboard_access),
    db: Session = Depends(get_db)
):
    """Get specific Discord channel"""
    try:
        channel = db.query(DiscordChannel).filter(
            DiscordChannel.guild_id == settings.GUILD_ID,
            DiscordChannel.channel_id == channel_id
        ).first()
        
        if not channel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Channel not found"
            )
        
        return channel
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch channel: {str(e)}"
        )

@router.get("/events")
async def get_discord_events(
    current_user: AuthUser = Depends(require_dashboard_access),
    db: Session = Depends(get_db),
    event_type: str = Query(None),
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get Discord events"""
    try:
        query = db.query(DiscordEvent).filter(
            DiscordEvent.guild_id == settings.GUILD_ID
        )
        
        if event_type:
            query = query.filter(DiscordEvent.event_type == event_type)
        
        events = query.order_by(desc(DiscordEvent.created_at)).offset(offset).limit(limit).all()
        
        return {
            "events": [
                {
                    "id": e.id,
                    "event_type": e.event_type,
                    "discord_id": e.discord_id,
                    "channel_id": e.channel_id,
                    "payload": e.payload_json,
                    "created_at": e.created_at.isoformat() if e.created_at else None
                }
                for e in events
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch events: {str(e)}"
        )

@router.get("/stats")
async def get_discord_stats(
    current_user: AuthUser = Depends(require_dashboard_access),
    db: Session = Depends(get_db)
):
    """Get overall Discord statistics"""
    try:
        guild = db.query(DiscordGuild).filter(
            DiscordGuild.guild_id == settings.GUILD_ID
        ).first()
        
        total_members = db.query(DiscordMember).filter(
            DiscordMember.guild_id == settings.GUILD_ID
        ).count()
        
        admin_count = db.query(DiscordMember).filter(
            DiscordMember.guild_id == settings.GUILD_ID,
            DiscordMember.is_admin == True
        ).count()
        
        moderator_count = db.query(DiscordMember).filter(
            DiscordMember.guild_id == settings.GUILD_ID,
            DiscordMember.is_moderator == True
        ).count()
        
        total_roles = db.query(DiscordRole).filter(
            DiscordRole.guild_id == settings.GUILD_ID
        ).count()
        
        total_channels = db.query(DiscordChannel).filter(
            DiscordChannel.guild_id == settings.GUILD_ID
        ).count()
        
        if not guild:
            return {
                "guild_found": False,
                "stats": None
            }
        
        return {
            "guild_found": True,
            "stats": {
                "guild_name": guild.guild_name,
                "total_members": total_members,
                "admin_count": admin_count,
                "moderator_count": moderator_count,
                "human_members": guild.human_members,
                "bot_members": guild.bot_members,
                "online_members": guild.online_members,
                "total_roles": total_roles,
                "total_channels": total_channels,
                "latency_ms": guild.latency_ms,
                "uptime_seconds": guild.uptime_seconds,
                "last_sync_at": guild.last_sync_at.isoformat() if guild.last_sync_at else None
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch stats: {str(e)}"
        )
