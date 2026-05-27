# ⚡ Guia Rápido: Configurar Discord OAuth

## 1️⃣ Discord Developer Portal

### Passo 1: Criar Aplicação
1. Ir para [Discord Developer Portal](https://discord.com/developers/applications)
2. Clicar em "New Application"
3. Nomear como "STG" ou similar
4. Aceitar termos

### Passo 2: Copiar Credenciais
1. Ir para "OAuth2" → "General"
2. Copiar **CLIENT ID**
3. Copiar **CLIENT SECRET** (manter seguro!)

### Passo 3: Configurar Redirect URI
1. Ir para "OAuth2" → "Redirects"
2. Adicionar: `https://sua-api.com/auth/discord/callback`
   - Para local: `http://localhost:8000/auth/discord/callback`
3. Salvar

---

## 2️⃣ Backend (Replit / API)

Configurar no arquivo `.env` ou variáveis de ambiente:

```env
DISCORD_CLIENT_ID=seu_client_id_aqui
DISCORD_CLIENT_SECRET=seu_client_secret_aqui
DISCORD_REDIRECT_URI=https://sua-api.com/auth/discord/callback
FRONTEND_URL=https://seu-frontend.com
API_BASE_URL=https://sua-api.com
```

### Para Desenvolvimento Local:

```env
DISCORD_CLIENT_ID=seu_client_id_aqui
DISCORD_CLIENT_SECRET=seu_client_secret_aqui
DISCORD_REDIRECT_URI=http://localhost:8000/auth/discord/callback
FRONTEND_URL=http://localhost:5173
API_BASE_URL=http://localhost:8000
```

---

## 3️⃣ Frontend (React)

Verificar `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Se quiser customizar a URL de login:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_DISCORD_LOGIN_URL=http://localhost:8000/auth/discord/start
```

---

## 4️⃣ Testar

### Terminal 1 - Backend
```bash
cd stg-core-cleanzip/stg-core-cleanzip/core
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

### Terminal 2 - Frontend
```bash
cd c:\Users\bruno\OneDrive\Desktop\stg-main
npm install
npm run dev
```

### Browser
1. Ir para `http://localhost:5173`
2. Clicar em "Entrar com Discord"
3. Autorizar
4. Esperado: Redireciona para `/home`

---

## 🐛 Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| `DISCORD_CLIENT_ID not configured` | Variável não está no backend | Adicionar em `.env` ou Replit |
| `Invalid OAuth2 redirect URL` | URL não bate | Verificar em Discord > OAuth2 > Redirects |
| `Discord nao retornou codigo` | Usuário cancelou autorização | Tentar novamente |
| Página fica carregando | CORS bloqueado | Verificar que API tem CORS ativo |
| `access_denied` | Falta de permissões | Verificar scopes no backend |

---

## ✅ Checklist Final

- [ ] `DISCORD_CLIENT_ID` configurado
- [ ] `DISCORD_CLIENT_SECRET` configurado
- [ ] `DISCORD_REDIRECT_URI` configurado
- [ ] Redirect URI está registrado no Discord Portal
- [ ] `FRONTEND_URL` ou `API_BASE_URL` configurados
- [ ] Backend rodando em `http://localhost:8000`
- [ ] Frontend rodando em `http://localhost:5173`
- [ ] Teste de login bem-sucedido

---

## 📚 Referências

- [Discord OAuth Documentation](https://discord.com/developers/docs/topics/oauth2)
- [Discord API Endpoints](https://discord.com/developers/docs/reference)
- [Implementation Guide](./DISCORD_OAUTH_SETUP.md)
