# STG Frontend

Frontend React/Vite do STG | Supremo Tribunal Gamer.

## Estrutura

- `src/pages`: telas publicas, perfil, dashboard e configuracoes.
- `src/components`: layout, UI, cards e componentes administrativos.
- `src/context/AuthContext.tsx`: sessao Discord baseada no token da API Replit.
- `src/services`: acesso ao Supabase para conteudo e clientes HTTP para Discord/bot.
- `src/utils`: permissoes e validacao de URLs.
- `docs`: contrato da API e guia de deploy.

## Arquitetura

Loja, torneios e operacoes Warzone usam Supabase PostgREST diretamente com
`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Escritas sao protegidas por RLS
e pelas claims do token emitido no login Discord.

A API Replit continua responsavel por login, validacao de cargos do Discord,
sincronizacao do bot e dados administrativos do Discord. O frontend nunca usa
`service_role`, tokens do bot ou secrets de provedores.

Quando as variaveis do Supabase nao estao configuradas, loja e torneios usam
um fallback local demonstrativo. Em producao, configure o Supabase e aplique a
migration `stg-platform/supabase/migrations/20260621000003_store_tournaments_direct.sql`.

## Rodar Local

```bash
cd stg-platform/frontend
npm install
npm run dev
```

## Validar

```bash
npm run typecheck
npm run lint
npm run build
```

## Variaveis

Crie `.env` local a partir de `.env.example`:

```env
VITE_API_BASE_URL=https://URL-DA-API-REPLIT
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_publica
VITE_DISCORD_INVITE_URL=https://discord.gg/SEU_CONVITE
VITE_REQUIRE_AUTH=false
VITE_ALLOWED_HOSTS=
```

Nao coloque secrets no frontend.

## Deploy Vercel

Configure o projeto na Vercel com:

```text
Root Directory: stg-platform/frontend
Framework Preset: Vite
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

Configure `VITE_API_BASE_URL` apontando para a API do Replit e as duas
variaveis publicas do Supabase. Nunca configure `SUPABASE_SERVICE_ROLE_KEY` na
Vercel.

Na API Replit, configure `SUPABASE_JWT_SECRET` com o JWT secret legado do mesmo
projeto Supabase. Depois dessa troca, usuarios com sessao antiga precisam
entrar novamente para receber um token com as claims de RLS.

## Endpoints

O contrato esperado esta em [docs/API_CONTRACT.md](docs/API_CONTRACT.md).
O guia de deploy da arquitetura completa esta em [docs/DEPLOY.md](docs/DEPLOY.md).
