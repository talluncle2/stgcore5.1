# STG Core Deployment Quick Start

## 1. Vercel

Configure o projeto da Vercel com root directory:

```text
stg-platform
```

O arquivo `stg-platform/vercel.json` publica:

- frontend Vite em `frontend/dist`
- API FastAPI serverless em `/api/*`

Rotas principais:

```text
https://seu-dominio.vercel.app/
https://seu-dominio.vercel.app/api/health
https://seu-dominio.vercel.app/api/auth/discord/login
https://seu-dominio.vercel.app/api/bot/sync/*
```

## 2. Variaveis da Vercel

Publicas:

```env
VITE_API_BASE_URL=/api
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_EXEMPLO
VITE_DISCORD_INVITE_URL=https://discord.gg/SEU_CONVITE
```

Secrets server-side:

```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_REDIRECT_URI=https://seu-dominio.vercel.app/api/auth/discord/callback
FRONTEND_URL=https://seu-dominio.vercel.app
GUILD_ID=...
ADMIN_ROLE_IDS=...
MODERATOR_ROLE_IDS=...
DASHBOARD_ALLOWED_ROLE_IDS=...
CONTENT_CREATOR_ROLE_IDS=...
BOT_API_KEY=...
INTERNAL_SYNC_KEY=...
ENVIRONMENT=production
```

Nao coloque `BOT_API_KEY`, `DISCORD_CLIENT_SECRET`,
`SUPABASE_SERVICE_ROLE_KEY` ou `SUPABASE_JWT_SECRET` em variaveis `VITE_*`.

## 3. Supabase

Aplicar as migrations em:

```text
stg-platform/supabase/migrations/
```

A migration `20260628000009_vercel_api_content.sql` adiciona suporte para
conteudo administrativo persistido pela API Vercel.

## 4. Discord OAuth

No Discord Developer Portal, configure Redirect URI:

```text
https://seu-dominio.vercel.app/api/auth/discord/callback
```

## 5. Bot Discloud

O bot continua fora da Vercel, mas agora sincroniza com a API do proprio site:

```python
API_BASE_URL = "https://seu-dominio.vercel.app/api"
BOT_API_KEY = "mesmo valor configurado na Vercel"
```

Header:

```text
X-BOT-API-KEY: BOT_API_KEY
```

## 6. Validacao

```bash
cd stg-platform/frontend
npm run typecheck
npm run build
```

Depois do deploy:

- Abrir `/api/health`
- Testar login Discord
- Testar `/api/auth/me` com token salvo
- Sincronizar o bot em `/api/bot/sync/status`
- Verificar painel de Configuracoes
