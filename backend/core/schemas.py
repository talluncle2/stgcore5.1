"""Pydantic Schemas for API Validation"""
from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

# Auth Schemas
class AuthUser(BaseModel):
    id: Optional[str] = None
    discord_id: Optional[int] = None
    discord_username: Optional[str] = None
    global_name: Optional[str] = None
    display_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    discord_avatar_url: Optional[str] = None
    image_url: Optional[str] = None
    role: Optional[str] = None
    roles: Optional[List[Any]] = None
    role_ids: Optional[List[Any]] = None
    roles_json: Optional[Any] = None
    discord_roles: Optional[List[Any]] = None
    last_discord_sync_at: Optional[datetime] = None
    is_admin: bool = False
    is_staff: bool = False
    is_moderator: bool = False
    can_access_dashboard: bool = False
    is_content_creator: bool = False
    clan_tag: Optional[str] = None
    coins: Optional[int] = 0
    xp: Optional[int] = 0
    level: Optional[int] = 1
    
    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 86400
    user: AuthUser

# Discord Member Sync Schemas
class DiscordMemberSchema(BaseModel):
    discord_id: int
    guild_id: int
    username: Optional[str] = None
    discord_username: Optional[str] = None
    global_name: Optional[str] = None
    display_name: Optional[str] = None
    nick: Optional[str] = None
    avatar_url: Optional[str] = None
    joined_at: Optional[datetime] = None
    role_ids: Optional[List[int]] = []
    roles_json: Optional[Dict[str, Any]] = {}
    is_bot: bool = False
    status: Optional[str] = None
    is_admin: bool = False
    is_moderator: bool = False
    can_access_dashboard: bool = False
    is_content_creator: bool = False
    
    class Config:
        from_attributes = True

class DiscordRoleSchema(BaseModel):
    guild_id: int
    role_id: int
    name: str
    color: Optional[int] = None
    position: Optional[int] = None
    permissions: Optional[int] = None
    mentionable: bool = False
    
    class Config:
        from_attributes = True

class DiscordChannelSchema(BaseModel):
    guild_id: int
    channel_id: int
    name: str
    type: Optional[str] = None
    position: Optional[int] = None
    category_id: Optional[int] = None
    nsfw: bool = False
    
    class Config:
        from_attributes = True

class DiscordGuildSchema(BaseModel):
    guild_id: int
    guild_name: str
    icon_url: Optional[str] = None
    owner_id: Optional[int] = None
    member_count: int = 0
    human_members: int = 0
    bot_members: int = 0
    online_members: int = 0
    channels_total: int = 0
    text_channels: int = 0
    voice_channels: int = 0
    roles_count: int = 0
    emojis: int = 0
    boosts: int = 0
    premium_tier: int = 0
    latency_ms: Optional[float] = None
    uptime_seconds: Optional[int] = None
    
    class Config:
        from_attributes = True

class DiscordBotStatusSchema(BaseModel):
    bot_id: int
    bot_name: Optional[str] = None
    guild_id: Optional[int] = None
    status: Optional[str] = None
    latency_ms: Optional[float] = None
    uptime_seconds: Optional[int] = None
    guild_count: Optional[int] = None
    version: Optional[str] = None
    
    class Config:
        from_attributes = True

class DiscordMetricSchema(BaseModel):
    guild_id: int
    metrics_json: Dict[str, Any] = {}
    
    class Config:
        from_attributes = True

class DiscordEventSchema(BaseModel):
    guild_id: int
    event_type: str
    discord_id: Optional[int] = None
    channel_id: Optional[int] = None
    payload_json: Optional[Dict[str, Any]] = {}
    
    class Config:
        from_attributes = True

# Bot Sync Request Schemas
class BotSyncMemberRequest(BaseModel):
    guild_id: int
    discord_id: int
    username: Optional[str] = None
    discord_username: Optional[str] = None
    global_name: Optional[str] = None
    display_name: Optional[str] = None
    nick: Optional[str] = None
    avatar_url: Optional[str] = None
    joined_at: Optional[datetime] = None
    role_ids: Optional[List[int]] = []
    roles_json: Optional[Dict[str, Any]] = {}
    is_bot: bool = False
    status: Optional[str] = None

class BotSyncMembersRequest(BaseModel):
    guild_id: int
    members: List[BotSyncMemberRequest]

class BotSyncRolesRequest(BaseModel):
    guild_id: int
    roles: List[DiscordRoleSchema]

class BotSyncChannelsRequest(BaseModel):
    guild_id: int
    channels: List[DiscordChannelSchema]

class BotSyncGuildRequest(BaseModel):
    guild_id: int
    guild_name: str
    icon_url: Optional[str] = None
    owner_id: Optional[int] = None
    member_count: int = 0
    human_members: int = 0
    bot_members: int = 0
    online_members: int = 0
    channels_total: int = 0
    text_channels: int = 0
    voice_channels: int = 0
    roles_count: int = 0
    emojis: int = 0
    boosts: int = 0
    premium_tier: int = 0
    latency_ms: Optional[float] = None
    uptime_seconds: Optional[int] = None

class BotSyncMetricsRequest(BaseModel):
    guild_id: int
    metrics_json: Dict[str, Any]

class BotSyncStatusRequest(BaseModel):
    bot_id: int
    bot_name: Optional[str] = None
    guild_id: Optional[int] = None
    status: Optional[str] = None
    latency_ms: Optional[float] = None
    uptime_seconds: Optional[int] = None
    guild_count: Optional[int] = None
    version: Optional[str] = None

class BotSyncEventRequest(BaseModel):
    guild_id: int
    event_type: str
    discord_id: Optional[int] = None
    channel_id: Optional[int] = None
    payload_json: Optional[Dict[str, Any]] = {}

# Response Schemas
class SuccessResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[Dict[str, Any]] = None

CreatorPlatform = Literal["youtube", "twitch", "kick", "tiktok"]

class CreatorChannelBase(BaseModel):
    platform: CreatorPlatform
    channel_id: Optional[str] = None
    channel_url: Optional[str] = None
    channel_name: Optional[str] = None
    handle: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    subscriber_count: Optional[int] = None
    video_count: Optional[int] = None
    view_count: Optional[int] = None
    metadata_json: Optional[Dict[str, Any]] = {}
    is_active: bool = True

class CreatorChannelCreate(CreatorChannelBase):
    pass

class CreatorChannelUpdate(BaseModel):
    platform: Optional[CreatorPlatform] = None
    channel_id: Optional[str] = None
    channel_url: Optional[str] = None
    channel_name: Optional[str] = None
    handle: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    subscriber_count: Optional[int] = None
    video_count: Optional[int] = None
    view_count: Optional[int] = None
    metadata_json: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class CreatorChannelResponse(CreatorChannelBase):
    id: str
    creator_id: str
    last_checked_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CreatorContentResponse(BaseModel):
    id: str
    creator_id: str
    channel_id: str
    platform: str
    external_id: str
    content_type: str
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    content_url: Optional[str] = None
    embed_url: Optional[str] = None
    published_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    is_live: bool = False
    is_active: bool = True
    creator: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class ContentCreatorBase(BaseModel):
    discord_id: str
    guild_id: Optional[str] = None
    display_name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool = True
    is_featured: bool = False
    sort_order: int = 0

class ContentCreatorCreate(ContentCreatorBase):
    pass

class ContentCreatorUpdate(BaseModel):
    display_name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    sort_order: Optional[int] = None

class ContentCreatorResponse(ContentCreatorBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    channels: List[CreatorChannelResponse] = []
    latest_content: List[CreatorContentResponse] = []

    class Config:
        from_attributes = True
