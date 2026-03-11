# Sistema de Automação - Gabinete do Povo

## Objetivo
Implementar um sistema completo de automação que processa respostas de formulários importados via API externa e cria tarefas automaticamente baseadas em regras configuráveis.

## Estrutura do Sistema

### 1. Modelos de Dados (Prisma Schema)
- **AutomationRule**: Regras de automação configuráveis
- **AutomationAction**: Ações que podem ser executadas
- **AutomationCondition**: Condições para ativação das regras
- **Sector**: Setores responsáveis pelas tarefas
- **SLA**: Configurações de SLA por tipo de tarefa

### 2. Serviços
- **AutomationService**: Lógica principal de automação
- **RuleEngine**: Motor de regras para processar condições
- **TaskGenerator**: Gerador de tarefas baseado nas regras
- **NotificationService**: Serviço de notificações

### 3. Rotas da API
- **POST /api/automation/rules**: Criar regra de automação
- **GET /api/automation/rules**: Listar regras
- **PUT /api/automation/rules/:id**: Atualizar regra
- **DELETE /api/automation/rules/:id**: Deletar regra
- **POST /api/automation/process**: Processar respostas e executar automação
- **GET /api/automation/status**: Status do sistema de automação

### 4. Funcionalidades
- Processamento automático de respostas de formulários
- Criação de tarefas baseada em regras configuráveis
- Sistema de SLA configurável por tipo de tarefa
- Notificações automáticas
- Relatórios de automação

## Arquivos a serem criados/modificados

1. **backend/prisma/schema.prisma** - Adicionar novos modelos
2. **backend/src/services/automationService.ts** - Serviço principal
3. **backend/src/services/ruleEngine.ts** - Motor de regras
4. **backend/src/services/taskGenerator.ts** - Gerador de tarefas
5. **backend/src/routes/automation.ts** - Rotas da API
6. **backend/src/types/index.ts** - Novos tipos TypeScript
7. **backend/src/middleware/automation.ts** - Middleware de automação

## Status
- [x] Atualizar schema do Prisma
- [x] Criar serviços de automação
- [x] Implementar rotas da API
- [x] Criar sistema de notificações
- [x] Implementar processamento de respostas
- [x] Criar dados de seed
- [x] Executar migrações do banco
- [x] Popular dados iniciais
- [ ] Testes e validação
- [ ] Documentação da API

## Arquivos Criados/Modificados

### 1. Schema do Prisma (backend/prisma/schema.prisma)
- Adicionados modelos: Sector, SLA, AutomationRule, AutomationExecution
- Adicionado enum: AutomationStatus
- Atualizados relacionamentos existentes

### 2. Tipos TypeScript (backend/src/types/index.ts)
- Adicionados tipos para automação: AutomationCondition, AutomationAction, etc.
- Tipos para setores, SLAs e execuções de automação

### 3. Serviço de Automação (backend/src/services/automationService.ts)
- Classe AutomationService com lógica principal
- Processamento de respostas de formulários
- Avaliação de condições e execução de ações
- Criação automática de tarefas e notificações

### 4. Rotas da API (backend/src/routes/automation.ts)
- CRUD para regras de automação
- CRUD para setores e SLAs
- Endpoints de processamento de automação
- Status do sistema de automação

### 5. Serviço de Sincronização (backend/src/services/syncService.ts)
- Integração entre sincronização e automação
- Processamento automático após sincronização
- Status de sincronização

### 6. Seed de Dados (backend/src/seed-automation.ts)
- Setores padrão do sistema
- SLAs configurados
- Regras de automação de exemplo

### 7. Atualizações
- backend/src/index.ts: Adicionada rota de automação
- backend/src/routes/sync.ts: Integração com automação

## Funcionalidades Implementadas

### Sistema de Regras
- Criação de regras de automação baseadas em condições
- Suporte a múltiplos operadores (equals, contains, greater_than, etc.)
- Operadores lógicos (AND, OR)
- Priorização de regras

### Ações Automáticas
- Criação de tarefas com SLA configurável
- Envio de notificações
- Atribuição de setores
- Interpolação de variáveis nas ações

### Gestão de Setores e SLAs
- CRUD completo para setores
- Configuração de SLAs por prioridade
- Associação de regras com setores e SLAs

### Processamento Inteligente
- Avaliação automática de condições
- Execução de ações baseadas em respostas
- Log de execuções e erros
- Status detalhado do sistema

## Próximos Passos

1. **Testes**: Criar testes unitários e de integração
2. **Frontend**: Implementar interface para configuração de regras
3. **Monitoramento**: Dashboard de execuções e performance
4. **Escalabilidade**: Otimizações para grandes volumes
5. **Documentação**: API documentation completa
