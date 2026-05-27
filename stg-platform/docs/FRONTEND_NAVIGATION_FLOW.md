# Fluxo de Navegação do Frontend STG

## Login

Após login bem-sucedido, o frontend redireciona o usuário para `/home`.

O frontend não depende de Supabase nesta fase. A autenticação usa a API configurada em `VITE_API_BASE_URL`:

- `POST /auth/login`
- `GET /auth/me`

O token retornado pela API é salvo localmente como `stg_auth_token` e enviado como `Authorization: Bearer <token>` nas chamadas autenticadas.

## Rotas Públicas

- `/`
- `/home`
- `/loja`
- `/store`
- `/torneios`
- `/tournaments`
- `/ranking`
- `/login`

Loja, torneios e ranking consomem endpoints públicos da API.

## Rotas Protegidas

- `/profile`
- `/settings`
- `/players`

Essas rotas exigem login.

## Rotas Administrativas

- `/dashboard`
- `/admin`
- `/moderation`

Essas rotas exigem login e permissão de dashboard.

## Permissão da Dashboard

A regra fica em `src/utils/permissions.ts`.

Campos verificados, quando existirem:

- `user.roles`
- `user.discord_roles`
- `user.guild_roles`
- `user.permissions`
- `user.sectors`
- `user.role`
- `user.is_admin`
- `user.is_staff`
- `user.is_moderator`

Cargos textuais aceitos:

- `admin`
- `administrator`
- `moderador`
- `moderator`
- `staff`
- `infraestrutura`
- `esportes`
- `financeiro`
- `marketing`
- `staff_esportes`
- `staff_moderacao`
- `staff_financeiro`
- `staff_infraestrutura`

Também é possível liberar por IDs de cargos Discord:

```env
VITE_DASHBOARD_ROLE_IDS=123,456,789
```

## Home e Destaques

A Home usa `src/components/home/FeaturedCarousel.tsx`.

Prioridade de dados:

1. `GET /public/highlights`
2. Fallback para `GET /public/products?featured_only=true&limit=20`
3. Fallback para `GET /public/tournaments`

Produtos ou torneios só viram banner se vierem marcados com:

- `is_featured === true`
- `featured === true`
- `destaque === true`

Se nenhum destaque existir, a Home mostra o estado vazio:

> Nenhum destaque disponível no momento.

## Endpoint de Highlights

Quando o backend FastAPI estiver presente, o endpoint recomendado é:

```http
GET /public/highlights
```

Formato:

```json
[
  {
    "id": "product-1",
    "title": "Nome do produto",
    "description": "Descrição",
    "imageUrl": "",
    "type": "product",
    "href": "/loja",
    "ctaLabel": "Ver item",
    "badge": "Loja"
  }
]
```

No backend atual, produtos já possuem `is_featured`. Torneios ainda não possuem campo de destaque no model, então não entram em `/public/highlights` até o model evoluir.
