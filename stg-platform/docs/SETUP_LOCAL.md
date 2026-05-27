# Setup Local - STG | Supremo Tribunal Gamer

## Pré-requisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Python** >= 3.8 (para o backend/bot)
- **Git**

## Instalação do Frontend

### 1. Clonar/Navegar para o projeto

```bash
cd c:\Users\bruno\OneDrive\Desktop\stg-main
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto:

```bash
# Para desenvolvimento local (backend em localhost:8000)
VITE_API_BASE_URL=http://localhost:8000
VITE_REQUIRE_AUTH=false
```

Ou para produção (usando API do Replit):

```bash
# Para produção
VITE_API_BASE_URL=https://8bed2244-490f-4907-ba9b-a4bc0a13fa34-00-20zdrbzko8m3p.janeway.replit.dev:8000
VITE_REQUIRE_AUTH=false
```

**Supabase (Opcional)**

Se deseja habilitar autenticação com Supabase, adicione ao `.env`:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=seu-anon-key-aqui
VITE_REQUIRE_AUTH=true
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:5173

### 5. Build para produção

```bash
npm run build
```

Output estará em `dist/`

### 6. Preview da build

```bash
npm run preview
```

---

## Instalação do Backend (FastAPI)

### 1. Navegar para o backend

```bash
cd stg-core-cleanzip/stg-core-cleanzip/core
```

### 2. Criar virtualenv

```bash
python -m venv venv
```

Ativar:
- **Windows (PowerShell)**: `.\venv\Scripts\Activate.ps1`
- **Windows (CMD)**: `venv\Scripts\activate.bat`
- **Linux/Mac**: `source venv/bin/activate`

### 3. Instalar dependências

```bash
pip install -r requirements.txt
```

### 4. Rodar a API

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

API estará disponível em: http://localhost:8000

Documentação interativa (Swagger): http://localhost:8000/docs

---

## Instalação do Bot Discord

### 1. Navegar para o bot

```bash
cd stg-core-cleanzip/stg-core-cleanzip/bot
```

### 2. Criar virtualenv

```bash
python -m venv venv
```

Ativar (mesmo processo do backend)

### 3. Instalar dependências

```bash
pip install -r requirements.txt
```

### 4. Configurar variáveis de ambiente

Crie `.env` na pasta `bot/`:

```bash
# API Configuration
API_BASE_URL=http://localhost:8000
BOT_API_KEY=stgbottzim

# Discord
DISCORD_BOT_TOKEN=seu_token_do_bot_aqui
GUILD_ID=seu_guild_id_aqui
```

### 5. Rodar o bot

```bash
python main.py
```

---

## Verificar Integração

### 1. Verificar API

```bash
curl http://localhost:8000/health
```

Resposta esperada:
```json
{
  "status": "online",
  "service": "STG Core API",
  "version": "1.0.0",
  "bot_integration": true,
  "timestamp": "..."
}
```

### 2. Verificar Frontend

Abra http://localhost:5173 no navegador

Você deve ver:
- ✅ Landing page carregando
- ✅ Top 3 ranking preenchido
- ✅ Dashboard acessível (sem login em modo dev)

### 3. Verificar Endpoints Públicos

```bash
# Overview
curl http://localhost:8000/public/overview

# Ranking
curl http://localhost:8000/public/ranking?limit=5

# Produtos
curl http://localhost:8000/public/products

# Torneios
curl http://localhost:8000/public/tournaments
```

---

## Estrutura de Arquivos

```
stg-main/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Router
│   ├── services/api.ts             # Chamadas HTTP
│   ├── context/AuthContext.tsx     # Autenticação (Supabase)
│   ├── components/
│   │   ├── auth/ProtectedRoute.tsx # Guard de rotas
│   │   ├── layout/                 # Layout components
│   │   ├── cards/                  # Stat/Ranking cards
│   │   └── ui/                     # shadcn/ui components
│   ├── pages/                      # Pages do app
│   ├── lib/supabase.ts             # Supabase client
│   └── types/api.ts                # Types/interfaces
├── .env                            # Variáveis de ambiente (local)
├── .env.production                 # Variáveis de produção
├── .env.example                    # Template
├── vite-env.d.ts                   # Tipos Vite
├── vite.config.ts                  # Configuração Vite
├── tsconfig.json                   # Config TypeScript
└── package.json                    # Dependências

