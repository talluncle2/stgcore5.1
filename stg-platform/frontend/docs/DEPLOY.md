# Deploy

## Frontend: Vercel

Root directory:

```text
stg-platform/frontend
```

Comandos:

```text
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

Variaveis:

```env
VITE_API_BASE_URL=https://URL-DA-API-REPLIT
VITE_DISCORD_INVITE_URL=https://discord.gg/SEU_CONVITE
VITE_REQUIRE_AUTH=false
VITE_ALLOWED_HOSTS=
```

## API: Replit

A API FastAPI e a ponte oficial entre frontend, Supabase e bot. Ela deve expor os endpoints descritos em `docs/API_CONTRACT.md` e configurar CORS para o dominio da Vercel.

Secrets ficam no Replit:

- Supabase URL e service role.
- Discord OAuth client secret.
- Token do bot ou credenciais internas.
- Chaves de APIs externas.

## Database: Supabase

O Supabase e acessado pela API Replit. O frontend nao deve usar service role, RPC sensivel ou queries administrativas diretamente.

## Bot: Discloud

O bot Discord roda na Discloud e sincroniza dados com a API Replit. O frontend consulta status, guild, membros, cargos, canais e eventos somente pela API Replit.

## Checklist

1. `npm install`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build`
5. Configurar `VITE_API_BASE_URL` na Vercel.
6. Confirmar `/health` da API Replit.
7. Testar login Discord e `/auth/me`.
