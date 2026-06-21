"""Authentication Routes - Discord OAuth and JWT"""
import uuid
import aiohttp
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from core.database import get_db
from core.config import get_settings
from core.models import User, DiscordMember
from core.schemas import AuthUser, AuthResponse
from core.dependencies import get_current_user, create_access_token
from core.discord_identity import extract_clan_tag

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

DISCORD_API_BASE = "https://discord.com/api/v10"

async def get_discord_token(code: str) -> dict:
    """Exchange OAuth code for Discord token"""
    async with aiohttp.ClientSession() as session:
        payload = {
            "client_id": settings.DISCORD_CLIENT_ID,
            "client_secret": settings.DISCORD_CLIENT_SECRET,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.DISCORD_REDIRECT_URI,
            "scope": "identify email"
        }
        
        async with session.post(
            f"{DISCORD_API_BASE}/oauth2/token",
            data=payload
        ) as resp:
            if resp.status != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get Discord token"
                )
            return await resp.json()

async def get_discord_user(access_token: str) -> dict:
    """Get Discord user info using access token"""
    async with aiohttp.ClientSession() as session:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with session.get(
            f"{DISCORD_API_BASE}/users/@me",
            headers=headers
        ) as resp:
            if resp.status != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to get Discord user info"
                )
            return await resp.json()

@router.get("/discord/authorize")
async def get_discord_authorize_url():
    """Get Discord OAuth authorization URL"""
    params = {
        "client_id": settings.DISCORD_CLIENT_ID,
        "redirect_uri": settings.DISCORD_REDIRECT_URI,
        "response_type": "code",
        "scope": "identify email"
    }
    
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    authorize_url = f"https://discord.com/oauth2/authorize?{query_string}"
    
    return {
        "authorize_url": authorize_url,
        "client_id": settings.DISCORD_CLIENT_ID,
        "redirect_uri": settings.DISCORD_REDIRECT_URI
    }

@router.get("/discord/login")
async def discord_login():
    """Redirect browser to Discord OAuth."""
    params = {
        "client_id": settings.DISCORD_CLIENT_ID,
        "redirect_uri": settings.DISCORD_REDIRECT_URI,
        "response_type": "code",
        "scope": "identify email",
    }
    return RedirectResponse(f"https://discord.com/oauth2/authorize?{urlencode(params)}")

async def process_discord_code(code: str, db: Session) -> AuthResponse:
    """Exchange Discord OAuth code, upsert user, and issue local JWT."""
    try:
        token_data = await get_discord_token(code)
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No access token received"
            )
        
        discord_user = await get_discord_user(access_token)
        discord_id = int(discord_user.get("id"))
        discord_username = discord_user.get("username")
        email = discord_user.get("email")
        avatar_hash = discord_user.get("avatar")
        
        avatar_url = None
        if avatar_hash:
            avatar_url = f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar_hash}.png"
        
        user = db.query(User).filter(User.discord_id == discord_id).first()
        
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                discord_id=discord_id,
                discord_username=discord_username,
                email=email,
                avatar_url=avatar_url
            )
            db.add(user)
        else:
            user.discord_username = discord_username
            user.email = email
            user.avatar_url = avatar_url
        
        db.commit()
        db.refresh(user)
        
        member = db.query(DiscordMember).filter(
            DiscordMember.discord_id == discord_id,
            DiscordMember.guild_id == settings.GUILD_ID
        ).first()
        
        role = "user"
        if member:
            if member.is_admin:
                role = "admin"
            elif member.is_moderator:
                role = "moderator"
            elif member.can_access_dashboard:
                role = "staff"
        
        clan_tag = extract_clan_tag(member)
        token_data = {
            "sub": str(user.id),
            "discord_id": str(discord_id),
            "user_id": user.id,
            "username": discord_username,
            "email": email,
            # Supabase PostgREST requires a database role claim.
            "role": "authenticated",
            "app_role": role,
            "is_admin": member.is_admin if member else False,
            "is_moderator": member.is_moderator if member else False,
            "can_access_dashboard": member.can_access_dashboard if member else False,
            "is_content_creator": member.is_content_creator if member else False,
            "clan_tag": clan_tag,
        }
        
        access_token_jwt = create_access_token(token_data)
        
        auth_user = AuthUser(
            id=user.id,
            discord_id=user.discord_id,
            discord_username=member.discord_username if member and member.discord_username else user.discord_username,
            email=user.email,
            avatar_url=member.avatar_url if member and member.avatar_url else user.avatar_url,
            discord_avatar_url=member.avatar_url if member and member.avatar_url else user.avatar_url,
            role=role,
            is_admin=member.is_admin if member else False,
            is_moderator=member.is_moderator if member else False,
            can_access_dashboard=member.can_access_dashboard if member else False,
            is_content_creator=member.is_content_creator if member else False,
            clan_tag=clan_tag,
            username=member.username if member and member.username else user.discord_username,
            global_name=member.global_name if member and member.global_name else user.discord_username,
            display_name=member.display_name if member and member.display_name else user.discord_username,
            last_discord_sync_at=member.last_discord_sync_at if member else None,
        )
        
        if member:
            auth_user.roles = member.role_ids or []
            auth_user.role_ids = member.role_ids or []
            auth_user.roles_json = member.roles_json or {}
            auth_user.discord_roles = member.role_ids or []
        
        return AuthResponse(
            access_token=access_token_jwt,
            user=auth_user
        )
    
    except aiohttp.ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Discord API error: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process OAuth callback: {str(e)}"
        )

@router.post("/discord/callback")
async def discord_callback(
    code: str,
    db: Session = Depends(get_db)
):
    """Handle Discord OAuth callback for API clients."""
    return await process_discord_code(code, db)

@router.get("/discord/callback")
async def discord_callback_redirect(
    code: str = Query(...),
    db: Session = Depends(get_db)
):
    """Handle Discord OAuth callback for browser login and redirect to frontend."""
    auth_response = await process_discord_code(code, db)
    frontend_url = settings.FRONTEND_URL.rstrip("/")
    return RedirectResponse(
        f"{frontend_url}/auth/callback?token={auth_response.access_token}"
    )

@router.get("/me", response_model=AuthUser)
async def get_me(current_user: AuthUser = Depends(get_current_user)):
    """Get current authenticated user info"""
    return current_user

@router.post("/logout")
async def logout():
    """Logout user - frontend should clear token"""
    return {"message": "Logged out successfully"}

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "online", "api": "STG Core"}