stg-core-cleanzip/stg-core-cleanzip/
├── core/                           # Backend API
│   ├── main.py                     # FastAPI app
│   ├── routes/
│   │   ├── public.py               # Endpoints públicos
│   │   ├── bot.py                  # Endpoints /bot
│   │   └── auth.py                 # Autenticação
│   ├── models/                     # Database models
│   └── stg_core.db                 # SQLite database
└── bot/                            # Discord bot
    ├── main.py                     # Bot entry point
    ├── api_client.py               # HTTP client
    ├── commands.py                 # Slash commands
    ├── events.py                   # Event handlers
    └── .env                        # Config bot
```

---

## Variáveis de Ambiente Explicadas

### Frontend (`.env`)

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `VITE_API_BASE_URL` | ✅ Sim | `http://localhost:8000` | URL da API |
| `VITE_SUPABASE_URL` | ❌ Não | - | URL do Supabase (auth) |
| `VITE_SUPABASE_ANON_KEY` | ❌ Não | - | Chave anônima Supabase |
| `VITE_REQUIRE_AUTH` | ❌ Não | `false` | Exigir login |

### Bot (`.env`)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `API_BASE_URL` | ✅ Sim | URL da API (localhost ou Replit) |
| `BOT_API_KEY` | ✅ Sim | X-Bot-Api-Key para autenticação |
| `DISCORD_BOT_TOKEN` | ✅ Sim | Token do bot no Discord |
| `GUILD_ID` | ✅ Sim | ID do servidor Discord |

---

## Troubleshooting

### Frontend não conecta na API

**Problema:** Dashboard mostra "API Offline"

**Solução:**
1. Verificar se backend está rodando: `curl http://localhost:8000/health`
2. Verificar `VITE_API_BASE_URL` em `.env`
3. Verificar CORS: Backend deve ter `allow_origins=["*"]`

### Supabase error

**Problema:** `Missing Supabase environment variables`

**Solução:**
- Se não usa Supabase, deixe `.env` sem as vars ou defina `VITE_REQUIRE_AUTH=false`
- Se usa Supabase, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`

### Bot não conecta na API

**Problema:** Bot offline ou erros ao usar comandos

**Solução:**
1. Verificar `API_BASE_URL` em `bot/.env`
2. Verificar `BOT_API_KEY` (deve bater com backend)
3. Verificar `DISCORD_BOT_TOKEN` é válido
4. Logs: `python main.py` deve mostrar mensagens de conexão

---

## Deploy na Vercel

### 1. Build localmente

```bash
npm run build
```

Gera pasta `dist/`

### 2. Conectar GitHub

- Push projeto para GitHub
- Criar account em vercel.com
- Conectar repositório

### 3. Configurar Environment Variables

Em **Vercel Dashboard** → **Settings** → **Environment Variables**:

```
VITE_API_BASE_URL=https://8bed2244-490f-4907-ba9b-a4bc0a13fa34-00-20zdrbzko8m3p.janeway.replit.dev:8000
VITE_REQUIRE_AUTH=false
```

### 4. Deploy

Vercel faz deploy automático em cada push para `main`

---

## Próximos Passos

- [ ] Configurar Supabase (se necessário)
- [ ] Adicionar CI/CD (GitHub Actions)
- [ ] Adicionar testes (Jest + React Testing Library)
- [ ] Adicionar monitoring (Sentry)
- [ ] Documentar API endpoints
- [ ] Criar guia de contribuição
