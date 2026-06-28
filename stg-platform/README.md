# STG | Supremo Tribunal Gamer

Projeto organizado para rodar o site e a API no mesmo deploy Vercel:

- `frontend/`: React + Vite.
- `api/`: API FastAPI serverless para Vercel.
- `backend/`: API FastAPI legada/local de transicao.
- `supabase/`: migrations do banco.
- `docs/`: documentacao, relatorios e arquivos auxiliares.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Build:

```bash
cd frontend
npm run build
```

Preview:

```bash
cd frontend
npm run preview
```

Configure `frontend/.env`:

```env
VITE_API_BASE_URL=/api
VITE_REQUIRE_AUTH=false
```

## API

Em producao, a API roda como Vercel Function em `api/index.py`.

Para testar localmente:

```bash
pip install -r requirements.txt
python -m uvicorn api.index:app --host 0.0.0.0 --port 8000
```

Configure os secrets no painel da Vercel conforme `.env.example`.

## Bot

```bash
cd bot
pip install -r requirements.txt
python main.py
```

Configure `bot/.env`:

```env
DISCORD_BOT_TOKEN=
API_BASE_URL=https://seu-dominio.vercel.app/api
BOT_API_KEY=
GUILD_ID=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/auto
```

## Observacoes

O frontend deve consumir a API via `/api` no mesmo dominio da Vercel.
O bot deve consumir a API via `API_BASE_URL` e `BOT_API_KEY`.
Secrets reais devem ficar apenas em arquivos `.env` locais ou secrets da Vercel/Discloud.
