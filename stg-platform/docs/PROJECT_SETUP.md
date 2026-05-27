# STG | Supremo Tribunal Gamer - Frontend

Sistema completo de dashboard para gestão de campeonatos, ranking e comunidade esports.

## 🎯 Sistema de Autenticação

### Login e Cadastro
- ✅ **Email/Senha** - Sistema completo usando Supabase Auth
- ✅ **Perfis de Usuário** - Criados automaticamente no signup
- ✅ **Roles** - user, moderator, admin
- ✅ **Rotas Protegidas** - Dashboard e páginas admin requerem login
- ✅ **Persistência** - Sessão mantida entre refreshes

### Fluxo de Autenticação

1. **Cadastro** (`/signup`):
   - Email, senha, nome de usuário
   - Perfil criado automaticamente
   - XP inicial: 0 | Level: 1 | Coins: 100

2. **Login** (`/login`):
   - Email e senha
   - Redireciona para Dashboard

3. **Logout**:
   - Botão no Topbar e Sidebar
   - Limpa sessão completamente

### Discord OAuth (Futuro)
- Botão preparado mas desabilitado
- Estrutura pronta para integração
- Requer configuração adicional no Supabase

## 🚀 Instalação

\`\`\`bash
npm install
npm run dev
npm run build
\`\`\`

## ⚙️ Configuração

### Variáveis de Ambiente Obrigatórias

\`\`\`env
# API do Replit
VITE_API_BASE_URL=https://sua-api.replit.dev:8000

# Supabase (Autenticação)
VITE_SUPABASE_URL=https://seuProjeto.supabase.co
VITE_SUPABASE_ANON_KEY=suaChaveAnonima
\`\`\`

### Obter Credenciais Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Settings > API > Copie:
   - Project URL → `VITE_SUPABASE_URL`
   - anon public key → `VITE_SUPABASE_ANON_KEY`

## 📊 Banco de Dados (Supabase)

### Tabela `profiles`

Criada automaticamente pela migration com:

- id (uuid, auth.users reference)
- email (text, unique)
- username (text, unique)
- discord_id (text, nullable)
- avatar_url (text)
- role (user/moderator/admin)
- xp, level, coins
- created_at, updated_at

### Row Level Security (RLS)

- Usuários podem ler/atualizar próprio perfil
- Admins podem gerenciar todos os perfis
- Perfil criado automaticamente no signup

## 🎨 Páginas

### Públicas
- `/` - Landing page
- `/ranking` - Ranking global
- `/login` - Login
- `/signup` - Cadastro

### Autenticadas (requer login)
- `/dashboard` - Painel principal
- `/tournaments` - Campeonatos
- `/store` - Loja
- `/players` - Jogadores
- `/profile` - Seu perfil
- `/settings` - Configurações

### Admin (requer role admin/moderator)
- `/admin` - Painel administrativo
- `/moderation` - Moderação

## 🔧 Stack

- React 18 + TypeScript
- Vite (Build)
- Tailwind CSS
- Shadcn/UI
- Lucide Icons
- Recharts
- React Router v6
- Supabase (Auth + Database)

## 👥 Roles e Permissões

### User
- Acessar dashboard, loja, torneios
- Ver próprio perfil
- Comprar na loja

### Moderator
- Tudo de User +
- Acessar página de Moderação
- Ver punições

### Admin
- Tudo de Moderator +
- Painel Admin completo
- Gerenciar usuários, XP, coins
- Aprovar/rejeitar torneios

## 🚀 Deploy

### Vercel

\`\`\`bash
# Conectar GitHub
# Configurar variáveis de ambiente
# Deploy automático em push
\`\`\`

### Cloudflare Pages

\`\`\`bash
# Framework: Vite
# Build: npm run build
# Output: dist
# Configurar env vars no dashboard
\`\`\`

## 📝 Migração Inicial

A migration `001_create_profiles_table` já foi aplicada e cria:

- Tabela de perfis
- Políticas RLS
- Trigger para criar perfil automaticamente
- Índices para performance

## 🔐 Segurança

- Senhas hasheadas pelo Supabase
- Sessões JWT com expiração
- RLS no banco
- Validação frontend completa
- Roles hierárquicos

## 📚 Próximos Passos

- [ ] Discord OAuth real
- [ ] Avatares customizáveis
- [ ] Sistema de badges
- [ ] Notificações push
- [ ] Chat em tempo real
- [ ] Tournament brackets interativos
- [ ] PWA offline support

---

**STG © 2026 - Supremo Tribunal Gamer**
