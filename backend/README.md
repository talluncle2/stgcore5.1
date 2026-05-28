# STG Core API

FastAPI backend for STG Warzone platform. Handles Discord OAuth authentication, bot sync data, and admin dashboard.

## Architecture

```
Frontend (Vercel)
    ↓
STG Core API (Replit/FastAPI)
    ↓
Supabase (PostgreSQL)
    
Bot (Discloud)
    ↓
STG Core API
    ↓
Supabase
```

## Setup

### 1. Environment Variables

```bash
cp .env.example .env
# Edit .env with your values
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Database Setup

Apply the Supabase migration:
- Go to your Supabase console
- SQL Editor
- Paste contents of `../supabase/migrations/20260527000001_create_discord_tables.sql`
- Execute

Or use SQLAlchemy auto-creation (tables will be created on first run).

### 4. Run API

```bash
# Development
python -m uvicorn core.main:app --reload --host 0.0.0.0 --port 8000

# Production (via Replit)
python run.py
```

## API Endpoints

### Authentication
- `GET /auth/discord/authorize` - Get OAuth authorization URL
- `POST /auth/discord/callback` - Handle Discord OAuth callback
- `GET /auth/me` - Get current user info (requires Bearer token)
- `POST /auth/logout` - Logout
- `GET /health` - API health check

### Bot Sync (requires X-BOT-API-KEY header)
- `POST /bot/sync/guild` - Sync guild information
- `POST /bot/sync/member` - Sync single member
- `POST /bot/sync/members` - Sync multiple members
- `POST /bot/sync/roles` - Sync roles
- `POST /bot/sync/channels` - Sync channels
- `POST /bot/sync/metrics` - Sync metrics
- `POST /bot/sync/status` - Sync bot status
- `POST /bot/sync/events` - Sync events
- `POST /bot/sync/message-event` - Sync message events
- `POST /bot/sync/voice` - Sync voice events

### Admin Dashboard (requires Bearer token + admin/moderator/dashboard access)
- `GET /admin/discord/status` - Get bot status
- `GET /admin/discord/metrics` - Get Discord metrics
- `GET /admin/discord/guild` - Get guild information
- `GET /admin/discord/members` - Get all members (with filters)
- `GET /admin/discord/members/{discord_id}` - Get specific member
- `GET /admin/discord/roles` - Get all roles
- `GET /admin/discord/roles/{role_id}` - Get specific role
- `GET /admin/discord/channels` - Get all channels
- `GET /admin/discord/channels/{channel_id}` - Get specific channel
- `GET /admin/discord/events` - Get events
- `GET /admin/discord/stats` - Get Discord statistics

### Creators
- `GET /creators/latest` - Latest synced creator videos/lives
- `GET /creators/live` - Currently synced live content
- `GET /creators/me` - Current authenticated creator profile
- `POST /creators/me/channels` - Register one creator platform account
- `POST /creators/me/sync` - Force profile/content sync for the authenticated creator
- `POST /internal/creators/check-content` - Internal scheduled sync using `X-Internal-Sync-Key` or `X-Bot-API-Key`

Creator sync uses server-side platform APIs. Configure these secrets in Replit:

```env
YOUTUBE_API_KEY=...
TWITCH_CLIENT_ID=...
TWITCH_CLIENT_SECRET=...
CORS_ORIGINS=https://seu-frontend.com
```

## Database Tables

See `../supabase/migrations/20260527000001_create_discord_tables.sql` for schema:

- `discord_guilds` - Guild/server information
- `discord_members` - Member data with permissions
- `discord_roles` - Role data
- `discord_channels` - Channel data
- `discord_bot_status` - Bot status history
- `discord_metrics` - Discord metrics
- `discord_events` - Event log
- `users` - User authentication data

## Data Flow

### Member Joins/Updates
1. Bot detects member join/update
2. Bot sends `POST /bot/sync/member` with X-BOT-API-KEY header
3. API calculates permissions based on `ADMIN_ROLE_IDS`, `MODERATOR_ROLE_IDS`, `DASHBOARD_ALLOWED_ROLE_IDS`
4. API saves/updates in `discord_members` table
5. Frontend calls `GET /auth/me` to read fresh permissions
6. Permissions update in frontend

### Data Persistence
- Supabase is the single source of truth
- No local JSON file dependency
- Restarting Replit doesn't lose data
- API can be scaled horizontally

## Security

- JWT tokens signed with `JWT_SECRET_KEY`
- Bot API key in `X-BOT-API-KEY` header for bot endpoints
- Bearer tokens in `Authorization` header for user endpoints
- Role-based access control for admin endpoints
- CORS enabled for frontend origin

## Debugging

- Set `DEBUG=true` in .env for verbose logging
- API docs available at `/docs` (Swagger UI)
- OpenAPI schema at `/openapi.json`

## Common Issues

### Database connection fails
- Verify `DATABASE_URL` is correct
- Check Supabase connection is active
- Ensure credentials have permissions

### OAuth callback doesn't redirect
- Verify `DISCORD_REDIRECT_URI` matches frontend URL
- Check `FRONTEND_URL` environment variable
- Ensure Discord app settings match

### Bot API key rejected
- Verify `BOT_API_KEY` matches bot's config
- Check header name is `X-BOT-API-KEY` (case-sensitive)
- Ensure no extra spaces in key
