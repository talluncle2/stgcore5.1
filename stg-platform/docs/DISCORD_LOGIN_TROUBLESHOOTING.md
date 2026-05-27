# 🔐 GUIA RÁPIDO - Erro 404 ao Fazer Login via Discord

## ❌ O Problema

Ao clicar em "Entrar com Discord", você recebe erro `404 Not Found`.

## 🔍 Causas Mais Comuns

| Causa | Sintoma | Solução |
|-------|---------|---------|
| **API não está rodando** | Erro 404 em qualquer endpoint | Iniciar backend |
| **VITE_API_BASE_URL incorreto** | URL aponta para Replit expirado | Atualizar `.env` |
| **URL com porta errada** | Conecta mas não encontra rota | Verificar porta da API |
| **CORS bloqueado** | Browser nega a requisição | API precisa de CORS |

---

## ✅ Solução Passo a Passo

### 1️⃣ Verificar Backend (API)

**Terminal 1 - Backend**:
```bash
cd stg-core-cleanzip/stg-core-cleanzip/core

# Verificar se Python está disponível
python --version

# Iniciar o servidor
python main.py
# ou
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Esperado**: Você deve ver:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

**Teste**: Abrir no browser: `http://localhost:8000/docs`
- Se abrir, ✅ Backend está OK
- Se der erro, ❌ Backend não está rodando

---

### 2️⃣ Verificar Frontend - Arquivo `.env`

**Arquivo**: `c:\Users\bruno\OneDrive\Desktop\stg-main\.env`

**Deve conter**:
```env
VITE_API_BASE_URL=http://localhost:8000
```

**NÃO deve conter** (URLs expiradas):
```env
# ❌ ERRADO
VITE_API_BASE_URL=https://8bed2244-490f-4907-ba9b-a4bc0a13fa34-00-20zdrbzko8m3p.janeway.replit.dev:8000
```

✅ **Já foi atualizado automáticamente!**

---

### 3️⃣ Iniciar Frontend

**Terminal 2 - Frontend**:
```bash
cd c:\Users\bruno\OneDrive\Desktop\stg-main

# Limpar cache (opcional)
npm cache clean --force

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

**Esperado**: Você deve ver:
```
VITE v5.x.x  ready in 1234 ms

➜  Local:   http://localhost:5173/
```

---

### 4️⃣ Testar Login Discord

**No Browser**:
1. Abrir `http://localhost:5173`
2. Clicar no botão "Entrar com Discord"
3. Autorizar no Discord
4. **Esperado**: Redireciona para `/home`

---

## 🆘 Se Ainda Não Funcionar

### Teste 1: Verificar Conectividade

```bash
# Verificar se a API responde
curl http://localhost:8000/health

# Esperado:
# {"status": "online", "service": "STG Core API", ...}
```

### Teste 2: Verificar Rota Discord

```bash
# Testar se a rota de Discord existe
curl "http://localhost:8000/auth/discord/start"

# Esperado: Redireciona para Discord OAuth (erro 307 é normal)
# ou erro com mensagem sobre DISCORD_CLIENT_ID não configurado
```

### Teste 3: Verificar CORS

Abrir DevTools do Browser (F12):
- Aba "Console"
- Procurar por erro `CORS` ou `Access-Control`
- Se encontrar, o CORS não está ativo na API

---

## 📋 Checklist Final

- [ ] Backend rodando em `http://localhost:8000`
- [ ] Frontend rodando em `http://localhost:5173`
- [ ] `.env` do frontend tem `VITE_API_BASE_URL=http://localhost:8000`
- [ ] `http://localhost:8000/docs` abre (confirmando API)
- [ ] `http://localhost:5173` carrega sem erro
- [ ] Clique em "Entrar com Discord" redireciona para Discord
- [ ] Após autorizar, redireciona para `/home`

---

## 🔧 Troubleshooting Específico

### Erro: "Connection refused"
**Causa**: Backend não está rodando
**Solução**: Iniciar `python main.py` no terminal do backend

### Erro: "404 Not Found"
**Causa**: Backend rodando em porta diferente
**Solução**: Verificar porta (deve ser 8000) ou atualizar `.env`

### Erro: "CORS policy"
**Causa**: CORS não está configurado
**Solução**: Verificar que `app.add_middleware(CORSMiddleware, ...)` está em `main.py`

### Erro: "DISCORD_CLIENT_ID not configured"
**Causa**: Variável de ambiente não configurada
**Solução**: Levantar `DISCORD_CLIENT_ID` no backend (por agora, ignore para testes)

---

## 🎯 Próximas Etapas

1. **Seguir este guia** passo a passo
2. **Testar fluxo completo** localmente
3. **Fazer push** para Replit quando funcionar
4. **Configurar variáveis** no Replit
5. **Testar em produção**

---

## 📞 Contato

Se ainda tiver problemas:

1. **Verificar logs**: Terminal do backend mostra erros?
2. **Verificar DevTools**: Browser F12 > Console > há erros?
3. **Verificar .env**: VITE_API_BASE_URL está correto?
4. **Verificar porta**: API em 8000, Frontend em 5173?

---

**Criado**: 26 de maio de 2026
**Status**: ✅ Atualizado e pronto
