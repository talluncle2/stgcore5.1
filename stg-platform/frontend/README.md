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
