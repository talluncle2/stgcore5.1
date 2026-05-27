# ✅ CHECKLIST DE DEPLOYMENT - DISCORD OAUTH

## 📋 Pré-Deployment

### Verificações Locais

- [ ] Código Python sem erros de sintaxe
  ```bash
  python -m py_compile stg-core-cleanzip/stg-core-cleanzip/core/routes/auth.py
  ```

- [ ] Código TypeScript compila sem erros
  ```bash
  npm run build
  ```

- [ ] Frontend testa localmente
  ```bash
  npm run dev
  # Acessar http://localhost:5173
  ```

- [ ] Backend testa localmente
  ```bash
  cd stg-core-cleanzip/stg-core-cleanzip/core
  python main.py  # ou uvicorn main:app --reload
  # Acessar http://localhost:8000/docs
  ```

- [ ] Testar fluxo Discord localmente (se valores configurados)

---

## 🚀 Deployment no Replit

### 1. Fazer Push do Código

```bash
git add -A
git commit -m "fix: melhorar tratamento de erros Discord OAuth"
git push origin main
```

### 2. Puxar Mudanças no Replit

No Replit:
```bash
git pull origin main
```

### 3. Verificar Código no Replit

```bash
python -m py_compile core/routes/auth.py
python -m pytest  # se tiver testes
```

---

## 🔐 Configurar Variáveis de Ambiente

### No Painel do Replit (ou .env)

```
DISCORD_CLIENT_ID=seu_client_id
DISCORD_CLIENT_SECRET=seu_client_secret
DISCORD_REDIRECT_URI=https://seu-replit-app.repl.co/auth/discord/callback
FRONTEND_URL=https://seu-frontend-deploy.vercel.app
API_BASE_URL=https://seu-replit-app.repl.co
```

### Verificar em Runtime

```python
# No repl.it, fazer um request para /health
curl https://seu-replit-app.repl.co/health
# Deve retornar status 200
```

---

## 🎯 Configurar Discord Developer Portal

### Passo 1: Adicionar Redirect URI

1. Discord Developer Portal > OAuth2 > Redirects
2. Adicionar: `https://seu-replit-app.repl.co/auth/discord/callback`
3. Salvar

### Verificar URLs

- [ ] `DISCORD_REDIRECT_URI` = URL em Discord Portal
- [ ] `FRONTEND_URL` = URL do seu frontend deployed
- [ ] `API_BASE_URL` = URL do seu Replit

---

## 🌐 Configurar Frontend (Vercel/Netlify)

### No .env.production

```
VITE_API_BASE_URL=https://seu-replit-app.repl.co
VITE_DISCORD_LOGIN_URL=https://seu-replit-app.repl.co/auth/discord/start
VITE_REQUIRE_AUTH=true
```

### Deploy

```bash
# Vercel
vercel --prod

# ou Netlify
netlify deploy --prod
```

---

## 🧪 Testes Pós-Deployment

### Teste 1: Verificar API

```bash
curl https://seu-replit-app.repl.co/health
# Esperado: {"status": "online", ...}
```

### Teste 2: Iniciar Login

```bash
curl "https://seu-replit-app.repl.co/auth/discord/start?redirect_uri=https%3A%2F%2Fseu-frontend.com%2Fauth%2Fcallback"
# Esperado: Redireciona para https://discord.com/oauth2/authorize...
```

### Teste 3: Fluxo Completo

1. Abrir frontend: `https://seu-frontend-deploy.vercel.app`
2. Clicar em "Entrar com Discord"
3. Autorizar no Discord
4. Esperado: Redireciona para `/home` com token

### Teste 4: Erro Sem Variável

1. Temporariamente remover `DISCORD_CLIENT_ID`
2. Testar login Discord
3. Esperado: Erro claro em português

---

## 📊 Monitoramento Pós-Deploy

### Logs em Tempo Real

**Replit**:
- Clicar em "Tools" > "Logs"
- Procurar por "Discord" ou "oauth"

**Vercel**:
- Projeto > Deployments > Logs
- Procurar por erros de conectividade

### Métricas para Verificar

- [ ] Taxa de erro no Discord OAuth
- [ ] Tempo de resposta de `/auth/discord/callback`
- [ ] Número de usuários logando com Discord
- [ ] Erros de CORS (se houver)
- [ ] Timeouts

---

## 🆘 Troubleshooting Pós-Deploy

| Problema | Causa | Solução |
|----------|-------|---------|
| `DISCORD_CLIENT_ID not configured` | Variável não foi adicionada | Adicionar no Replit |
| `Invalid OAuth2 redirect URL` | URL não registrada | Registrar em Discord Portal |
| Página branca ao logar | CORS bloqueado | Verificar CORS na API |
| Erro 502 Bad Gateway | API fora do ar | Reiniciar Replit |
| Timeout na autorização | Conexão lenta | Verificar logs |

---

## ✅ Checklist Final

Antes de dar por concluído:

- [ ] Código no Git e deployado
- [ ] Variáveis de ambiente configuradas
- [ ] URL registrada em Discord Portal
- [ ] Teste de login funciona
- [ ] Mensagens de erro aparecem em português
- [ ] Dashboard acessível após login
- [ ] Logout funciona
- [ ] Logs mostram sucesso
- [ ] Performance aceitável (<2s para login)

---

## 📞 Contato de Suporte

Se algo não funcionar:

1. **Verificar variáveis**: `echo $DISCORD_CLIENT_ID`
2. **Verificar logs**: Replit > Tools > Logs
3. **Verificar disco**: Discord Portal > OAuth2 > Redirects
4. **Testar URL**: `curl https://api.seudominio.com/health`
5. **Consultar documentação**: Ler `DISCORD_LOGIN_FIXES.md`

---

**Status**: ✅ Pronto para deployment
**Versão**: 1.0.0
**Data**: 26 de maio de 2026
