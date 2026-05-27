"""SQLAlchemy Models for Discord Sync Data"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, BigInteger, Boolean, Float, DateTime,
    ForeignKey, UniqueConstraint, Index
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import JSON as PG_JSON

Base = declarative_base()

class DiscordGuild(Base):
    __tablename__ = "discord_guilds"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    guild_id = Column(BigInteger, unique=True, nullable=False, index=True)
    guild_name = Column(String(255), nullable=False)
    icon_url = Column(String)
    owner_id = Column(BigInteger)
    member_count = Column(Integer, default=0)
    human_members = Column(Integer, default=0)
    bot_members = Column(Integer, default=0)
    online_members = Column(Integer, default=0)
    channels_total = Column(Integer, default=0)
    text_channels = Column(Integer, default=0)
    voice_channels = Column(Integer, default=0)
    roles_count = Column(Integer, default=0)
    emojis = Column(Integer, default=0)
    boosts = Column(Integer, default=0)
    premium_tier = Column(Integer, default=0)
    latency_ms = Column(Float)
    uptime_seconds = Column(BigInteger)
    last_sync_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    members = relationship("DiscordMember", back_populates="guild", cascade="all, delete-orphan")
    roles = relationship("DiscordRole", back_populates="guild", cascade="all, delete-orphan")
    channels = relationship("DiscordChannel", back_populates="guild", cascade="all, delete-orphan")
    events = relationship("DiscordEvent", back_populates="guild", cascade="all, delete-orphan")

class DiscordMember(Base):
    __tablename__ = "discord_members"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    guild_id = Column(BigInteger, ForeignKey("discord_guilds.guild_id", ondelete="CASCADE"), nullable=False, index=True)
    discord_id = Column(BigInteger, nullable=False, unique=True, index=True)
    user_id = Column(BigInteger)
    username = Column(String(255))
    discord_username = Column(String(255))
    global_name = Column(String(255))
    display_name = Column(String(255))
    nick = Column(String(255))
    avatar_url = Column(String)
    joined_at = Column(DateTime(timezone=True))
    role_ids = Column(PG_JSON, default=[])
    roles_json = Column(PG_JSON, default={})
    is_bot = Column(Boolean, default=False)
    status = Column(String(50))
    is_admin = Column(Boolean, default=False, index=True)
    is_moderator = Column(Boolean, default=False, index=True)
    can_access_dashboard = Column(Boolean, default=False, index=True)
    last_discord_sync_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint("guild_id", "discord_id", name="uq_guild_discord_id"),
        Index("idx_guild_id", "guild_id"),
        Index("idx_discord_id", "discord_id"),
    )
    
    guild = relationship("DiscordGuild", back_populates="members")

class DiscordRole(Base):
    __tablename__ = "discord_roles"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    guild_id = Column(BigInteger, ForeignKey("discord_guilds.guild_id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(BigInteger, nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    color = Column(Integer)
    position = Column(Integer)
    permissions = Column(BigInteger)
    mentionable = Column(Boolean, default=False)
    last_sync_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint("guild_id", "role_id", name="uq_guild_role_id"),
    )
    
    guild = relationship("DiscordGuild", back_populates="roles")

class DiscordChannel(Base):
    __tablename__ = "discord_channels"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    guild_id = Column(BigInteger, ForeignKey("discord_guilds.guild_id", ondelete="CASCADE"), nullable=False, index=True)
    channel_id = Column(BigInteger, nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50))
    position = Column(Integer)
    category_id = Column(BigInteger)
    nsfw = Column(Boolean, default=False)
    last_sync_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint("guild_id", "channel_id", name="uq_guild_channel_id"),
    )
    
    guild = relationship("DiscordGuild", back_populates="channels")

class DiscordBotStatus(Base):
    __tablename__ = "discord_bot_status"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    bot_id = Column(BigInteger, nullable=False, index=True)
    bot_name = Column(String(255))
    guild_id = Column(BigInteger, ForeignKey("discord_guilds.guild_id", ondelete="SET NULL"), index=True)
    status = Column(String(50))
    latency_ms = Column(Float)
    uptime_seconds = Column(BigInteger)
    guild_count = Column(Integer)
    version = Column(String(50))
    last_sync_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

class DiscordMetric(Base):
    __tablename__ = "discord_metrics"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    guild_id = Column(BigInteger, ForeignKey("discord_guilds.guild_id", ondelete="CASCADE"), nullable=False, index=True)
    metrics_json = Column(PG_JSON, default={})
    last_sync_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class DiscordEvent(Base):
    __tablename__ = "discord_events"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    guild_id = Column(BigInteger, ForeignKey("discord_guilds.guild_id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    discord_id = Column(BigInteger)
    channel_id = Column(BigInteger)
    payload_json = Column(PG_JSON, default={})
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    
    guild = relationship("DiscordGuild", back_populates="events")

class User(Base):
    """User authentication model"""
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True)
    discord_id = Column(BigInteger, unique=True, nullable=False, index=True)
    discord_username = Column(String(255))
    email = Column(String(255), unique=True)
    avatar_url = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
