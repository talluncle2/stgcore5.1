# Discord OAuth - STG FastAPI

O frontend nao depende de Supabase nesta fase. O botao **Entrar com Discord** redireciona para a API FastAPI:

```text
GET /auth/discord/start
```

Depois do login no Discord, a API retorna para:

```text
/auth/callback?token=...
```

O frontend salva esse token e redireciona para `/home`.

## Variaveis do frontend

No `.env` do frontend:

```env
VITE_API_BASE_URL=https://sua-api.com

# Opcional. Se nao configurar, o frontend usa:
# ${VITE_API_BASE_URL}/auth/discord/start
VITE_DISCORD_LOGIN_URL=https://sua-api.com/auth/discord/start
```

## Variaveis da API FastAPI

No Replit/backend:

```env
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=https://sua-api.com/auth/discord/callback
FRONTEND_URL=https://seu-frontend.com
API_BASE_URL=https://sua-api.com
```

Para mapear cargos do Discord para permissoes de dashboard:

```env
DISCORD_GUILD_ID=
DISCORD_BOT_TOKEN=
DISCORD_ADMIN_ROLE_IDS=
DISCORD_MODERADOR_ROLE_IDS=
DISCORD_STAFF_ROLE_IDS=
DISCORD_INFRA_ROLE_IDS=
DISCORD_ESPORTES_ROLE_IDS=
DISCORD_FINANCEIRO_ROLE_IDS=
```

Esses valores ficam apenas no backend. Nao exponha `DISCORD_BOT_TOKEN` ou qualquer chave do bot no frontend.

## Discord Developer Portal

Em OAuth2 > Redirects, cadastre exatamente:

```text
https://sua-api.com/auth/discord/callback
```

Esse valor deve ser igual ao `DISCORD_REDIRECT_URI` configurado na API.

## Fluxo

1. Frontend chama `/auth/discord/start`.
2. API redireciona para o Discord.
3. Discord redireciona para `/auth/discord/callback`.
4. API troca o `code` por token Discord e busca `/users/@me`.
5. API cria ou atualiza o usuario STG.
6. API gera JWT proprio da STG.
7. API redireciona para `/auth/callback?token=...`.
8. Frontend salva o token e abre `/home`.

## Observacao importante

O backend presente no workspace foi atualizado com esse fluxo. Para funcionar no site publicado, envie essas alteracoes para o Replit/deploy da API e configure as variaveis acima.

## Diagnostico rapido

Se o botao do Discord abrir uma pagina 404 da API, a API publicada ainda nao recebeu a rota:

```text
GET /auth/discord/start
```

Confirme abrindo:

```text
https://sua-api.com/auth/discord/start?redirect_uri=https%3A%2F%2Fseu-frontend.com%2Fauth%2Fcallback
```

O comportamento esperado e redirecionar para `https://discord.com/oauth2/authorize...`.

Se voltar para `/auth/callback?error=DISCORD_CLIENT_ID...`, a rota existe, mas as variaveis Discord ainda nao foram configuradas no backend.

Se o Discord mostrar erro de redirect, o valor em OAuth2 > Redirects deve ser exatamente igual a:

```text
DISCORD_REDIRECT_URI=https://sua-api.com/auth/discord/callback
```
