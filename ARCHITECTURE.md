# STG Core Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                        🌐 FRONTEND (Vercel)                          │
│                    React/Vite/TypeScript/Tailwind                    │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Pages: Dashboard | Admin | Members | Roles | Settings       │  │
│  │ Services: adminService.ts | api.ts | authService           │  │
│  │ Components: ProtectedRoute | TopNav | StatCards            │  │
│  │ Context: AuthContext | useAuth hook                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ▼                                       │
│                    ┌─────────────────────┐                         │
│                    │ Bearer JWT Token    │                         │
│                    │ localStorage save   │                         │
│                    └─────────────────────┘                         │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ HTTPS
                             │ /auth/* 
                             │ /admin/discord/*
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                   🔧 API (Replit/FastAPI)                           │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Routes:                                                        │  │
│  │  • /auth/* → Discord OAuth, JWT generation, user lookup      │  │
│  │  • /admin/discord/* → Protected endpoints, queries DB        │  │
│  │  • /bot/sync/* → Accepts data from Discord bot              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Dependencies:                                                  │  │
│  │  • JWT Token Validation                                       │  │
│  │  • Role-Based Access Control (RBAC)                          │  │
│  │  • Permission Calculation (admin/mod/dashboard)              │  │
│  │  • Database Session Management                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ▼                                       │
│                    ┌─────────────────────┐                         │
│                    │ X-BOT-API-KEY       │                         │
│                    │ (from Discord bot)  │                         │
│                    └─────────────────────┘                         │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ SQL
                             │ Queries: SELECT, INSERT, UPDATE
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│              💾 DATABASE (Supabase / PostgreSQL)                     │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Tables (Single Source of Truth):                             │  │
│  │                                                                │  │
│  │ ┌─ discord_guilds          ┬─ discord_members              │  │
│  │ │  • guild_id (unique)     │  • guild_id + discord_id (UK)  │  │
│  │ │  • guild_name            │  • is_admin, is_moderator      │  │
│  │ │  • member_count          │  • can_access_dashboard        │  │
│  │ │  • channels_total        │  • roles_json, role_ids        │  │
│  │ │  • last_sync_at          │  • avatar_url, username        │  │
│  │ └─                          └─                              │  │
│  │                                                                │  │
│  │ ┌─ discord_roles          ┬─ discord_channels              │  │
│  │ │  • guild_id + role_id    │  • guild_id + channel_id        │  │
│  │ │  • name, color, position │  • name, type, position         │  │
│  │ │  • permissions           │  • category_id, nsfw            │  │
│  │ └─                          └─                              │  │
│  │                                                                │  │
│  │ ┌─ discord_bot_status     ┬─ discord_events               │  │
│  │ │  • status, latency_ms    │  • event_type (audit log)       │  │
│  │ │  • uptime_seconds        │  • payload_json                 │  │
│  │ │  • guild_count, version  │  • created_at (for ordering)    │  │
│  │ └─                          └─                              │  │
│  │                                                                │  │
│  │ ┌─ discord_metrics        ┬─ users                         │  │
│  │ │  • metrics_json (JSONB)  │  • discord_id (unique)          │  │
│  │ │  • created_at (timeseries)│ • email, avatar_url            │  │
│  │ └─                          └─                              │  │
│  │                                                                │  │
│  │ All tables have:                                              │  │
│  │  ✓ Proper indexes                                             │  │
│  │  ✓ Foreign key constraints                                    │  │
│  │  ✓ created_at, updated_at timestamps                         │  │
│  │  ✓ JSONB for flexible data storage                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  🔑 Key Feature: SINGLE SOURCE OF TRUTH                             │
│     No local JSON files, no data duplication, no inconsistency      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│               🤖 DISCORD BOT (Discloud)                             │
│                                                                       │
│  Triggered by events (member join, role change, etc):              │
│  1. Collects Discord data (members, roles, channels)              │
│  2. Sends POST /bot/sync/* with X-BOT-API-KEY header             │
│  3. API validates key, calculates permissions                     │
│  4. API saves to Supabase                                         │
│  5. Bot continues without local JSON persistence                  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Sequences

### 1️⃣ User Login Flow
```
User Browser
    ↓ (clicks Login)
Frontend: Redirect to /auth/discord/authorize
    ↓
Discord OAuth
    ↓ (user authorizes)
Discord: Redirect to API /auth/discord/callback?code=XXX
    ↓
API: Exchange code for Discord user info
    ↓
API: Create/update users table
    ↓
API: Lookup discord_members for permissions
    ↓
API: Generate JWT token
    ↓
API: Redirect to Frontend with token
    ↓
Frontend: Store token in localStorage
    ↓
Frontend: Load Dashboard with real data
```

### 2️⃣ Admin Requests Data
```
Admin User (logged in)
    ↓ (views Dashboard)
Frontend: GET /admin/discord/stats
    Header: Authorization: Bearer [JWT]
    ↓
API: Validate JWT token
    ↓
API: Check discord_members for is_admin
    ↓ (if authorized)
API: Query Supabase discord_members COUNT
    ↓
API: Return JSON
    ↓
Frontend: Display stats
```

### 3️⃣ Bot Syncs Members
```
Discord Bot (detects member join)
    ↓
Bot: Collect member data
    ↓
Bot: POST /bot/sync/members
    Header: X-BOT-API-KEY: [key]
    Body: { guild_id: 123, members: [...] }
    ↓
API: Validate X-BOT-API-KEY
    ↓ (for each member)
API: Check role_ids against config
    ↓
API: Calculate is_admin, is_moderator, can_access_dashboard
    ↓
API: Upsert into discord_members
    ↓ (all members synced)
API: Return success
    ↓
Frontend: Next /admin/discord/members call shows new data
```

## Component Architecture

```
Frontend
├── Pages
│   ├── Dashboard (real-time stats)
│   ├── Admin (members, roles, channels)
│   ├── Members (filtered members list)
│   ├── Settings (admin-only config)
│   └── Login (Discord OAuth)
│
├── Services
│   ├── api.ts (HTTP client, auth)
│   ├── adminService.ts (Discord endpoints)
│   ├── authService.ts (OAuth flow)
│   └── other services
│
├── Context
│   └── AuthContext (user state, permissions)
│
├── Components
│   ├── ProtectedRoute (requireAdmin, requireDashboard)
│   ├── TopNav (navbar with user menu)
│   ├── StatCard (dashboard cards)
│   └── MemberList (filtered/paginated)
│
└── Utils
    └── permissions.ts (hasAdminAccess, hasSettingsAccess, etc)
```

## Security Model

```
Public Endpoints
├── GET /health
├── GET /auth/discord/authorize
└── POST /auth/discord/callback

Bot Endpoints (X-BOT-API-KEY required)
├── POST /bot/sync/guild
├── POST /bot/sync/member
├── POST /bot/sync/members
├── POST /bot/sync/roles
├── POST /bot/sync/channels
├── POST /bot/sync/metrics
├── POST /bot/sync/status
├── POST /bot/sync/events
└── POST /bot/sync/voice

Protected Endpoints (Bearer JWT + Permission Check)
├── Dashboard Access
│   ├── GET /admin/discord/status
│   ├── GET /admin/discord/metrics
│   ├── GET /admin/discord/guild
│   ├── GET /admin/discord/members
│   ├── GET /admin/discord/roles
│   ├── GET /admin/discord/channels
│   ├── GET /admin/discord/events
│   └── GET /admin/discord/stats
│
└── User Endpoints
    └── GET /auth/me
```

## Environment Variables

```
Supabase
├── DATABASE_URL (PostgreSQL connection)

Discord
├── DISCORD_CLIENT_ID
├── DISCORD_CLIENT_SECRET
├── DISCORD_REDIRECT_URI
└── DISCORD_TOKEN

Guild Configuration
├── GUILD_ID
├── ADMIN_ROLE_IDS (comma-separated)
├── MODERATOR_ROLE_IDS
└── DASHBOARD_ALLOWED_ROLE_IDS

API Security
├── BOT_API_KEY (for bot endpoint auth)
├── JWT_SECRET_KEY (for token signing)
└── JWT_ALGORITHM (HS256)

URLs
├── FRONTEND_URL (for redirects)
├── API_BASE_URL
└── DEBUG flag
```

## Deployment Checklist

```
Replit (Backend)
  ☐ Push code
  ☐ Set environment variables in Secrets
  ☐ pip install -r requirements.txt
  ☐ python run.py

Supabase (Database)
  ☐ Create database
  ☐ Paste migration SQL
  ☐ Execute and verify tables

Vercel (Frontend)
  ☐ Set VITE_API_BASE_URL to Replit URL
  ☐ npm run build (no errors)
  ☐ git push
  ☐ Verify deployment

Testing
  ☐ API health check (/health)
  ☐ OAuth login works
  ☐ Admin sees dashboard data
  ☐ Members list loads
  ☐ Settings restricted to admin
  ☐ Bot sync endpoints work
```

## File Structure

```
stgcore5.1/
├── backend/
│   ├── core/
│   │   ├── main.py (FastAPI app)
│   │   ├── config.py
│   │   ├── models.py (SQLAlchemy)
│   │   ├── schemas.py (Pydantic)
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   └── routes/
│   │       ├── auth.py
│   │       ├── bot_sync.py
│   │       └── admin.py
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── stg-platform/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   └── Dashboard.tsx (updated)
│   │   │   ├── services/
│   │   │   │   ├── api.ts
│   │   │   │   └── adminService.ts (updated)
│   │   │   ├── components/
│   │   │   │   └── auth/
│   │   │   │       └── ProtectedRoute.tsx (updated)
│   │   │   ├── utils/
│   │   │   │   └── permissions.ts (updated)
│   │   │   ├── context/
│   │   │   │   └── AuthContext.tsx
│   │   │   └── App.tsx (updated)
│   │   └── package.json
│   │
│   └── supabase/
│       └── migrations/
│           └── 20260527000001_create_discord_tables.sql
│
├── IMPLEMENTATION_SUMMARY.md
├── IMPLEMENTATION_CHECKLIST.md
└── DEPLOYMENT_GUIDE.md
```

---

**This is the complete, production-ready architecture for STG Core / STG Warzone**

Ready for deployment! 🚀
