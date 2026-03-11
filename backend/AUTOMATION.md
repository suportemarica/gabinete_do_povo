# Sistema de Automação - Gabinete do Povo

## Visão Geral

O sistema de automação do Gabinete do Povo permite criar regras inteligentes que processam automaticamente as respostas de formulários importados via API externa, criando tarefas, enviando notificações e executando outras ações baseadas em condições configuráveis.

## Funcionalidades Principais

### 🤖 Regras de Automação
- **Condições Flexíveis**: Suporte a múltiplos operadores (equals, contains, greater_than, etc.)
- **Operadores Lógicos**: AND/OR para combinar condições
- **Priorização**: Sistema de prioridades para execução de regras
- **Ativação/Desativação**: Controle granular de regras ativas

### 📋 Ações Automáticas
- **Criação de Tarefas**: Geração automática com SLA configurável
- **Notificações**: Envio de alertas personalizados
- **Atribuição de Setores**: Direcionamento automático para setores específicos
- **Interpolação de Variáveis**: Uso de dados do formulário nas ações

### 🏢 Gestão de Setores e SLAs
- **Setores**: Organização de responsabilidades
- **SLAs**: Configuração de prazos por prioridade
- **Associações**: Vinculação de regras com setores e SLAs

## Arquitetura

### Modelos de Dados

```typescript
// Regra de Automação
interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  formId?: string;
  sectorId?: string;
  slaId?: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  priority: number;
}

// Condição de Regra
interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

// Ação de Regra
interface AutomationAction {
  type: 'CREATE_TASK' | 'SEND_NOTIFICATION' | 'UPDATE_STATUS' | 'ASSIGN_SECTOR';
  config: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    sectorId?: string;
    slaId?: string;
    notificationTitle?: string;
    notificationMessage?: string;
    notificationType?: NotificationType;
  };
}
```

### Serviços

#### AutomationService
- Processamento de respostas de formulários
- Avaliação de condições de regras
- Execução de ações automáticas
- Geração de tarefas e notificações

#### SyncService
- Integração com API externa
- Sincronização de formulários
- Processamento automático após sincronização

## API Endpoints

### Regras de Automação
- `GET /api/automation/rules` - Listar regras
- `POST /api/automation/rules` - Criar regra
- `GET /api/automation/rules/:id` - Obter regra específica
- `PUT /api/automation/rules/:id` - Atualizar regra
- `DELETE /api/automation/rules/:id` - Deletar regra

### Setores
- `GET /api/automation/sectors` - Listar setores
- `POST /api/automation/sectors` - Criar setor

### SLAs
- `GET /api/automation/slas` - Listar SLAs
- `POST /api/automation/slas` - Criar SLA

### Processamento
- `POST /api/automation/process` - Processar resposta específica
- `POST /api/automation/process-all/:formId` - Processar todas as respostas de um formulário
- `GET /api/automation/status` - Status do sistema

## Exemplos de Uso

### Criando uma Regra de Automação

```typescript
const rule = {
  name: "Solicitação de Documento",
  description: "Cria tarefa para solicitações de documentos",
  isActive: true,
  sectorId: "sector-id",
  slaId: "sla-id",
  conditions: [
    {
      field: "tipo_solicitacao",
      operator: "equals",
      value: "documento"
    }
  ],
  actions: [
    {
      type: "CREATE_TASK",
      config: {
        title: "Solicitação de Documento - {{nome_solicitante}}",
        description: "Processar solicitação de {{tipo_documento}}",
        priority: "MEDIUM"
      }
    },
    {
      type: "SEND_NOTIFICATION",
      config: {
        notificationTitle: "Nova Solicitação",
        notificationMessage: "Nova solicitação de documento recebida",
        notificationType: "INFO"
      }
    }
  ],
  priority: 10
};
```

### Processando uma Resposta

```typescript
const result = await automationService.processFormResponse({
  formId: "form-id",
  responseId: "response-id",
  forceExecution: false
});

console.log(`Tarefas criadas: ${result.createdTasks}`);
console.log(`Notificações enviadas: ${result.sentNotifications}`);
```

## Configuração

### 1. Executar Migrações
```bash
npm run migrate
```

### 2. Popular Dados Iniciais
```bash
npm run seed:automation
```

### 3. Configurar Variáveis de Ambiente
```env
EXTERNAL_API_EMAIL=seu-email@exemplo.com
EXTERNAL_API_PASSWORD=sua-senha
```

## Monitoramento

### Status do Sistema
```bash
GET /api/automation/status
```

Retorna:
- Número total de regras
- Regras ativas
- Última execução
- Execuções recentes

### Logs de Execução
Todas as execuções são registradas na tabela `automation_executions` com:
- Status da execução
- Resultado das ações
- Erros encontrados
- Timestamp de execução

## Exemplos de Regras Pré-configuradas

### 1. Solicitação de Documento
- **Condição**: `tipo_solicitacao = "documento"`
- **Ação**: Criar tarefa no setor "Atendimento ao Cidadão"
- **SLA**: 72 horas (Média Prioridade)

### 2. Denúncia
- **Condição**: `tipo_solicitacao = "denuncia"`
- **Ação**: Criar tarefa no setor "Fiscalização"
- **SLA**: 24 horas (Alta Prioridade)

### 3. Solicitação Urgente
- **Condição**: `urgencia = "alta"` OR `prioridade = "urgente"`
- **Ação**: Criar tarefa urgente
- **SLA**: 2 horas (Urgente)

## Troubleshooting

### Regras Não Executando
1. Verificar se a regra está ativa (`isActive: true`)
2. Verificar se as condições estão corretas
3. Verificar se o formulário tem respostas
4. Consultar logs de execução

### Erros de Execução
1. Verificar se os setores e SLAs existem
2. Verificar se as variáveis de interpolação estão corretas
3. Consultar logs de erro na tabela `automation_executions`

### Performance
1. Usar índices apropriados nas consultas
2. Limitar o número de regras ativas
3. Monitorar logs de execução para identificar gargalos

## Próximas Funcionalidades

- [ ] Interface web para configuração de regras
- [ ] Dashboard de monitoramento
- [ ] Relatórios de performance
- [ ] Agendamento de execuções
- [ ] Webhooks para integrações externas
- [ ] Machine Learning para otimização de regras

