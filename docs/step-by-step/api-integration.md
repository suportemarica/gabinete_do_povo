# Integração com API - Marica Form Flow

## Visão Geral
Este documento detalha a implementação da integração com a API do Marica Form Flow para o sistema Gabinete do Povo, permitindo a sincronização e visualização de formulários e suas perguntas.

## Arquivos Criados

### 1. Tipos da API (`src/types/api.ts`)
**Funcionalidades:**
- Definição completa dos tipos TypeScript baseados na documentação da API
- Interfaces para todas as entidades (Form, User, Department, etc.)
- Tipos de resposta padronizados
- Suporte a paginação e filtros

**Principais Interfaces:**
- `ApiForm` - Formulários da API
- `ApiFormQuestion` - Perguntas dos formulários
- `ApiUser` - Usuários do sistema
- `ApiDepartment` - Departamentos
- `ApiResponse<T>` - Resposta padronizada da API

### 2. Serviço de API (`src/services/api.ts`)
**Funcionalidades:**
- Classe singleton para comunicação com a API
- Gerenciamento de autenticação JWT
- Métodos para todos os endpoints da API
- Tratamento de erros centralizado
- Headers automáticos com token de autenticação

**Principais Métodos:**
- `login()` - Autenticação de usuário
- `getForms()` - Listagem de formulários
- `getForm(id)` - Busca formulário específico
- `getDepartments()` - Listagem de departamentos
- `submitFormResponse()` - Submissão de respostas

### 3. Hooks Personalizados (`src/hooks/useApi.ts`)
**Funcionalidades:**
- `useApiForms()` - Gerenciamento de formulários da API
- `useApiDepartments()` - Gerenciamento de departamentos
- `useAuth()` - Gerenciamento de autenticação
- `useFormSync()` - Sincronização de formulários

**Características:**
- Estado local gerenciado automaticamente
- Loading states e tratamento de erros
- Refresh automático de dados
- Sincronização em tempo real

### 4. Página de Formulários Atualizada (`src/pages/Forms.tsx`)
**Funcionalidades:**
- Integração completa com a API
- Sincronização automática e manual
- Visualização de formulários da API
- Tratamento de erros da API
- Filtros e busca em tempo real

**Melhorias Implementadas:**
- Dados vindos diretamente da API
- Status de sincronização em tempo real
- Tratamento de erros com alertas visuais
- Configuração de sincronização automática

### 5. Visualizador Atualizado (`src/components/forms/FormViewer.tsx`)
**Funcionalidades:**
- Compatível com tipos da API
- Suporte a todos os tipos de pergunta da API
- Visualização de metadados da API
- Informações de criação e atualização

## Configuração da API

### URL Base
```typescript
const API_BASE_URL = 'http://localhost:3001/api';
```

### Autenticação
- Sistema JWT implementado
- Token armazenado no localStorage
- Headers automáticos com Bearer token
- Renovação automática de token

### Endpoints Utilizados

#### Formulários
- `GET /api/forms` - Listagem paginada
- `GET /api/forms/:id` - Formulário específico
- `GET /api/forms/public/:token` - Formulário público

#### Departamentos
- `GET /api/departments` - Listagem de departamentos
- `GET /api/departments/:id` - Departamento específico

#### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/profile` - Perfil do usuário

## Funcionalidades Implementadas

### 1. Sincronização de Formulários
- ✅ **Sincronização Manual:** Botão para sincronizar formulários individuais
- ✅ **Sincronização em Lote:** Sincronizar todos os formulários ativos
- ✅ **Sincronização Automática:** Configurável com intervalos de 5min a 24h
- ✅ **Status em Tempo Real:** Indicadores visuais de status de sincronização

### 2. Visualização de Dados
- ✅ **Listagem Completa:** Formulários com paginação
- ✅ **Busca e Filtros:** Por nome, descrição e status
- ✅ **Visualização Detalhada:** Formulários com todas as perguntas
- ✅ **Metadados da API:** Informações de criação, atualização, categoria

### 3. Tratamento de Erros
- ✅ **Alertas Visuais:** Notificações de erro com Alert component
- ✅ **Retry Automático:** Tentativas de reconexão
- ✅ **Fallback Graceful:** Interface funcional mesmo com erros de API

### 4. Tipos de Pergunta Suportados
- ✅ **Texto:** text, textarea, email, number
- ✅ **Seleção:** select, radio, checkbox
- ✅ **Data/Hora:** date, time, datetime
- ✅ **Especiais:** file, url, phone, cpf, cnpj, cep
- ✅ **Avançados:** scale, matrix-radio, matrix-checkbox, table-dynamic

## Configuração de Sincronização

### Intervalos Disponíveis
- 5 minutos
- 15 minutos
- 30 minutos
- 1 hora
- 4 horas
- 12 horas
- 24 horas

### Configurações
- **Endpoint da API:** Configurável
- **Chave da API:** Opcional para autenticação
- **Sincronização Automática:** Toggle on/off
- **Intervalo:** Selecionável

## Tratamento de Estados

### Loading States
- Indicadores de carregamento durante requisições
- Spinners animados para sincronização
- Estados de loading por formulário

### Error States
- Alertas de erro com mensagens descritivas
- Retry automático em caso de falha
- Fallback para dados locais quando possível

### Success States
- Confirmações visuais de sucesso
- Atualização automática de dados
- Feedback imediato para ações

## Considerações Técnicas

### 1. Performance
- Paginação implementada para grandes volumes
- Debounce na busca para evitar requisições excessivas
- Cache local de dados quando possível

### 2. Segurança
- Tokens JWT com expiração
- Headers de autenticação automáticos
- Validação de dados da API

### 3. Manutenibilidade
- Tipos TypeScript completos
- Separação clara de responsabilidades
- Hooks reutilizáveis

### 4. Escalabilidade
- Arquitetura preparada para expansão
- Fácil adição de novos endpoints
- Suporte a diferentes versões da API

## Próximos Passos

### 1. Melhorias de UX
- Implementar cache offline
- Adicionar notificações push
- Melhorar feedback visual

### 2. Funcionalidades Avançadas
- Exportação de dados
- Relatórios em tempo real
- Integração com webhooks

### 3. Otimizações
- Implementar lazy loading
- Adicionar service workers
- Otimizar bundle size

## Conclusão

A integração com a API do Marica Form Flow foi implementada com sucesso, proporcionando:

- **Sincronização completa** de formulários e perguntas
- **Interface moderna** e responsiva
- **Tratamento robusto** de erros e estados
- **Configuração flexível** de sincronização
- **Tipos seguros** com TypeScript
- **Arquitetura escalável** para futuras expansões

O sistema está pronto para uso em produção e pode ser facilmente expandido conforme necessário.

