# Documentação Técnica da API - Marica Form Flow

## 1. Visão Geral

O Marica Form Flow é um sistema de gerenciamento de formulários desenvolvido com Node.js, Express, TypeScript e PostgreSQL. A API REST fornece endpoints para criação, gerenciamento e resposta de formulários dinâmicos.

### Arquitetura
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Autenticação**: JWT (JSON Web Tokens)
- **Upload de Arquivos**: Multer
- **Validação**: Middleware customizado

### URL Base
```
http://localhost:3001/api
```

## 2. Autenticação e Autorização

### Sistema de Autenticação
A API utiliza JWT para autenticação. O token deve ser enviado no header `Authorization` com o prefixo `Bearer`.

```
Authorization: Bearer <token>
```

### Sistema de Permissões
O sistema implementa controle de acesso baseado em roles e permissões:
- **Roles**: admin, user, manager
- **Permissões**: Granulares por recurso e ação (ex: `forms.read`, `users.create`)

## 3. Endpoints da API

### 3.1 Autenticação (/api/auth)

#### POST /api/auth/register
**Descrição**: Registra um novo usuário no sistema

**Parâmetros de Entrada**:
```json
{
  "name": "string (obrigatório)",
  "email": "string (obrigatório, formato email)",
  "password": "string (obrigatório, mín. 6 caracteres)",
  "role": "string (opcional, padrão: 'user')",
  "departmentIds": "string[] (opcional)"
}
```

**Resposta de Sucesso (201)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "departments": [],
      "createdAt": "datetime",
      "updatedAt": "datetime"
    },
    "token": "string"
  }
}
```

#### POST /api/auth/login
**Descrição**: Autentica um usuário e retorna token JWT

**Parâmetros de Entrada**:
```json
{
  "email": "string (obrigatório)",
  "password": "string (obrigatório)"
}
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "departments": [],
      "userRoles": []
    },
    "token": "string"
  }
}
```

#### GET /api/auth/profile
**Descrição**: Retorna o perfil do usuário autenticado

**Headers**: `Authorization: Bearer <token>`

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "departments": [],
    "userRoles": []
  }
}
```

#### POST /api/auth/change-password
**Descrição**: Altera a senha do usuário autenticado

**Headers**: `Authorization: Bearer <token>`

**Parâmetros de Entrada**:
```json
{
  "newPassword": "string (obrigatório)"
}
```

### 3.2 Formulários (/api/forms)

#### GET /api/forms
**Descrição**: Lista todos os formulários (paginado)

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `forms.read`

**Query Parameters**:
- `page`: number (opcional, padrão: 1)
- `limit`: number (opcional, padrão: 10)
- `search`: string (opcional)
- `status`: string (opcional)

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "forms": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "status": "draft|active|inactive|archived",
        "createdAt": "datetime",
        "updatedAt": "datetime",
        "createdBy": "string",
        "departmentIds": ["string"]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

#### POST /api/forms
**Descrição**: Cria um novo formulário

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `forms.create`

**Parâmetros de Entrada**:
```json
{
  "title": "string (obrigatório)",
  "description": "string (obrigatório)",
  "instructions": "string (opcional)",
  "category": "string (opcional)",
  "departmentIds": ["string"],
  "sections": [
    {
      "title": "string",
      "description": "string",
      "order": "number"
    }
  ],
  "questions": [
    {
      "type": "text|email|number|textarea|select|radio|checkbox|file|date|time|datetime|url|phone|cpf|cnpj|cep|scale|matrix-radio|matrix-checkbox|table-dynamic|checkbox-quantity|coded-selection|composite-field",
      "title": "string",
      "description": "string",
      "required": "boolean",
      "order": "number",
      "sectionId": "string (opcional)",
      "options": [
        {
          "value": "string",
          "order": "number",
          "isExclusive": "boolean"
        }
      ],
      "validation": {
        "min": "number",
        "max": "number",
        "pattern": "string",
        "message": "string"
      },
      "conditional": {
        "dependsOn": "string",
        "value": "string",
        "operator": "equals|contains|not_equals"
      }
    }
  ],
  "settings": {
    "allowMultipleResponses": "boolean",
    "showProgress": "boolean",
    "collectEmail": "boolean",
    "isPublic": "boolean",
    "responsePeriodStart": "datetime",
    "responsePeriodEnd": "datetime"
  }
}
```

#### GET /api/forms/:id
**Descrição**: Busca um formulário específico por ID

**Headers**: `Authorization: Bearer <token>`

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "instructions": "string",
    "category": "string",
    "status": "string",
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "createdBy": "string",
    "departmentIds": ["string"],
    "sections": [],
    "questions": [],
    "settings": {}
  }
}
```

#### GET /api/forms/public/:token
**Descrição**: Acessa um formulário público através do token

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "form": {
      "id": "string",
      "title": "string",
      "description": "string",
      "questions": [],
      "settings": {}
    }
  }
}
```

