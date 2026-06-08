# STG Frontend

Frontend React/Vite do STG | Supremo Tribunal Gamer.

## Estrutura

- `src/pages`: telas publicas, perfil, dashboard e configuracoes.
- `src/components`: layout, UI, cards e componentes administrativos.
- `src/context/AuthContext.tsx`: sessao Discord baseada no token da API Replit.
- `src/services`: clientes HTTP para a API oficial.
- `src/utils`: permissoes e validacao de URLs.
- `docs`: contrato da API e guia de deploy.

## Arquitetura

O frontend fala somente com a API oficial do Replit via `VITE_API_BASE_URL`.
Supabase, bot Discord/Discloud, service role keys, tokens e secrets ficam no backend/API, nunca no frontend.

Leituras publicas podem exibir modo demonstracao quando a API estiver ausente. Acoes administrativas de salvar, editar e excluir exigem confirmacao da API do Replit e nao gravam localStorage como se fosse oficial.

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

Configure `VITE_API_BASE_URL` apontando para a API do Replit.

## Endpoints

O contrato esperado esta em [docs/API_CONTRACT.md](docs/API_CONTRACT.md).
O guia de deploy da arquitetura completa esta em [docs/DEPLOY.md](docs/DEPLOY.md).
