# 🔐 Variáveis de Ambiente - Discord OAuth

## Backend (Replit / API FastAPI)

### Criação do `.env` ou Configuração em Replit

Adicione as seguintes variáveis de ambiente no seu backend:

```
# Discord OAuth Configuration
DISCORD_CLIENT_ID=seu_client_id_aqui
DISCORD_CLIENT_SECRET=seu_client_secret_aqui
DISCORD_REDIRECT_URI=https://sua-api.com/auth/discord/callback

# URLs
FRONTEND_URL=https://seu-frontend.com
API_BASE_URL=https://sua-api.com

# Database
DATABASE_URL=sqlite:///./test.db

# Opcional: Mapeamento de Roles do Discord
DISCORD_GUILD_ID=seu_guild_id
DISCORD_BOT_TOKEN=seu_bot_token
DISCORD_ADMIN_ROLE_IDS=role_id_1,role_id_2
DISCORD_MODERADOR_ROLE_IDS=role_id_3,role_id_4
DISCORD_STAFF_ROLE_IDS=role_id_5,role_id_6
DISCORD_ESPORTES_ROLE_IDS=role_id_7,role_id_8
DISCORD_FINANCEIRO_ROLE_IDS=role_id_9,role_id_10
DISCORD_INFRA_ROLE_IDS=role_id_11,role_id_12
```

### Para Ambiente Local/Desenvolvimento

```
DISCORD_CLIENT_ID=seu_client_id_aqui
DISCORD_CLIENT_SECRET=seu_client_secret_aqui
DISCORD_REDIRECT_URI=http://localhost:8000/auth/discord/callback
FRONTEND_URL=http://localhost:5173
API_BASE_URL=http://localhost:8000
DATABASE_URL=sqlite:///./test.db
```

### Para Produção (Vercel/Netlify)

```
DISCORD_CLIENT_ID=seu_client_id_aqui
DISCORD_CLIENT_SECRET=seu_client_secret_aqui
DISCORD_REDIRECT_URI=https://api.seudominio.com/auth/discord/callback
FRONTEND_URL=https://www.seudominio.com
API_BASE_URL=https://api.seudominio.com
DATABASE_URL=postgresql://user:password@host:5432/db
```

---

## Frontend (React/Vite)

### Arquivo `.env` do Frontend

```
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Opcional: URL customizada para login Discord
# Se não configurar, usa VITE_API_BASE_URL/auth/discord/start
VITE_DISCORD_LOGIN_URL=http://localhost:8000/auth/discord/start

# Autenticação
VITE_REQUIRE_AUTH=true
```

### Para Produção

```
VITE_API_BASE_URL=https://api.seudominio.com
VITE_DISCORD_LOGIN_URL=https://api.seudominio.com/auth/discord/start
VITE_REQUIRE_AUTH=true
```

---

## 🔑 Onde Obter Valores

### DISCORD_CLIENT_ID e DISCORD_CLIENT_SECRET

1. Ir para [Discord Developer Portal](https://discord.com/developers/applications)
2. Criar ou selecionar aplicação
3. Ir para "OAuth2" → "General"
4. Copiar **CLIENT ID** (DISCORD_CLIENT_ID)
5. Copiar **CLIENT SECRET** (DISCORD_CLIENT_SECRET)

### DISCORD_REDIRECT_URI

Deve ser exatamente igual ao cadastrado em Discord Developer Portal > OAuth2 > Redirects

**Exemplo**:
- Local: `http://localhost:8000/auth/discord/callback`
- Produção: `https://api.seudominio.com/auth/discord/callback`

### DISCORD_GUILD_ID

ID do servidor Discord (Server ID):
1. Ativar "Developer Mode" no Discord
2. Clicar direito no servidor
3. "Copy Server ID"

### DISCORD_BOT_TOKEN

1. Discord Developer Portal > Bot
2. "Copy" embaixo de TOKEN

### Role IDs

1. Ativar "Developer Mode" no Discord
2. Clicar direito em um role
3. "Copy Role ID"

---

## ✅ Checklist de Validação

- [ ] `DISCORD_CLIENT_ID` preenchido (não vazio)
- [ ] `DISCORD_CLIENT_SECRET` preenchido (não vazio)
- [ ] `DISCORD_REDIRECT_URI` registrado em Discord Developer Portal
- [ ] `FRONTEND_URL` apontando para domínio correto
- [ ] `API_BASE_URL` apontando para API correta
- [ ] URLs usam `https://` em produção
- [ ] URLs usam `http://localhost` em desenvolvimento
- [ ] `VITE_API_BASE_URL` configurado no frontend

---

## 🔒 Segurança

⚠️ **IMPORTANTE**:
- NUNCA exponha `DISCORD_CLIENT_SECRET` no frontend
- NUNCA faça commit de `.env` com valores reais
- Use `.env.example` para documentar as variáveis
- Em produção, use variáveis de ambiente do serviço (Replit, Vercel, etc)
- Proteja `DISCORD_BOT_TOKEN` - é equivalente à sua senha do Discord

---

## 🐛 Troubleshooting

| Erro | Variável | Solução |
|------|----------|---------|
| `DISCORD_CLIENT_ID not configured` | DISCORD_CLIENT_ID | Verificar se está preenchida |
| `Invalid OAuth2 redirect URL` | DISCORD_REDIRECT_URI | Verificar se bate com Discord Portal |
| `Invalid client_id` | DISCORD_CLIENT_ID | Verificar se foi copiad corretamente |
| `Invalid client_secret` | DISCORD_CLIENT_SECRET | Verificar se foi copiada corretamente |
| Página fica carregando | VITE_API_BASE_URL | Verificar se API está rodando |
| CORS error | API_BASE_URL | Verificar se está correto e CORS está ativo |

---

## 📚 Referências

- [Discord OAuth Docs](https://discord.com/developers/docs/topics/oauth2)
- [Arquivo de Setup Completo](./DISCORD_OAUTH_SETUP.md)
- [Guia Rápido](./DISCORD_OAUTH_QUICK_SETUP.md)
- [Documentação de Correções](./DISCORD_LOGIN_FIXES.md)
