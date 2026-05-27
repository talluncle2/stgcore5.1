"""Authentication and Authorization Dependencies"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from sqlalchemy.orm import Session
from core.config import get_settings
from core.database import get_db
from core.models import User, DiscordMember
from core.schemas import AuthUser

settings = get_settings()
security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """Decode JWT access token"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

def verify_bot_api_key(x_bot_api_key: str = Header(...)) -> bool:
    """Verify bot API key from header"""
    if x_bot_api_key != settings.BOT_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key"
        )
    return True

async def get_current_user(
    credentials: Optional[HTTPAuthCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> AuthUser:
    """Get current authenticated user from JWT token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    discord_id = payload.get("discord_id")
    if not discord_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    # Get user from database
    user = db.query(User).filter(User.discord_id == discord_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get member data from Discord sync table to get current permissions
    member = db.query(DiscordMember).filter(
        DiscordMember.discord_id == discord_id,
        DiscordMember.guild_id == settings.GUILD_ID
    ).first()
    
    # Build auth user response
    role = "user"
    if member:
        if member.is_admin:
            role = "admin"
        elif member.is_moderator:
            role = "moderator"
        elif member.can_access_dashboard:
            role = "staff"
    
    auth_user = AuthUser(
        id=user.id,
        discord_id=user.discord_id,
        email=user.email,
        avatar_url=member.avatar_url if member and member.avatar_url else user.avatar_url,
        discord_avatar_url=member.avatar_url if member and member.avatar_url else user.avatar_url,
        role=role,
        is_admin=member.is_admin if member else False,
        is_moderator=member.is_moderator if member else False,
        can_access_dashboard=member.can_access_dashboard if member else False,
        username=member.username if member and member.username else user.discord_username,
        discord_username=member.discord_username if member and member.discord_username else user.discord_username,
        global_name=member.global_name if member and member.global_name else user.discord_username,
        display_name=member.display_name if member and member.display_name else user.discord_username,
        last_discord_sync_at=member.last_discord_sync_at if member else None,
    )
    
    if member:
        auth_user.roles = member.role_ids or []
        auth_user.role_ids = member.role_ids or []
        auth_user.roles_json = member.roles_json or {}
        auth_user.discord_roles = member.role_ids or []
    
    return auth_user

async def get_current_user_optional(
    credentials: Optional[HTTPAuthCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[AuthUser]:
    """Get current user if authenticated, otherwise None"""
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None

async def require_admin(
    current_user: AuthUser = Depends(get_current_user)
) -> AuthUser:
    """Require admin user"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

async def require_dashboard_access(
    current_user: AuthUser = Depends(get_current_user)
) -> AuthUser:
    """Require dashboard access (admin, moderator, or authorized)"""
    if not (current_user.is_admin or current_user.is_moderator or current_user.can_access_dashboard):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dashboard access required"
        )
    return current_user

async def require_moderator(
    current_user: AuthUser = Depends(get_current_user)
) -> AuthUser:
    """Require moderator user"""
    if not current_user.is_moderator:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Moderator access required"
        )
    return current_user
