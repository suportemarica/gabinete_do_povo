# Gabinete do Povo

Sistema de automação de tarefas baseado em formulários para a Prefeitura de Maricá.

## 🎯 Objetivo

O Gabinete do Povo é uma plataforma que automatiza a criação e o gerenciamento de tarefas com base nas respostas de formulários, permitindo um fluxo de trabalho eficiente e configurável.

## ✨ Funcionalidades

### 🔐 Autenticação
- Sistema de login seguro
- Rotas protegidas
- Gerenciamento de sessão

### 📋 Gerenciamento de Formulários
- Visualização de formulários sincronizados
- Integração com API externa
- Sincronização automática de dados

### 🔄 Sincronização
- Conecta com API externa (marica_form_flow)
- Sincronização em tempo real
- Recarregamento automático após sincronização

### 📊 Dashboard
- Estatísticas de formulários
- Gráficos de tarefas por setor
- Relatórios de prioridade

### ⚙️ Configuração
- Configuração de API externa
- Mapeamento de setores
- Regras de automação

## 🚀 Tecnologias

### Frontend
- **React 18** - Biblioteca de interface
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Shadcn/ui** - Componentes de UI
- **React Router** - Roteamento
- **React Query** - Gerenciamento de estado

### Backend
- **Node.js** - Runtime
- **Express.js** - Framework web
- **TypeScript** - Tipagem estática
- **Prisma** - ORM
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 13+
- Git

### Backend
```bash
cd backend
npm install
cp env.example .env
# Configure as variáveis no .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Frontend
```bash
npm install
npm run dev
```

## 🔧 Configuração

### Variáveis de Ambiente (Backend)
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/gabinete_do_povo"
JWT_SECRET="seu_jwt_secret_aqui"
EXTERNAL_API_URL="http://localhost:3001"
PORT=3002
```

### API Externa
Configure a URL da API externa no sistema para sincronização de formulários.

## 📱 Uso

1. **Login**: Acesse o sistema com suas credenciais
2. **Configurar API**: Configure a conexão com a API externa
3. **Sincronizar**: Sincronize os formulários da API externa
4. **Gerenciar**: Visualize e gerencie os formulários sincronizados

## 🎨 Design

- **Cores**: Vermelho e Branco (identidade visual institucional)
- **Layout**: Responsivo e moderno
- **Acessibilidade**: Seguindo padrões WCAG

## 📄 Licença

Este projeto é propriedade da Prefeitura de Maricá.

## 👥 Desenvolvimento

Sistema desenvolvido para automatizar processos administrativos e melhorar a eficiência do atendimento ao cidadão.

---

**Prefeitura de Maricá - Gabinete do Povo** 🏛️