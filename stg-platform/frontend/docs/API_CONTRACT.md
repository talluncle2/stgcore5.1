# API Contract

Base URL: `VITE_API_BASE_URL`.

Respostas podem ser diretas ou envelopadas:

```json
{ "success": true, "data": {}, "message": "OK" }
```

Erros devem retornar status HTTP correto e `detail`, `message` ou `error`.

## Publico

- `GET /health`: `{ "status": "online" }`
- `GET /public/overview`: totais, guild, ranking resumido e `last_sync`.
- `GET /public/stats`: usuarios ativos, torneios, transacoes e XP.
- `GET /public/products`: lista de produtos publicos.
- `GET /public/tournaments`: lista de torneios publicos.
- `GET /public/tournaments/:id`: detalhe do torneio.
- `GET /public/ranking?limit=100`: ranking real. Campos opcionais: `kd`, `kills`, `deaths`, `wins`, `losses`.
- `GET /public/punishments`: punicoes publicas.
- `GET /public/news`: noticias publicas.

## Auth

- `GET /auth/discord/login`: redireciona para OAuth Discord.
- `GET /auth/callback?token=...`: callback usado pelo frontend.
- `GET /auth/me`: usuario autenticado via `Authorization: Bearer <token>`.

Campos aceitos para permissoes: `is_admin`, `is_moderator`, `is_staff`, `can_access_dashboard`, `roles`, `role_ids`, `discord_roles`, `guild_roles`, `permissions`, `sectors`.

## Perfil

- `GET /profile/me`
- `PUT /profile/me`
- `GET /profile/profiles`
- `GET /profile/profiles/:discord_id`
- Futuro upload: `POST /uploads/profile-image`, `POST /uploads/banner-image`

## Criadores

- `GET /creators`
- `GET /creators/featured`
- `GET /creators/live`
- `GET /creators/latest`
- `GET /creators/me`
- `POST /creators/me/register`
- `POST /creators/me/channels`
- `PUT /creators/me/channels/:id`
- `DELETE /creators/me/channels/:id`

## Loja

- `GET /admin/products`
- `POST /admin/products`
- `PUT /admin/products/:id`
- `DELETE /admin/products/:id`
- Futuro checkout: `POST /checkout/create`, `POST /orders`, `GET /orders/me`

## Torneios

- `POST /tournaments/:id/register`
- `POST /tournaments/:id/payment-proof`
- `GET /admin/tournaments`
- `POST /admin/tournaments`
- `PUT /admin/tournaments/:id`
- `DELETE /admin/tournaments/:id`
- `GET /admin/tournaments/:id/registrations`
- `PUT /admin/tournament-registrations/:id/approve`
- `PUT /admin/tournament-registrations/:id/reject`

## Dashboard Discord/Bot

- `GET /admin/discord/status`
- `GET /admin/discord/guild`
- `GET /admin/discord/metrics`
- `GET /admin/discord/members`
- `GET /admin/discord/roles`
- `GET /admin/discord/channels`
- `GET /admin/discord/events`

Se um endpoint ainda nao existir, retornar 404. O frontend exibira: `Endpoint ainda nao disponivel na API do Replit: /admin/...`.

## Moderacao

- `GET /admin/moderation/config`
- `PUT /admin/moderation/config`

## Admin Conteudo

- `GET /admin/news`, `POST /admin/news`, `PUT /admin/news/:id`, `DELETE /admin/news/:id`
- `GET /admin/home`, `POST /admin/home`, `PUT /admin/home/:id`, `DELETE /admin/home/:id`
- `GET /admin/ranking`, `POST /admin/ranking`, `PUT /admin/ranking/:id`, `DELETE /admin/ranking/:id`
