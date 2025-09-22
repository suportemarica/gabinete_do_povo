# 🚀 Instalação do Backend - Gabinete do Povo

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 12+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

## 🛠️ Instalação Local

### 1. Clone o Repositório

```bash
git clone <repository-url>
cd gabinete-do-povo/backend
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure o Banco de Dados

#### Opção A: PostgreSQL Local

1. **Instale o PostgreSQL** em sua máquina
2. **Crie o banco de dados:**
   ```sql
   CREATE DATABASE gabinete_do_povo;
   CREATE USER gabinete WITH PASSWORD 'gabinete123';
   GRANT ALL PRIVILEGES ON DATABASE gabinete_do_povo TO gabinete;
   ```

#### Opção B: Docker (Recomendado)

```bash
# Iniciar apenas o PostgreSQL
docker-compose up postgres -d

# Aguardar o banco estar pronto
docker-compose logs -f postgres
```

### 4. Configure as Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar com suas configurações
nano .env
```

**Configuração mínima:**
```env
DATABASE_URL="postgresql://gabinete:gabinete123@localhost:5432/gabinete_do_povo?schema=public"
JWT_SECRET="sua-chave-secreta-super-segura-aqui"
JWT_EXPIRES_IN="24h"
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

### 5. Configure o Banco de Dados

```bash
# Gerar cliente Prisma
npm run generate

# Executar migrations
npm run migrate

# Popular com dados iniciais
npm run seed
```

### 6. Inicie o Servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 🐳 Instalação com Docker

### 1. Clone e Configure

```bash
git clone <repository-url>
cd gabinete-do-povo/backend
cp env.example .env
```

### 2. Inicie os Serviços

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### 3. Acesse os Serviços

- **Backend API:** http://localhost:3001
- **pgAdmin:** http://localhost:5050
  - Email: admin@gabinete.com
  - Senha: admin123

## 🔧 Configuração Avançada

### Variáveis de Ambiente Completas

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

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# External API
EXTERNAL_API_URL="http://localhost:3001/api"
EXTERNAL_API_KEY=""

# Sync Configuration
DEFAULT_SYNC_INTERVAL=30
DEFAULT_AUTO_SYNC=false
```

### Configuração do PostgreSQL

#### Performance
```sql
-- Configurações recomendadas para desenvolvimento
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
```

#### Backup
```bash
# Backup
pg_dump -h localhost -U gabinete -d gabinete_do_povo > backup.sql

# Restore
psql -h localhost -U gabinete -d gabinete_do_povo < backup.sql
```

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Testes com coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

### Testes de Integração

```bash
# Iniciar banco de teste
docker-compose -f docker-compose.test.yml up -d

# Executar testes de integração
npm run test:integration
```

## 📊 Monitoramento

### Health Check

```bash
curl http://localhost:3001/health
```

### Logs

```bash
# Desenvolvimento
npm run dev

# Produção com PM2
pm2 start dist/index.js --name "gabinete-backend"
pm2 logs gabinete-backend
```

### Métricas

```bash
# Uso de memória
pm2 monit

# Status do banco
docker-compose exec postgres psql -U gabinete -d gabinete_do_povo -c "SELECT * FROM pg_stat_activity;"
```

## 🚀 Deploy em Produção

### 1. Preparar Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Instalar PM2
sudo npm install -g pm2
```

### 2. Configurar Banco

```bash
# Criar usuário e banco
sudo -u postgres psql
CREATE DATABASE gabinete_do_povo;
CREATE USER gabinete WITH PASSWORD 'senha-segura';
GRANT ALL PRIVILEGES ON DATABASE gabinete_do_povo TO gabinete;
\q
```

### 3. Deploy da Aplicação

```bash
# Clonar repositório
git clone <repository-url>
cd gabinete-do-povo/backend

# Instalar dependências
npm ci --only=production

# Configurar variáveis
cp env.example .env
nano .env

# Configurar banco
npm run generate
npm run migrate:deploy

# Iniciar aplicação
pm2 start dist/index.js --name "gabinete-backend"
pm2 startup
pm2 save
```

### 4. Configurar Nginx

```nginx
server {
    listen 80;
    server_name api.gabinete.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 Segurança

### Configurações de Segurança

1. **Altere as senhas padrão**
2. **Use HTTPS em produção**
3. **Configure firewall**
4. **Monitore logs de acesso**
5. **Faça backups regulares**

### Checklist de Segurança

- [ ] Senhas fortes configuradas
- [ ] JWT_SECRET seguro
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativado
- [ ] Logs de segurança monitorados
- [ ] Backup automático configurado

## 🆘 Solução de Problemas

### Problemas Comuns

#### 1. Erro de Conexão com Banco

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar logs
sudo journalctl -u postgresql
```

#### 2. Erro de Permissão

```bash
# Verificar permissões do banco
sudo -u postgres psql -c "SELECT * FROM pg_user;"
```

#### 3. Porta em Uso

```bash
# Verificar porta 3001
sudo netstat -tlnp | grep :3001

# Matar processo
sudo kill -9 <PID>
```

#### 4. Erro de Migration

```bash
# Resetar banco
npx prisma migrate reset

# Aplicar migrations
npx prisma migrate deploy
```

### Logs de Debug

```bash
# Habilitar logs detalhados
DEBUG=* npm run dev

# Logs do Prisma
DEBUG=prisma:* npm run dev
```

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs** do sistema
2. **Consulte a documentação** da API
3. **Abra uma issue** no GitHub
4. **Entre em contato** com o suporte

---

**🎉 Parabéns! O backend está configurado e funcionando!**

