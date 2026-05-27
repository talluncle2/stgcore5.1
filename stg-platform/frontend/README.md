# STG Frontend

Frontend React/Vite do STG | Supremo Tribunal Gamer.

## Rodar localmente

```bash
cd stg-platform/frontend
npm install
npm run dev
```

## Build

```bash
cd stg-platform/frontend
npm run build
```

## Variaveis de ambiente

Criar `frontend/.env` local:

```env
VITE_API_BASE_URL=https://URL-DA-API-REPLIT
VITE_REQUIRE_AUTH=false
```

Nao coloque secrets no frontend. Tokens e chaves de backend nao pertencem a este projeto.
Sem `VITE_API_BASE_URL`, o frontend usa apenas caminhos relativos e os dados administrativos caem no fallback local isolado quando a API nao responde.

## Deploy na Vercel

1. Subir o projeto para GitHub.
2. Importar o repositorio na Vercel.
3. Configurar Root Directory como:

```text
stg-platform/frontend
```

4. Configurar:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

5. Adicionar Environment Variables:

```env
VITE_API_BASE_URL=https://URL-DA-API-REPLIT
VITE_REQUIRE_AUTH=false
```

6. Fazer deploy.

## Observacao

O frontend nao contem backend, bot ou API. A API e o bot rodam no Replit. O frontend consome apenas a API configurada por `VITE_API_BASE_URL`.

## Paginas de conteudo

- `/noticias`: central publica com 3 hero carrosseis para anuncios, temporadas/torneios e novidades.
- `/admin/noticias` ou `/configuracoes/noticias`: gestao de noticias e banners.
- `/admin/loja` ou `/configuracoes/loja`: gestao de itens da loja, precos em STG Coins/BRL e descontos.
- `/admin/torneios` ou `/configuracoes/torneios`: gestao de torneios/campeonatos.

As paginas de gestao exigem admin, moderador ou `can_access_dashboard`. Enquanto endpoints administrativos reais nao estiverem disponiveis na API Replit, os services usam fallback em `localStorage`.
