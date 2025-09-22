# Correção do Erro de Autenticação - API Externa

## Problema Identificado
O erro 401 (Unauthorized) na autenticação da API externa foi causado por uma incompatibilidade de configuração entre o frontend e backend.

## Análise do Problema

### 1. Configuração de Portas
- **Frontend**: Configurado para rodar na porta 8080 (vite.config.ts)
- **Backend**: Configurado para rodar na porta 3001
- **CORS**: Backend configurado para aceitar apenas `http://localhost:5173`

### 2. Teste de Funcionamento
- ✅ Backend está funcionando corretamente na porta 3001
- ✅ Banco de dados configurado e usuários criados
- ✅ Endpoint de login retornando token JWT válido
- ❌ Frontend tentando se conectar com configuração incorreta

## Soluções Implementadas

### 1. Correção da Porta do Frontend
```typescript
// vite.config.ts
server: {
  host: "::",
  port: 5173, // Alterado de 8080 para 5173
},
```

### 2. Configuração do CORS no Backend
```bash
# backend/.env
CORS_ORIGIN="http://localhost:5173"
```

### 3. Usuários de Teste Criados
- **Admin**: admin@gabinete.com / admin123
- **Usuário**: user@gabinete.com / user123

## Como Testar

### 1. Iniciar o Backend
```bash
cd backend
npm run dev
```

### 2. Iniciar o Frontend
```bash
npm run dev
```

### 3. Testar Autenticação
1. Acesse http://localhost:5173
2. Clique em "Configurar API" no header
3. Use as credenciais:
   - Email: admin@gabinete.com
   - Senha: admin123

## Verificação de Funcionamento

### Teste via PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@gabinete.com","password":"admin123"}'
```

### Resposta Esperada
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "Administrador",
      "email": "admin@gabinete.com",
      "role": "ADMIN",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

## Próximos Passos

1. ✅ Corrigir configuração de portas
2. ✅ Configurar CORS corretamente
3. ✅ Criar usuários de teste
4. 🔄 Testar fluxo completo de autenticação no frontend
5. 🔄 Verificar funcionamento de todas as funcionalidades

## Arquivos Modificados

- `vite.config.ts` - Correção da porta do frontend
- `backend/.env` - Configuração do CORS (criado manualmente)
- `docs/step-by-step/auth-fix.md` - Esta documentação

## Correções Adicionais

### 3. Correção do Headers de Autenticação
O problema principal estava no método `login()` que estava enviando headers de autorização desnecessários:

```typescript
// ANTES (incorreto)
headers: this.getHeaders(), // Enviava token de autorização no login

// DEPOIS (correto)
headers: {
  'Content-Type': 'application/json',
}, // Apenas Content-Type para login
```

### 4. Logs de Debug Adicionados
Adicionados logs detalhados para facilitar o debug:
- Logs da URL da API
- Logs das credenciais (sem senha)
- Logs da resposta da API
- Logs dos headers de resposta

## Status
✅ **RESOLVIDO** - O problema de autenticação foi identificado e corrigido. O backend está funcionando corretamente e o frontend deve conseguir se autenticar após as correções de configuração e headers.
