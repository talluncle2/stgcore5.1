# Auditoria da API Replit - 22/06/2026

## Escopo

Pasta auditada:

`C:\Users\bruno\Downloads\stgcore40 (3)\stgcore40`

API efetiva:

`stg-core-cleanzip/stg-core-cleanzip/core`

## Problemas encontrados

### Criticos

1. A API usava tabelas legadas (`users`, `products`, `punishments` e
   `tournament_registrations`) que nao existem no Supabase atual do site.
2. O JWT era assinado com `SESSION_SECRET`, portanto o PostgREST recusava a
   sessao com `No suitable key or wrong key type`.
3. Existiam valores historicos de `BOT_API_KEY` e `INTERNAL_SYNC_KEY`
   hardcoded no codigo e na documentacao versionada.
4. A sincronizacao Discord persistia principalmente em JSON local, que nao e
   duravel no Replit e nao alimentava o Supabase usado pelo site.
5. O startup executava `Base.metadata.create_all()`, com risco de criar schema
   legado fora das migrations.

### Altos

1. CORS aceitava wildcard com credenciais.
2. O callback OAuth Discord nao validava `state`.
3. O handler global devolvia a mensagem bruta da excecao.
4. `/public/overview` falhava e `/public/ranking` nao existia.
5. Os models de criadores da API nao correspondiam as colunas reais do banco.
6. A API nao expunha os contratos `/admin/discord/*` usados pelo dashboard.
7. A pasta nao contem o codigo do bot Discloud, apesar de arquivos antigos
   fazerem referencia a ele.

### Configuracao

No `.env` local auditado:

- `DATABASE_URL` aponta para o pooler do Supabase correto.
- `SUPABASE_JWT_SECRET` nao estava configurado.
- `GUILD_ID` nao estava configurado.
- a chave historica do bot era curta e precisa ser rotacionada.
- credenciais Twitch estavam como placeholders.

Valores secretos nao foram copiados para este relatorio.

## Correcoes aplicadas na API

- Escopo do `main.py` reduzido para Discord, OAuth, perfil, status e sync.
- Rotas legadas dependentes de tabelas inexistentes deixaram de ser
  registradas.
- `/public/overview`, `/public/stats`, `/public/ranking`,
  `/public/products` e `/public/discord/status` usam o schema atual.
- Criados models para as tabelas `discord_*`.
- `/bot/sync/*` grava no Supabase com upsert.
- Criados endpoints de leitura `/admin/discord/*` e `/admin/members`.
- `/auth/me` usa `discord_members` como fonte de verdade.
- OAuth passa a registrar/atualizar o membro no Supabase e validar `state`.
- JWT novo usa `role=authenticated`, claims Discord e
  `SUPABASE_JWT_SECRET`.
- Removidos fallbacks de chaves e detalhes de erro em producao.
- Removido `create_all()` do startup.
- Corrigido o modulo duplicado `core/api/api.py`.
- Atualizado `.env.example`.

## Supabase

Migration criada e aplicada:

`20260622000008_api_integration_hardening.sql`

Ela:

- cria `user_public_profiles`, exigida pelo contrato `/profile`;
- bloqueia acesso direto da tabela para frontend;
- corrige `search_path` de `stg_is_creator_owner`;
- permite ao criador atualizar o proprio perfil;
- protege campos administrativos por trigger.

## Validacoes

- `python -m compileall -q core`: passou.
- OpenAPI carregado sem banco de producao: 43 rotas registradas.
- Endpoints consultados diretamente no Supabase:
  `/public/overview`, `/public/ranking`, `/public/discord/status`,
  `/public/stats` e `/public/products`: passaram.
- Fluxo transacional de upsert Discord, emissao JWT e `/auth/me`: passou e foi
  revertido ao final do teste.
- Varredura de chaves hardcoded no codigo: passou apos saneamento.

## Pendencias operacionais

1. Configurar no Replit `SUPABASE_JWT_SECRET` com o Legacy JWT Secret.
2. Configurar `GUILD_ID`.
3. Rotacionar `BOT_API_KEY` e `INTERNAL_SYNC_KEY`.
4. Configurar o bot Discloud para enviar sync ao Replit com a nova chave.
5. Entrar novamente no site depois do deploy para substituir tokens antigos.
6. O Supabase estava sem dados em `discord_*`, `profiles`, loja, torneios e
   criadores durante a auditoria; o bot e o uso do site devem popular essas
   tabelas.

## Confirmacoes

- Nenhum secret foi adicionado ao frontend.
- Loja, torneios, Warzone e criadores continuam acessando Supabase
  diretamente.
- A API ficou restrita a Discord, autenticacao, perfil e observabilidade.
- Nenhum layout ou componente visual foi alterado.
