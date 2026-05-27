# STG Core Implementation Checklist - May 27, 2026

## COMPLETED ✅

### Phase 1: Database Schema
- [x] Created Supabase migration with 7 main tables
  - discord_guilds
  - discord_members (with permission columns)
  - discord_roles
  - discord_channels
  - discord_bot_status
  - discord_metrics
  - discord_events
- [x] All tables have proper indexes
- [x] JSONB fields for flexible data
- [x] Foreign key relationships
- [x] Timestamps on all tables

### Phase 2: Backend API
- [x] FastAPI application structure
- [x] SQLAlchemy ORM models matching schema
- [x] Pydantic request/response schemas
- [x] Database connection manager
- [x] Authentication dependencies
  - [x] JWT token creation/validation
  - [x] Discord OAuth integration
  - [x] Role-based access control
- [x] Bot sync routes (/bot/sync/*)
  - [x] /bot/sync/guild
  - [x] /bot/sync/member
  - [x] /bot/sync/members (bulk)
  - [x] /bot/sync/roles
  - [x] /bot/sync/channels
  - [x] /bot/sync/metrics
  - [x] /bot/sync/status
  - [x] /bot/sync/events
  - [x] /bot/sync/message-event
  - [x] /bot/sync/voice
- [x] Auth routes
  - [x] /auth/discord/authorize
  - [x] /auth/discord/callback (OAuth)
  - [x] /auth/me (current user)
  - [x] /auth/logout
- [x] Admin routes (/admin/discord/*)
  - [x] /admin/discord/status
  - [x] /admin/discord/metrics
  - [x] /admin/discord/guild
  - [x] /admin/discord/members
  - [x] /admin/discord/members/{discord_id}
  - [x] /admin/discord/roles
  - [x] /admin/discord/roles/{role_id}
  - [x] /admin/discord/channels
  - [x] /admin/discord/channels/{channel_id}
  - [x] /admin/discord/events
  - [x] /admin/discord/stats
- [x] Permission calculation (admin/moderator/dashboard)
- [x] Error handling and logging
- [x] CORS configuration
- [x] requirements.txt with all dependencies

### Phase 3: Frontend Integration
- [x] Updated adminService.ts
  - [x] getDiscordStatus()
  - [x] getDiscordMetrics()
  - [x] getDiscordGuild()
  - [x] getDiscordMembers()
  - [x] getDiscordMember()
  - [x] getDiscordRoles()
  - [x] getDiscordRole()
  - [x] getDiscordChannels()
  - [x] getDiscordChannel()
  - [x] getDiscordEvents()
  - [x] getDiscordStats()
- [x] Updated permissions.ts
  - [x] hasSettingsAccess() - admin only
  - [x] Existing permission functions verified
- [x] Updated ProtectedRoute.tsx
  - [x] requireAdmin prop for strict admin routes
- [x] Updated App.tsx
  - [x] Settings route protected with requireAdmin
- [x] Updated Dashboard.tsx
  - [x] Imports changed to use adminService
  - [x] Loads real Discord stats
- [x] Backend configuration files
  - [x] .env.example
  - [x] README.md with setup instructions

## IN PROGRESS ⏳

### Phase 4: Frontend Pages
- [ ] Dashboard.tsx
  - [ ] Finish stats display update
  - [ ] Update "Matriz STG" section
  - [ ] Update Elite Squad section
- [ ] Admin.tsx - Show real members from API
- [ ] Other admin pages (Moderation, etc.)

### Phase 5: Navigation
- [ ] Create top navbar component
- [ ] Remove/hide sidebar for admin pages
- [ ] Mobile responsive hamburger menu
- [ ] User menu dropdown

## TODO ⏸️

### Deployment & Testing
- [ ] Deploy backend to Replit
  - [ ] Set environment variables
  - [ ] Apply Supabase migration
  - [ ] Test endpoints with Postman
- [ ] Deploy frontend to Vercel
  - [ ] Update API base URL
  - [ ] Test OAuth flow
- [ ] Test full integration
  - [ ] Login with Discord
  - [ ] Admin sees own admin status
  - [ ] Dashboard loads real data
  - [ ] Can view members/roles/channels
  - [ ] Settings page admin-only

### Bot Integration
- [ ] Create/update bot code to use API endpoints
  - [ ] Send to /bot/sync/members with X-BOT-API-KEY
  - [ ] Send to /bot/sync/guild
  - [ ] Send to /bot/sync/roles
  - [ ] Send to /bot/sync/channels
  - [ ] Remove local JSON saves

### Final Cleanup
- [ ] Remove mock data from frontend
- [ ] Remove BOT_API_KEY from frontend
- [ ] Remove hardcoded fake members
- [ ] Remove local JSON file dependencies
- [ ] Test TypeScript build (no errors)
- [ ] Test API build

## Environment Variables Needed

### Supabase
```
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]
```

### Discord
```
DISCORD_CLIENT_ID=[your_client_id]
DISCORD_CLIENT_SECRET=[your_client_secret]
DISCORD_REDIRECT_URI=https://stg-warzone.vercel.app/auth/callback
DISCORD_TOKEN=[your_bot_token]
```

### STG Config
```
GUILD_ID=[your_guild_id]
ADMIN_ROLE_IDS=[role_id1,role_id2]
MODERATOR_ROLE_IDS=[role_id3]
DASHBOARD_ALLOWED_ROLE_IDS=[role_id4,role_id5]
```

### API
```
BOT_API_KEY=[unique_secure_key]
JWT_SECRET_KEY=[unique_secure_key]
FRONTEND_URL=https://stg-warzone.vercel.app
API_BASE_URL=https://[your-replit].replit.dev
```

## Files Created

### Backend
- `backend/core/__init__.py`
- `backend/core/main.py` - FastAPI app
- `backend/core/config.py` - Configuration
- `backend/core/models.py` - SQLAlchemy models
- `backend/core/schemas.py` - Pydantic schemas
- `backend/core/database.py` - DB connection
- `backend/core/dependencies.py` - Auth deps
- `backend/core/routes/__init__.py`
- `backend/core/routes/auth.py` - Auth endpoints
- `backend/core/routes/bot_sync.py` - Bot sync
- `backend/core/routes/admin.py` - Admin dashboard
- `backend/requirements.txt`
- `backend/.env.example`
- `backend/README.md`

### Database
- `supabase/migrations/20260527000001_create_discord_tables.sql`

### Frontend (Updated)
- `frontend/src/services/adminService.ts`
- `frontend/src/utils/permissions.ts`
- `frontend/src/components/auth/ProtectedRoute.tsx`
- `frontend/src/App.tsx`
- `frontend/src/pages/Dashboard.tsx` (partial)

## Key Architectural Decisions

1. **Single Source of Truth**: Supabase is the official data source, not JSON files
2. **Permission Calculation**: Done on sync (when bot sends data), stored in DB
3. **No JWT caching**: /auth/me always checks DB for fresh permissions
4. **Stateless API**: Can run multiple instances on Replit
5. **CORS Enabled**: For Vercel frontend access
6. **Role-based Access**: Admin/Moderator/Dashboard access controlled by flags

## Success Criteria

✅ = Complete, ⏳ = In Progress, ⚠️ = Needs Testing

- ✅ Backend API structure created
- ✅ Database schema ready
- ✅ Frontend services updated
- ✅ Permission system updated
- ✅ Routes protected properly
- ⏳ Dashboard showing real data
- ⏸️ Admin page showing real members
- ⏸️ Navigation redesigned
- ⏸️ Deployed to production
- ⏸️ Bot integration tested

## Next Immediate Steps

1. **Deploy Backend** - Push to Replit
2. **Apply Migration** - Supabase SQL
3. **Test Auth** - OAuth login
4. **Update Dashboard** - Verify real data loads
5. **Admin Page** - Show real members
6. **Deploy Frontend** - Vercel
7. **Integration Test** - Full end-to-end
