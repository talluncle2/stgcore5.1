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
    
    # API
    BOT_API_KEY: str = os.getenv("BOT_API_KEY", "")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # URLs
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://localhost:8000")
    
    # Environment
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

@lru_cache()
def get_settings() -> Settings:
    return Settings()
