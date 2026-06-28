# Deploy

## Vercel: frontend + API

Use o root directory:

```text
stg-platform
```

Comandos configurados em `stg-platform/vercel.json`:

```text
Install Command: cd frontend && npm install
Build Command: cd frontend && npm run build
Output Directory: frontend/dist
API: api/index.py
```

O frontend consome a API no mesmo dominio:

```env
VITE_API_BASE_URL=/api
```

Se `VITE_API_BASE_URL` nao for definido, o frontend tambem usa `/api` por padrao.

## Secrets da API na Vercel

Configure no painel da Vercel, nunca no frontend:

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
```

## Supabase

Aplicar as migrations em `stg-platform/supabase/migrations/`, incluindo:

```text
20260628000009_vercel_api_content.sql
```

O frontend pode usar a publishable key do Supabase para tabelas protegidas por RLS. Service role e JWT secret ficam apenas na API da Vercel.

## Bot: Discloud

O bot deve enviar dados para:

```text
https://seu-dominio.vercel.app/api/bot/sync/*
```

Header obrigatorio:

```text
X-BOT-API-KEY: valor-de-BOT_API_KEY
```

## Checklist

1. `npm install`
2. `npm run typecheck`
3. `npm run build`
4. Aplicar migrations no Supabase.
5. Configurar secrets da API na Vercel.
6. Confirmar `/api/health`.
7. Testar login Discord e `/api/auth/me`.
8. Atualizar o bot para chamar `/api/bot/sync/*`.
