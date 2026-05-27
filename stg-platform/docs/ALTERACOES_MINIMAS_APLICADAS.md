# Alterações mínimas aplicadas

Este pacote foi corrigido sem remover bot, API, banco, Supabase, dashboard ou arquivos existentes.

## Correções feitas

1. Corrigido `.env`, `.env.example` e `.env.production` para remover redirect duplicado/malformado do Supabase.
2. Corrigida a Home/Landing para trocar o botão de Login pelo menu do usuário quando houver sessão Supabase (`isAuthenticated`/`profile`).
3. Corrigido `AuthCallback` para processar `code` OAuth com `exchangeCodeForSession` e redirecionar para `/home`.
4. Corrigido `signInWithDiscord` para usar Supabase OAuth com `redirectTo`, scopes mínimos e navegação fora de iframe.
5. Corrigido proxy do Vite para não interceptar `/auth/callback`.
6. Corrigido `server.js` para fallback SPA compatível com Express 5, evitando 404 em rotas React.
7. Ajustados scripts `dev`, `preview` e `start` em `package.json`.

## Testes recomendados

```bash
npm install
npm run build
npm run dev
```

Depois testar:

- `/`
- `/home`
- `/login`
- `/auth/callback`
- login Discord/Supabase

## Configuração externa necessária

No Supabase Authentication → URL Configuration:

- Site URL: `https://stg-main-20-zipzip--duquesadrago.replit.app`
- Redirect URLs:
  - `https://stg-main-20-zipzip--duquesadrago.replit.app/**`
  - `https://stg-main-20-zipzip--duquesadrago.replit.app/auth/callback`
  - `http://localhost:5173/**` ou porta local usada em desenvolvimento

No Discord Developer Portal, se o login usa Supabase Auth, o Redirect URI do Discord deve ser:

`https://SEU-PROJETO.supabase.co/auth/v1/callback`
