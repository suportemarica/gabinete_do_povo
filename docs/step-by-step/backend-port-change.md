# Alteração da Porta do Backend - 3001 para 3002

## Data: 2025-01-27

## Objetivo
Alterar a porta padrão do backend de 3001 para 3002 para evitar conflito com outra aplicação que já está utilizando a porta 3001.

## Alterações Realizadas

### 1. Código do Backend (src/index.ts)
**Arquivo:** `backend/src/index.ts`
**Linha:** 91
**Alteração:** 
```typescript
// Antes
const PORT = process.env.PORT || 3001;

// Depois
const PORT = process.env.PORT || 3002;
```

### 2. Docker Compose (docker-compose.yml)
**Arquivo:** `backend/docker-compose.yml`
**Alterações:**
- Linha 33: `PORT: 3001` → `PORT: 3002`
- Linha 36: `EXTERNAL_API_URL: "http://localhost:3001/api"` → `EXTERNAL_API_URL: "http://localhost:3002/api"`
- Linha 41: `"3001:3001"` → `"3002:3002"`

### 3. Arquivo de Exemplo de Ambiente (env.example)
**Arquivo:** `backend/env.example`
**Alterações:**
- Linha 9: `PORT=3001` → `PORT=3002`
- Linha 20: `EXTERNAL_API_URL="http://localhost:3001/api"` → `EXTERNAL_API_URL="http://localhost:3002/api"`

### 4. Configuração da API no Frontend (src/services/api.ts)
**Arquivo:** `src/services/api.ts`
**Linha:** 15
**Alteração:**
```typescript
// Antes
const API_BASE_URL = 'http://localhost:3001/api';

// Depois
const API_BASE_URL = 'http://localhost:3002/api';
```

### 5. Arquivo .env (Criação Manual Necessária)
**Arquivo:** `backend/.env` (não foi criado automaticamente devido ao .gitignore)
**Ação Necessária:** O usuário deve criar manualmente o arquivo `.env` no diretório `backend/` com o seguinte conteúdo:

```env
# Database
DATABASE_URL="postgresql://gabinete:gabinete123@localhost:5432/gabinete_do_povo?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="24h"

# Server
PORT=3002
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# External API (Marica Form Flow)
EXTERNAL_API_URL="http://localhost:3002/api"
EXTERNAL_API_KEY=""

# Sync Configuration
DEFAULT_SYNC_INTERVAL=30
DEFAULT_AUTO_SYNC=false
```

## Arquivos Afetados
1. `backend/src/index.ts` - Porta padrão do servidor
2. `backend/docker-compose.yml` - Configuração do container Docker
3. `backend/env.example` - Arquivo de exemplo de variáveis de ambiente
4. `src/services/api.ts` - URL base da API no frontend
5. `backend/.env` - Arquivo de variáveis de ambiente (criar manualmente)

## Impacto
- O backend agora rodará na porta 3002 por padrão
- O frontend foi configurado para se comunicar com a nova porta
- Todas as configurações de Docker foram atualizadas
- Não há impacto na funcionalidade, apenas na porta de comunicação

## Próximos Passos
1. Criar o arquivo `.env` no diretório `backend/` com o conteúdo fornecido
2. Reiniciar o backend para aplicar as mudanças
3. Verificar se o frontend consegue se comunicar com o backend na nova porta
4. Testar todas as funcionalidades para garantir que não há problemas de comunicação

## Observações
- A alteração foi feita de forma consistente em todos os arquivos de configuração
- O arquivo `.env` não foi criado automaticamente devido às configurações de segurança do .gitignore
- Todas as referências à porta 3001 foram atualizadas para 3002
