# 🧪 TESTE DE VALIDAÇÃO - STG

Script para validar que as correções funcionaram corretamente.

## 🚀 Testes Rápidos

### 1. Verificar Arquivos Criados

```bash
# Frontend
ls -la .env
ls -la .env.example
ls -la .env.production
ls -la vite-env.d.ts
ls -la SETUP_LOCAL.md

# Bot
ls -la bot/.env
ls -la bot/.env.example
```

**Esperado:** Todos os arquivos devem existir ✅

---

### 2. Verificar Editei Corretos

```bash
# Supabase é opcional
grep -n "isSupabaseEnabled" src/lib/supabase.ts
# Esperado: export const isSupabaseEnabled = ...

# AuthContext com fallback
grep -n "if (!supabase)" src/context/AuthContext.tsx
# Esperado: múltiplas linhas com fallback

# ProtectedRoute respeita flags
grep -n "VITE_REQUIRE_AUTH" src/components/auth/ProtectedRoute.tsx
# Esperado: lê a variável de environment

# Bot com env vars
grep -n "os.getenv" bot/api_client.py
# Esperado: API_BASE_URL = os.getenv(...)

# .gitignore protege .env
grep -n "^\.env$" .gitignore
# Esperado: .env está listado
```

---

### 3. TypeScript Syntax

```bash
# Verificar que vite-env.d.ts é válido
cat vite-env.d.ts | grep "interface ImportMetaEnv"
# Esperado: interface com VITE_*
```

---

### 4. JSON Syntax

```bash
# Verificar que .env é parseable
node -e "require('dotenv').config(); console.log(process.env.VITE_API_BASE_URL)"
# Esperado: http://localhost:8000
```

---

## 🏃 Teste Completo (Quando Node/Python estiverem instalados)

### Terminal 1 - Frontend

```bash
cd c:\Users\bruno\OneDrive\Desktop\stg-main

# Instalar
npm install

# Build
npm run build
# Esperado: Success ✅

# Dev
npm run dev
# Esperado: http://localhost:5173
```

### Terminal 2 - Backend

```bash
cd stg-core-cleanzip/stg-core-cleanzip/core

# Setup
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Rodar
python -m uvicorn main:app --reload
# Esperado: http://localhost:8000
```

### Terminal 3 - Teste

```bash
# Health check
curl http://localhost:8000/health
# Esperado: {"status": "online", ...}

# Overview
curl http://localhost:8000/public/overview
# Esperado: JSON com projeto, ranking, etc

# Frontend carrega
curl http://localhost:5173
# Esperado: HTML da landing page
```

---

## ✅ Checklist de Validação

### Estrutura
- [ ] `.env` existe ✅
- [ ] `.env.example` existe ✅
- [ ] `vite-env.d.ts` existe ✅
- [ ] `bot/.env` existe ✅
- [ ] `SETUP_LOCAL.md` existe ✅

### TypeScript
- [ ] `src/lib/supabase.ts` tem `isSupabaseEnabled` ✅
- [ ] `vite-env.d.ts` tem tipos corretos ✅
- [ ] Sem erros TS: `tsc --noEmit` ✅

### Funções
- [ ] AuthContext importa `isSupabaseEnabled` ✅
- [ ] ProtectedRoute lê `VITE_REQUIRE_AUTH` ✅
- [ ] Bot api_client.py usa `os.getenv()` ✅

### Segurança
- [ ] `.env` está em `.gitignore` ✅
- [ ] Não há BOT_API_KEY hardcoded em src/ ✅
- [ ] Arquivo production seguro ✅

### Build
- [ ] `npm run build` funciona sem erros ✅
- [ ] `npm run dev` funciona ✅
- [ ] Backend roda sem erros ✅
- [ ] Bot roda sem erros ✅

### Integração
- [ ] Frontend conecta em http://localhost:8000 ✅
- [ ] `/health` retorna online ✅
- [ ] `/public/overview` retorna dados ✅
- [ ] Dashboard acessível sem login ✅
- [ ] Bot consegue chamar API ✅

---

## 🧬 Teste de Regressão

```bash
# Verificar que nada quebrou

# 1. Verificar que main.tsx renderiza
grep -n "createRoot" src/main.tsx
# Esperado: createRoot renderiza App

# 2. Verificar que App.tsx tem router
grep -n "BrowserRouter" src/App.tsx
# Esperado: Routes com landing, dashboard, etc

# 3. Verificar que Landing funciona
grep -n "getOverview" src/pages/Landing.tsx
# Esperado: Landing chama API

# 4. Verificar que Dashboard funciona
grep -n "getStats" src/pages/Dashboard.tsx
# Esperado: Dashboard chama API
```

---

## 📊 Resultado Esperado

Ao rodar tudo, você deve ver:

### Frontend
```
✅ Landing page carrega
✅ Top 3 ranking preenchido
✅ Dashboard acessível
✅ API Status: Online
✅ Endpoints /public/* retornam dados
```

### Backend
```
✅ API rodando em localhost:8000
✅ Health check: online
✅ /public/overview: dados
✅ /public/ranking: usuários
✅ /public/products: produtos
✅ /public/tournaments: torneios
```

### Bot
```
✅ Bot inicia sem erros
✅ Conecta na API
✅ X-Bot-Api-Key enviado
✅ Logs mostram conexão OK
```

---

## 🐛 Se Algo Não Funcionar

### Frontend não abre

```bash
# 1. Verificar que .env existe
cat .env
# Esperado: VITE_API_BASE_URL=...

# 2. Verificar que NODE existe
node --version
npm --version

# 3. Limpar cache
rm -r node_modules package-lock.json
npm install
npm run dev
```

### Backend não conecta

```bash
# 1. Verificar que backend está rodando
curl http://localhost:8000/health

# 2. Verificar CORS está ativo
# Esperado: Response tem Access-Control-Allow-Origin: *

# 3. Verificar porta não está em uso
netstat -ano | findstr :8000
```

### Bot não funciona

```bash
# 1. Verificar bot/.env existe
cat bot/.env
# Esperado: API_BASE_URL=..., BOT_API_KEY=...

# 2. Verificar token Discord
# Esperado: DISCORD_BOT_TOKEN não vazio

# 3. Ver logs
python main.py 2>&1 | grep -i error
```

---

## 🎯 Resultado Esperado do Teste

```
[FRONTEND]
✅ npm install - OK
✅ npm run build - OK (gera dist/)
✅ npm run dev - OK (http://localhost:5173)
✅ Acessa Landing Page - OK
✅ Acessa Dashboard - OK
✅ API Status: Online - OK

[BACKEND]
✅ python -m uvicorn main:app --reload - OK
✅ http://localhost:8000 - OK
✅ /health - OK (status: online)
✅ /public/overview - OK (dados)
✅ /public/ranking - OK (array)

[BOT]
✅ python main.py - OK
✅ Conecta na API - OK
✅ Logs sem erro - OK

[INTEGRAÇÃO]
✅ Frontend → Backend - OK
✅ Bot → Backend - OK
✅ Endpoints públicos - OK
✅ /bot com X-Bot-Api-Key - OK

🎉 TUDO OK - PRONTO PARA DEPLOY!
```

---

**Se todos os testes passarem, pode fazer commit e deploy em Vercel! 🚀**
