# STG Core Deployment Quick Start

## 1. Backend (Replit)

### Clone/Push code
```bash
git push  # or upload backend/ folder
```

### Set Environment Variables
In Replit Secrets:
```
DATABASE_URL=postgresql://...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_TOKEN=...
GUILD_ID=...
ADMIN_ROLE_IDS=...
MODERATOR_ROLE_IDS=...
DASHBOARD_ALLOWED_ROLE_IDS=...
BOT_API_KEY=...
JWT_SECRET_KEY=...
FRONTEND_URL=https://stg-warzone.vercel.app
DEBUG=false
```

### Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### Apply Database Migration
Go to Supabase → SQL Editor → Paste from:
`supabase/migrations/20260527000001_create_discord_tables.sql`

### Run
```bash
python stg-platform/run.py
```

API will be at: `https://[your-replit].replit.dev`

## 2. Frontend (Vercel)

### Update Environment
In Vercel Project Settings → Environment Variables:
```
VITE_API_BASE_URL=https://[your-replit].replit.dev
```

### Build & Deploy
```bash
cd stg-platform/frontend
npm run build
```

Then push to GitHub and Vercel will auto-deploy.

### Test
- Go to `https://stg-warzone.vercel.app`
- Click "Login with Discord"
- Should redirect to Discord OAuth
- After auth, should see admin panel if user is admin

## 3. Bot (Discloud)

### Update Bot Code
Make sure bot sends data to API:
```python
API_BASE_URL = "https://[your-replit].replit.dev"
BOT_API_KEY = "[same as backend]"

# When syncing members:
POST /bot/sync/members
Header: X-BOT-API-KEY: [BOT_API_KEY]
Body: { "guild_id": ..., "members": [...] }
```

### Deploy to Discloud
Follow Discloud deployment steps with bot code using API

## 4. Testing Checklist

- [ ] API health: `https://[your-replit].replit.dev/health`
- [ ] OAuth: Can login with Discord
- [ ] Admin page: Admin user sees dashboard
- [ ] Members: Admin can see real Discord members
- [ ] Data persists: Restart Replit, data still there
- [ ] Bot syncs: Members update in dashboard after bot action
- [ ] Settings: Only admin can access `/settings`

## API Docs

Interactive API documentation available at:
```
https://[your-replit].replit.dev/docs
```

## Debugging

### Check Backend Logs (Replit)
- Console output shows all requests
- Enable `DEBUG=true` for verbose logging

### Check Bot Sync
- Verify `X-BOT-API-KEY` header is correct
- Check Supabase tables for new data
- Look for POST to `/bot/sync/members` in Replit logs

### Check Frontend
- Browser dev tools → Network tab
- Verify API calls to `/admin/discord/*`
- Check localStorage for `stg_auth_token`

### Database Queries
Supabase SQL Editor:
```sql
SELECT COUNT(*) FROM discord_members;
SELECT * FROM discord_guilds;
SELECT * FROM discord_events ORDER BY created_at DESC LIMIT 10;
```

## Common Issues

**404 on /admin/discord/members**
- User not authenticated or token expired
- User doesn't have dashboard access
- API not running

**Bot API key rejected**
- Header must be: `X-BOT-API-KEY: [exact_key]`
- Check for spaces or typos in key
- Verify key matches BOT_API_KEY in .env

**OAuth fails**
- Check DISCORD_REDIRECT_URI matches frontend
- Verify Discord app settings
- Check DISCORD_CLIENT_ID and SECRET are correct

**Data not persisting**
- Check DATABASE_URL is correct
- Verify Supabase migration was applied
- Look for SQL errors in Supabase logs

## Support

For questions about:
- **API**: See `backend/README.md`
- **Frontend**: See `stg-platform/frontend/README.md`
- **Database**: See `supabase/migrations/`
- **Architecture**: See root `IMPLEMENTATION_CHECKLIST.md`
