# STG | Supremo Tribunal Gamer

Projeto organizado em tres partes independentes:

- `frontend/`: React + Vite.
- `backend/`: API FastAPI.
- `bot/`: bot Discord.
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
VITE_API_BASE_URL=https://URL-DA-SUA-API-REPLIT
VITE_REQUIRE_AUTH=false
```

## API

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn core.main:app --host 0.0.0.0 --port 8000
```

Configure `backend/.env` a partir de `backend/.env.example`.

## Bot

```bash
cd bot
pip install -r requirements.txt
python main.py
```

Configure `bot/.env`:

```env
DISCORD_BOT_TOKEN=
API_BASE_URL=http://127.0.0.1:8000
BOT_API_KEY=
GUILD_ID=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/auto
```

Se bot e API estiverem no mesmo Replit, `API_BASE_URL` pode ser `http://127.0.0.1:8000`.
Se o bot estiver separado da API, use a URL publica da API Replit.

## Observacoes

O frontend deve consumir a API via `VITE_API_BASE_URL`.
O bot deve consumir a API via `API_BASE_URL` e `BOT_API_KEY`.
Secrets reais devem ficar apenas em arquivos `.env` locais ou secrets do Replit.
