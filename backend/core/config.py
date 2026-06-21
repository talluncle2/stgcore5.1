"""STG Core API Configuration"""
import os
from functools import lru_cache

class Settings:
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost/stg_db"
    )
    
    # Discord
    DISCORD_CLIENT_ID: str = os.getenv("DISCORD_CLIENT_ID", "")
    DISCORD_CLIENT_SECRET: str = os.getenv("DISCORD_CLIENT_SECRET", "")
    DISCORD_REDIRECT_URI: str = os.getenv(
        "DISCORD_REDIRECT_URI",
        "http://localhost:3000/auth/callback"
    )
    DISCORD_TOKEN: str = os.getenv("DISCORD_TOKEN", "")
    
    # Guild Configuration
    GUILD_ID: int = int(os.getenv("GUILD_ID", "0"))
    ADMIN_ROLE_IDS: list = [int(x) for x in os.getenv("ADMIN_ROLE_IDS", "").split(",") if x]
    MODERATOR_ROLE_IDS: list = [int(x) for x in os.getenv("MODERATOR_ROLE_IDS", "").split(",") if x]
    DASHBOARD_ALLOWED_ROLE_IDS: list = [int(x) for x in os.getenv("DASHBOARD_ALLOWED_ROLE_IDS", "").split(",") if x]
    CONTENT_CREATOR_ROLE_IDS: list = [int(x) for x in os.getenv("CONTENT_CREATOR_ROLE_IDS", "").split(",") if x]
    
    # API
    BOT_API_KEY: str = os.getenv("BOT_API_KEY", "")
    INTERNAL_SYNC_KEY: str = os.getenv("INTERNAL_SYNC_KEY", "")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", JWT_SECRET_KEY)
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # URLs
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://localhost:8000")
    CORS_ORIGINS: list = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "").split(",") if origin.strip()]
    
    # Environment
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Creator platform integrations - server-side only
    YOUTUBE_API_KEY: str = os.getenv("YOUTUBE_API_KEY", "")
    TWITCH_CLIENT_ID: str = os.getenv("TWITCH_CLIENT_ID", "")
    TWITCH_CLIENT_SECRET: str = os.getenv("TWITCH_CLIENT_SECRET", "")

@lru_cache()
def get_settings() -> Settings:
    return Settings()
