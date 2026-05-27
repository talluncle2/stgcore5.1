# 🚀 COMEÇAR AGORA - Backend + Frontend + Discord Login

## 📖 Para Iniciantes

### O que você precisa fazer:

1. **Abra 2 terminais**
2. **Terminal 1**: Execute os comandos do Backend
3. **Terminal 2**: Execute os comandos do Frontend
4. **Browser**: Abra http://localhost:5173 e teste o login

---

## 🖥️ Terminal 1 - Backend (API)

Copie e cole cada linha uma por uma:

```bash
# Navegar para o diretório do backend
cd c:\Users\bruno\OneDrive\Desktop\stg-main\stg-core-cleanzip\stg-core-cleanzip\core

# Verificar se Python está instalado
python --version

# Rodar a API
python main.py
```

**Esperado** (copiar exatamente):
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

✅ Se vir isso, o **Backend está OK**.

---

## 🖥️ Terminal 2 - Frontend (React)

Abra um **novo terminal** (não feche o primeiro!) e copie:

```bash
# Navegar para o projeto
cd c:\Users\bruno\OneDrive\Desktop\stg-main

# Instalar dependências (executar uma única vez)
npm install

# Rodar o servidor
npm run dev
```

**Esperado** (copiar exatamente):
```
VITE v5.x.x  ready in xxxx ms

➜  Local:   http://localhost:5173/
```

✅ Se vir isso, o **Frontend está OK**.

---

## 🌐 Browser - Teste o Login

### Passo 1: Abrir Frontend
1. Abra o navegador (Chrome, Firefox, Edge, Safari)
2. Vá para: `http://localhost:5173`
3. Você deve ver a página de login com o botão "Entrar com Discord"

### Passo 2: Teste de Conectividade
1. Abra um novo aba
2. Vá para: `http://localhost:8000/docs`
3. Se vê uma página com documentação da API = ✅ Backend funciona

### Passo 3: Teste o Login
1. Volte para `http://localhost:5173`
2. Clique em **"Entrar com Discord"**
3. Você será redirecionado para Discord
4. Clique em **"Autorizar"**
5. Você será redirecionado de volta
6. **Esperado**: Ver página `/home` ou formulário de login

---

## ⚠️ Possíveis Problemas e Soluções

### Problema 1: "Cannot GET /auth/discord/start"

**Causa**: Backend não está rodando ou PORT está errada

**Solução**:
```bash
# No Terminal 1, verifique que mostra:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete

# Se não ver, pressione Ctrl+C e rode novamente:
python main.py
```

---

### Problema 2: "ERR_CONNECTION_REFUSED"

**Causa**: Frontend não consegue conectar na API

**Solução**:
1. Verifique que Backend está rodando (Terminal 1)
2. Verifique arquivo `.env` do Frontend:
   ```bash
   # Abrir arquivo
   notepad .env
   ```
3. Deve conter:
   ```
   VITE_API_BASE_URL=http://localhost:8000
   ```
4. Se mudou, salve e faça Ctrl+C no Terminal 2
5. Digite: `npm run dev`

---

### Problema 3: Frontend não carrega (página branca)

**Solução**:
```bash
# No Terminal 2, pressione Ctrl+C
# Limpe o cache:
npm cache clean --force

# Reinstale:
npm install

# Rode novamente:
npm run dev
```

---

### Problema 4: Discord diz "Invalid redirect URL"

**Causa**: DISCORD_REDIRECT_URI não está configurado (OK para testes locais)

**Solução**: Para testes locais, apenas clique "Entrar com Discord" e autorize. Se for registrar em Discord Portal, use `http://localhost:8000/auth/discord/callback`

---

## ✅ Checklist de Sucesso

Você conseguiu quando:

- [x] Terminal 1 (Backend): Mostra "Application startup complete"
- [x] Terminal 2 (Frontend): Mostra "ready in xxxx ms"
- [x] Browser: `http://localhost:5173` carrega
- [x] Browser: `http://localhost:8000/docs` carrega
- [x] Clique em "Entrar com Discord" redireciona
- [x] Após autorizar, redireciona de volta

---

## 🎯 Próximos Passos

### Agora que tudo funciona localmente:

1. **Registre uma aplicação** no [Discord Developer Portal](https://discord.com/developers/applications)
2. **Configure as variáveis**:
   - `DISCORD_CLIENT_ID`
   - `DISCORD_CLIENT_SECRET`
   - `DISCORD_REDIRECT_URI`
3. **Faça login** como Discord para testar completamente
4. **Deploy**: Siga [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

---

## 💡 Dicas Úteis

### Ver logs em tempo real
```bash
# Terminal 1: Vê erros e requisições do backend
# Terminal 2: Vê compilação e avisos do frontend
# Browser F12 (Ctrl+Shift+J): Vê erros do JavaScript
```

### Parar os servidores
```bash
# Nos terminais, pressione:
Ctrl + C
```

### Reiniciar tudo
```bash
# Terminal 1: Ctrl+C depois python main.py
# Terminal 2: Ctrl+C depois npm run dev
```

---

## 🚨 Se Nada Funcionar

1. **Verifique as pastas**:
   ```bash
   # Terminal qualquer:
   dir .env
   # Deve mostrar que o arquivo existe
   
   dir stg-core-cleanzip\stg-core-cleanzip\core\main.py
   # Deve mostrar que o arquivo existe
   ```

2. **Verifique as versões**:
   ```bash
   node --version      # Deve ser v18+
   npm --version       # Deve ser 9+
   python --version    # Deve ser 3.8+
   ```

3. **Peça ajuda**:
   - Envie screenshot dos **2 terminais**
   - Envie resultado de `npm --version` e `python --version`
   - Descreva exatamente o erro

---

**Criado**: 26 de maio de 2026
**Status**: ✅ Pronto para começar
