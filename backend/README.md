# Backend - Gabinete do Povo

Backend da aplicação Gabinete do Povo, desenvolvido com Node.js, Express, TypeScript e PostgreSQL.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Linguagem de programação
- **PostgreSQL** - Banco de dados
- **Prisma** - ORM para banco de dados
- **JWT** - Autenticação
- **bcryptjs** - Criptografia de senhas
- **Zod** - Validação de dados

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 12+
- npm ou yarn

## 🛠️ Instalação

1. **Clone o repositório e navegue para a pasta do backend:**
   ```bash
   cd backend
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   cp env.example .env
   ```
   
   Edite o arquivo `.env` com suas configurações:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/gabinete_do_povo?schema=public"
   
   # JWT
   JWT_SECRET="your-super-secret-jwt-key-here"
   JWT_EXPIRES_IN="24h"
   
   # Server
   PORT=3001
   NODE_ENV="development"
   
   # CORS
   CORS_ORIGIN="http://localhost:5173"
   ```

4. **Configure o banco de dados:**
   ```bash
   # Gerar cliente Prisma
   npm run generate
   
   # Executar migrations
   npm run migrate
   
   # Popular banco com dados iniciais
   npm run seed
   ```

5. **Inicie o servidor:**
   ```bash
   # Desenvolvimento
   npm run dev
   
   # Produção
   npm run build
   npm start
   ```

## 📊 Banco de Dados

### Estrutura das Tabelas

- **users** - Usuários do sistema
- **sync_configs** - Configurações de sincronização com API externa
- **forms** - Formulários sincronizados
- **form_questions** - Perguntas dos formulários
- **form_responses** - Respostas dos formulários
- **tasks** - Tarefas geradas automaticamente
- **notifications** - Notificações do sistema

### Comandos do Prisma

```bash
# Visualizar banco de dados
npm run studio

# Criar nova migration
npm run migrate

# Aplicar migrations em produção
npm run migrate:deploy

# Resetar banco de dados
npx prisma migrate reset
```

## 🔐 Autenticação

O sistema usa JWT para autenticação. Todas as rotas protegidas requerem o header:

```
Authorization: Bearer <token>
```

### Endpoints de Autenticação

- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/profile` - Buscar perfil do usuário

## 📡 API Endpoints

### Configurações de Sincronização
- `GET /api/sync-config` - Buscar configuração
- `POST /api/sync-config` - Criar/atualizar configuração
- `PUT /api/sync-config/:id` - Atualizar configuração
- `DELETE /api/sync-config/:id` - Remover configuração
- `POST /api/sync-config/test` - Testar conexão
- `GET /api/sync-config/status` - Status da sincronização

### Formulários
- `GET /api/forms` - Listar formulários
- `GET /api/forms/:id` - Buscar formulário
- `POST /api/forms` - Criar formulário
- `PUT /api/forms/:id` - Atualizar formulário
- `DELETE /api/forms/:id` - Remover formulário
- `POST /api/forms/:id/sync` - Sincronizar formulário
- `GET /api/forms/:id/responses` - Buscar respostas

### Tarefas
- `GET /api/tasks` - Listar tarefas
- `GET /api/tasks/:id` - Buscar tarefa
- `POST /api/tasks` - Criar tarefa
- `PUT /api/tasks/:id` - Atualizar tarefa
- `DELETE /api/tasks/:id` - Remover tarefa
- `PATCH /api/tasks/:id/status` - Atualizar status

### Notificações
- `GET /api/notifications` - Listar notificações
- `GET /api/notifications/:id` - Buscar notificação
- `POST /api/notifications` - Criar notificação
- `PUT /api/notifications/:id` - Atualizar notificação
- `DELETE /api/notifications/:id` - Remover notificação
- `PATCH /api/notifications/:id/read` - Marcar como lida
- `PATCH /api/notifications/read-all` - Marcar todas como lidas
- `GET /api/notifications/unread/count` - Contar não lidas

## 🔧 Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `DATABASE_URL` | URL de conexão com PostgreSQL | - |
| `JWT_SECRET` | Chave secreta para JWT | - |
| `JWT_EXPIRES_IN` | Tempo de expiração do token | `24h` |
| `PORT` | Porta do servidor | `3001` |
| `NODE_ENV` | Ambiente de execução | `development` |
| `CORS_ORIGIN` | Origem permitida para CORS | `http://localhost:5173` |
| `EXTERNAL_API_URL` | URL da API externa | `http://localhost:3001/api` |
| `EXTERNAL_API_KEY` | Chave da API externa | - |
| `DEFAULT_SYNC_INTERVAL` | Intervalo padrão de sincronização | `30` |
| `DEFAULT_AUTO_SYNC` | Sincronização automática padrão | `false` |

### Rate Limiting

- **Janela:** 15 minutos
- **Limite:** 100 requisições por IP
- **Aplicado em:** Todas as rotas `/api/*`

## 🛡️ Segurança

- **Helmet** - Headers de segurança
- **CORS** - Controle de origem
- **Rate Limiting** - Limitação de taxa
- **JWT** - Autenticação segura
- **bcryptjs** - Hash de senhas
- **Validação** - Validação de dados com Zod

## 📝 Logs

O sistema usa Morgan para logging de requisições HTTP:

- **Desenvolvimento:** Logs detalhados
- **Produção:** Logs compactos

## 🚀 Deploy

### Docker (Recomendado)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

### PM2

```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start dist/index.js --name "gabinete-backend"

# Configurar para iniciar com o sistema
pm2 startup
pm2 save
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

## 📊 Monitoramento

### Health Check

```bash
curl http://localhost:3001/health
```

Resposta:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

### Métricas

- **Uptime** - Tempo de funcionamento
- **Memory Usage** - Uso de memória
- **Request Count** - Contador de requisições
- **Error Rate** - Taxa de erros

## 🔄 Sincronização

O sistema suporta sincronização automática com APIs externas:

- **Configurável** - Intervalo personalizável
- **Automática** - Execução em background
- **Manual** - Sincronização sob demanda
- **Teste** - Validação de conexão

## 📚 Documentação da API

A documentação completa da API está disponível em:

- **Swagger UI:** `http://localhost:3001/api-docs`
- **Postman Collection:** `docs/postman-collection.json`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Para suporte, entre em contato:

- **Email:** suporte@gabinete.com
- **Issues:** [GitHub Issues](https://github.com/gabinete-do-povo/backend/issues)
- **Documentação:** [Wiki](https://github.com/gabinete-do-povo/backend/wiki)

