# Auditoria Supabase e STG Core - 2026-06-21

## Escopo

Auditoria da API FastAPI, frontend Vite/React/TypeScript, migrations Supabase,
autenticacao Discord, RLS, funcoes SQL e modulo competitivo Warzone.

Nenhum layout, rota publica, identidade visual ou componente visual foi alterado.

## Encontrado

- O schema remoto e o historico local estavam alinhados ate a migration
  `20260621000005`.
- O lint remoto do schema `public` nao apresentava erros.
- As tabelas `discord_*` estavam corretamente bloqueadas para `anon` e
  `authenticated`, mantendo a API/bot como unico canal de acesso.
- `profiles` ja possuia RLS consolidada e protecao de campos privilegiados.
- Loja, torneios e operacoes usavam Supabase diretamente, com a API reservada
  para OAuth, cargos Discord e sincronizacao do bot.
- O encerramento de operacoes atualizava somente um JSON no cliente. Nao havia
  transacao unica para resultado, estatisticas, ranking e Hall da Fama.
- O helper `stg_can_manage_content()` tambem autorizava qualquer usuario com
  dashboard a gerenciar operacoes competitivas.
- Nao existiam tabelas normalizadas para operadores, clas, temporadas,
  resultados e estatisticas por evento.
- A chave `anon` publica do Supabase estava gravada no arquivo `.replit`.
- O backend possuia fallback inseguro para segredo JWT quando a variavel nao
  estivesse configurada.
- A verificacao da chave do bot usava comparacao comum e estava duplicada.
- Documentos legados ainda possuem exemplos fracos de chaves. Eles nao sao
  carregados em runtime, mas devem ser revisados separadamente.
- Nao foram encontradas Edge Functions no projeto.

## Corrigido

### Permissoes

Foram criadas funcoes SQL com `SECURITY INVOKER` e `search_path` fixo:

- `is_admin()`
- `is_moderator()`
- `has_dashboard_access()`
- `owns_profile(uuid)`

Operacoes, resultados, estatisticas competitivas, temporadas, clas e Hall da
Fama agora exigem moderador ou admin para escrita. A permissao existente de
conteudo geral foi preservada para nao remover funcionalidades de loja e
torneios.

### Warzone Competitive

Foram criadas:

- `warzone_seasons`
- `warzone_clans`
- `warzone_operators`
- `warzone_operation_results`
- `warzone_operator_event_stats`
- `warzone_hall_of_fame`

Tambem foram adicionados:

- vinculo de operacao com temporada;
- vinculo de participacao com operador e cla;
- validacao oficial dos modos e status;
- normalizacao da identidade competitiva pelo JWT Discord;
- restricao automatica por `clan_tag`;
- protecao contra alteracao de estatisticas pelo proprio membro;
- RPC transacional `close_warzone_operation(...)`;
- consolidacao de participacoes, vitorias, kills, MVPs e pontos;
- registro automatico de campeao e MVP no Hall da Fama.

### Analytics

Views PostgREST preparadas para Recharts:

- `warzone_general_stats`
- `warzone_operator_ranking`
- `warzone_clan_ranking`
- `warzone_mvp_ranking`
- `warzone_events_by_period`
- `warzone_kills_by_season`
- `warzone_public_operators`

As views usam `security_invoker` e respeitam RLS. O papel `anon` recebe somente
as colunas competitivas publicas; `discord_id`, `activision_id` e `profile_id`
nao ficam publicos.

### Backend

- Removido fallback de segredo JWT.
- Emissao e validacao de token falham de forma segura quando
  `SUPABASE_JWT_SECRET` nao esta configurado.
- Comparacao de chaves internas usa `secrets.compare_digest`.
- Verificacao duplicada do bot foi centralizada em `verify_bot_api_key`.

### Frontend

- Tipos TypeScript adicionados para operadores, clas, temporadas, estatisticas,
  rankings e Hall da Fama.
- Encerramento de operacao usa a RPC transacional quando Supabase esta ativo.
- Fallback local existente foi preservado.
- Criado `warzoneAnalyticsService.ts` para consumir as views.
- Nenhum componente visual foi modificado.

## Validacoes

- `supabase db lint --linked --schema public`: sem erros.
- Migrations locais e remotas alinhadas ate `20260621000007`.
- `python -m compileall backend/core`: aprovado.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado.
- REST anonimo:
  - analytics, rankings e Hall da Fama: HTTP 200;
  - `discord_members`: acesso negado;
  - coluna `warzone_operators.discord_id`: acesso negado.
- Busca em runtime nao encontrou service role, chave Discord, chave do bot,
  OpenRouter ou JWT real expostos no frontend.

## Limitacoes da Auditoria

- O dump completo via Supabase CLI exige Docker Desktop, indisponivel nesta
  maquina.
- Alguns comandos de diagnostico de locks solicitaram `SUPABASE_DB_PASSWORD`.
- A base ainda possui pouco ou nenhum dado competitivo; indices marcados como
  nao utilizados nao devem ser removidos antes de existir carga real.
- Testes de escrita por membro, moderador e admin dependem de tokens Discord
  reais de cada perfil.

## Recomendado

1. Configurar `SUPABASE_JWT_SECRET`, `BOT_API_KEY` e secrets Discord somente no
   ambiente da API.
2. Revisar e arquivar documentos antigos que mostram exemplos fracos de chave.
3. Criar testes automatizados de RLS com tokens de visitante, membro, moderador
   e admin.
4. Alimentar `warzone_operator_event_stats` no formulario de encerramento para
   consolidar kills individuais, nao apenas kills por cla.
5. Monitorar locks, conexoes e queries longas com a senha de banco configurada
   localmente, especialmente se os timeouts do Realtime voltarem.
6. Avaliar particionamento de `discord_events` e historico competitivo apenas
   quando o volume justificar.