#### PUT /api/forms/:id
**Descrição**: Atualiza um formulário existente

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `forms.update`

**Parâmetros**: Mesmos do POST /api/forms

#### DELETE /api/forms/:id
**Descrição**: Remove um formulário

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `forms.delete`

#### POST /api/forms/:id/duplicate
**Descrição**: Duplica um formulário existente

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `forms.create`

#### POST /api/forms/responses
**Descrição**: Submete uma resposta para um formulário (público)

**Parâmetros de Entrada**:
```json
{
  "formId": "string (obrigatório)",
  "answers": {
    "questionId1": "valor da resposta",
    "questionId2": ["array de valores para checkbox"]
  },
  "respondentEmail": "string (opcional)"
}
```

#### GET /api/forms/:formId/responses
**Descrição**: Lista respostas de um formulário

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `responses.read`

#### GET /api/forms/:formId/responses/export
**Descrição**: Exporta respostas de um formulário

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `responses.export`

**Query Parameters**:
- `format`: string (csv, xlsx)

### 3.3 Usuários (/api/users)

#### GET /api/users
**Descrição**: Lista todos os usuários

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `users.read`

#### GET /api/users/:id
**Descrição**: Busca um usuário específico

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `users.read`

#### POST /api/users
**Descrição**: Cria um novo usuário

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `users.create`

**Parâmetros de Entrada**:
```json
{
  "name": "string (obrigatório)",
  "email": "string (obrigatório)",
  "password": "string (obrigatório)",
  "role": "string (opcional)",
  "departmentIds": ["string"]
}
```

#### PUT /api/users/:id
**Descrição**: Atualiza um usuário

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `users.update`

#### DELETE /api/users/:id
**Descrição**: Remove um usuário

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `users.delete`

### 3.4 Departamentos (/api/departments)

#### GET /api/departments
**Descrição**: Lista todos os departamentos

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `departments.read`

#### GET /api/departments/:id
**Descrição**: Busca um departamento específico

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `departments.read`

#### POST /api/departments
**Descrição**: Cria um novo departamento

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `departments.create`

**Parâmetros de Entrada**:
```json
{
  "name": "string (obrigatório)",
  "description": "string (opcional)"
}
```

#### PUT /api/departments/:id
**Descrição**: Atualiza um departamento

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `departments.update`

#### DELETE /api/departments/:id
**Descrição**: Remove um departamento

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `departments.delete`

### 3.5 Storage/Arquivos (/api/storage)

#### POST /api/storage/upload
**Descrição**: Upload de múltiplos arquivos (público)

**Content-Type**: `multipart/form-data`

**Parâmetros de Entrada**:
- `files`: File[] (arquivos)
- `questionId`: string (obrigatório)
- `responseId`: string (obrigatório)

#### POST /api/storage/upload-single
**Descrição**: Upload de arquivo único (público)

**Content-Type**: `multipart/form-data`

#### GET /api/storage/download/:fileId
**Descrição**: Download de arquivo (público)

#### GET /api/storage/view/:fileId
**Descrição**: Visualização de arquivo inline (público)

#### GET /api/storage/info/:fileId
**Descrição**: Informações do arquivo (público)

#### DELETE /api/storage/:fileId
**Descrição**: Remove um arquivo

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `forms.delete`

#### GET /api/storage/admin/stats
**Descrição**: Estatísticas de armazenamento

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `settings.read`

### 3.6 Permissões (/api/permissions)

#### GET /api/permissions/permissions
**Descrição**: Lista todas as permissões

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `permissions.read`

#### POST /api/permissions/permissions
**Descrição**: Cria uma nova permissão

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `permissions.create`

#### GET /api/permissions/roles
**Descrição**: Lista todos os roles

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `permissions.read`

#### POST /api/permissions/roles
**Descrição**: Cria um novo role

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `permissions.create`

#### GET /api/permissions/users/:userId/roles
**Descrição**: Lista roles de um usuário

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `users.read`

#### POST /api/permissions/users/roles
**Descrição**: Atribui role a um usuário

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `users.manage`

#### GET /api/permissions/me/permissions
**Descrição**: Lista permissões do usuário atual

**Headers**: `Authorization: Bearer <token>`

### 3.7 Tags (/api/tags)

#### GET /api/tags
**Descrição**: Lista todas as tags

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `tags.read`

#### POST /api/tags
**Descrição**: Cria uma nova tag

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `tags.create`

**Parâmetros de Entrada**:
```json
{
  "name": "string (obrigatório)",
  "color": "string (opcional)",
  "description": "string (opcional)"
}
```

#### PUT /api/tags/:id
**Descrição**: Atualiza uma tag

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `tags.update`

#### DELETE /api/tags/:id
**Descrição**: Remove uma tag

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `tags.delete`

#### POST /api/tags/:tagId/responses/:responseId
**Descrição**: Adiciona tag a uma resposta

**Headers**: `Authorization: Bearer <token>`
**Permissão**: `responses.read`

### 3.8 Notas de Resposta (/api/response-notes)

#### POST /api/response-notes
**Descrição**: Cria uma nova nota para uma resposta

**Headers**: `Authorization: Bearer <token>`

**Parâmetros de Entrada**:
```json
{
  "responseId": "string (obrigatório)",
  "content": "string (obrigatório)",
  "isPrivate": "boolean (opcional)"
}
```

#### GET /api/response-notes/response/:responseId
**Descrição**: Lista todas as notas de uma resposta

**Headers**: `Authorization: Bearer <token>`

#### GET /api/response-notes/:noteId
**Descrição**: Busca uma nota específica

**Headers**: `Authorization: Bearer <token>`

#### PUT /api/response-notes/:noteId
**Descrição**: Atualiza uma nota

**Headers**: `Authorization: Bearer <token>`

#### DELETE /api/response-notes/:noteId
**Descrição**: Remove uma nota

**Headers**: `Authorization: Bearer <token>`

## 4. Modelos de Dados

### User
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  departments: Department[];
  userRoles?: UserRole[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Form
```typescript
interface Form {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  category?: string;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  departmentIds: string[];
  sections: FormSection[];
  questions: FormQuestion[];
  settings?: FormSettings;
}
```

### FormQuestion
```typescript
interface FormQuestion {
  id: string;
  type: ValidQuestionType;
  title: string;
  description?: string;
  required: boolean;
  order: number;
  formId: string;
  sectionId?: string;
  options: FormQuestionOption[];
  validation?: FormQuestionValidation;
  conditional?: FormQuestionConditional;
  createdAt: Date;
  updatedAt: Date;
}
```

### FormResponse
```typescript
interface FormResponse {
  id: string;
  status: 'draft' | 'in_progress' | 'completed';
  submittedAt: Date;
  ipAddress?: string;
  formId: string;
  userId?: string;
  respondentEmail?: string;
  questions: FormQuestionResponse[];
}
```

## 5. Códigos de Status HTTP

### Sucesso
- **200 OK**: Requisição bem-sucedida
- **201 Created**: Recurso criado com sucesso
- **204 No Content**: Operação bem-sucedida sem conteúdo de retorno

### Erro do Cliente
- **400 Bad Request**: Dados inválidos ou malformados
- **401 Unauthorized**: Token de autenticação inválido ou ausente
- **403 Forbidden**: Usuário não tem permissão para acessar o recurso
- **404 Not Found**: Recurso não encontrado
- **409 Conflict**: Conflito de dados (ex: email já cadastrado)
- **422 Unprocessable Entity**: Dados válidos mas não processáveis

### Erro do Servidor
- **500 Internal Server Error**: Erro interno do servidor

## 6. Estrutura de Resposta Padrão

### Sucesso
```json
{
  "success": true,
  "data": {
    // dados da resposta
  }
}
```

### Erro
```json
{
  "success": false,
  "error": "Mensagem de erro",
  "details": {
    // detalhes adicionais do erro (opcional)
  }
}
```

## 7. Exemplos de Uso

### Autenticação e Criação de Formulário
```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'usuario@exemplo.com',
    password: 'senha123'
  })
});

const { data } = await loginResponse.json();
const token = data.token;

// 2. Criar formulário
const formResponse = await fetch('/api/forms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Pesquisa de Satisfação',
    description: 'Avalie nossos serviços',
    questions: [
      {
        type: 'text',
        title: 'Qual seu nome?',
        required: true,
        order: 1
      },
      {
        type: 'radio',
        title: 'Como você avalia nosso atendimento?',
        required: true,
        order: 2,
        options: [
          { value: 'Excelente', order: 1 },
          { value: 'Bom', order: 2 },
          { value: 'Regular', order: 3 },
          { value: 'Ruim', order: 4 }
        ]
      }
    ]
  })
});
```

### Submissão de Resposta
```javascript
// Submeter resposta (público)
const responseSubmit = await fetch('/api/forms/responses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    formId: 'form-id-aqui',
    answers: {
      'question-id-1': 'João Silva',
      'question-id-2': 'Excelente'
    },
    respondentEmail: 'joao@exemplo.com'
  })
});
```

## 8. Considerações de Segurança

- Todos os endpoints autenticados requerem token JWT válido
- Senhas são criptografadas com bcrypt
- CORS configurado para domínios específicos
- Rate limiting implementado
- Validação de entrada em todos os endpoints
- Sanitização de dados para prevenir XSS
- Logs de auditoria para operações sensíveis

## 9. Limitações e Quotas

- **Upload de arquivos**: Máximo 10MB por arquivo
- **Requisições**: Rate limit de 100 req/min por IP
- **Token JWT**: Expiração em 24 horas
- **Paginação**: Máximo 100 itens por página

## 10. Versionamento

A API atualmente está na versão 1.0. Futuras versões serão versionadas através do path:
- v1: `/api/...` (atual)
- v2: `/api/v2/...` (futuro)

---

*Documentação gerada em: 2025*
*Versão da API: 1.0*