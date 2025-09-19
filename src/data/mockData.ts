import { Task, FormResponse, TaskRule, Notification, FormConfig, Sector } from '@/types';

export const mockSectors: Sector[] = [
  {
    id: 'setor-1',
    name: 'Obras Públicas',
    description: 'Responsável por infraestrutura e obras da cidade',
    responsibleUsers: ['João Silva', 'Maria Santos'],
    active: true,
  },
  {
    id: 'setor-2',
    name: 'Saúde',
    description: 'Departamento de saúde pública',
    responsibleUsers: ['Dr. Pedro', 'Enfª Ana'],
    active: true,
  },
  {
    id: 'setor-3',
    name: 'Educação',
    description: 'Secretaria de educação municipal',
    responsibleUsers: ['Prof. Carlos', 'Coord. Lucia'],
    active: true,
  },
  {
    id: 'setor-4',
    name: 'Meio Ambiente',
    description: 'Secretaria do meio ambiente',
    responsibleUsers: ['Biólogo José', 'Téc. Marina'],
    active: true,
  },
];

export const mockFormConfigs: FormConfig[] = [
  {
    id: 'form-1',
    name: 'Ouvidoria Cidadã',
    description: 'Formulário principal para recebimento de demandas da população',
    questions: [
      {
        id: 'q1',
        text: 'Qual o tipo da sua solicitação?',
        type: 'select',
        options: ['Reclamação', 'Sugestão', 'Elogio', 'Denúncia', 'Solicitação de Serviço'],
        required: true,
      },
      {
        id: 'q2',
        text: 'Em qual área você deseja fazer sua solicitação?',
        type: 'select',
        options: ['Obras Públicas', 'Saúde', 'Educação', 'Meio Ambiente', 'Transporte', 'Segurança'],
        required: true,
      },
      {
        id: 'q3',
        text: 'Descreva sua solicitação',
        type: 'text',
        required: true,
      },
      {
        id: 'q4',
        text: 'Qual a urgência da solicitação?',
        type: 'select',
        options: ['Baixa', 'Média', 'Alta', 'Urgente'],
        required: true,
      },
    ],
    active: true,
    apiEndpoint: 'https://api.gabinete.gov.br/forms/ouvidoria',
    lastSync: '2024-01-15T10:30:00Z',
  },
];

export const mockFormResponses: FormResponse[] = [
  {
    id: 'resp-1',
    questionId: 'q1',
    answer: 'Reclamação',
    timestamp: '2024-01-15T09:00:00Z',
    formId: 'form-1',
  },
  {
    id: 'resp-2',
    questionId: 'q2',
    answer: 'Obras Públicas',
    timestamp: '2024-01-15T09:00:00Z',
    formId: 'form-1',
  },
  {
    id: 'resp-3',
    questionId: 'q3',
    answer: 'Buraco na rua em frente ao número 123 da Rua das Flores',
    timestamp: '2024-01-15T09:00:00Z',
    formId: 'form-1',
  },
  {
    id: 'resp-4',
    questionId: 'q4',
    answer: 'Alta',
    timestamp: '2024-01-15T09:00:00Z',
    formId: 'form-1',
  },
];

export const mockTaskRules: TaskRule[] = [
  {
    id: 'rule-1',
    name: 'Reclamação de Obras Públicas',
    description: 'Cria tarefa quando há reclamação sobre obras públicas',
    questionId: 'q1',
    triggerValue: 'Reclamação',
    action: {
      type: 'create_task',
      title: 'Verificar Reclamação de Obras',
      description: 'Analisar e resolver reclamação sobre obras públicas',
    },
    sla: {
      startOffset: 0, // inicia imediatamente
      duration: 72, // 72 horas para resolver
    },
    sector: 'Obras Públicas',
    priority: 'high',
  },
  {
    id: 'rule-2',
    name: 'Denúncia Ambiental',
    description: 'Cria tarefa urgente para denúncias ambientais',
    questionId: 'q1',
    triggerValue: 'Denúncia',
    action: {
      type: 'create_task',
      title: 'Investigar Denúncia Ambiental',
      description: 'Investigar e tomar medidas sobre denúncia ambiental',
    },
    sla: {
      startOffset: 0,
      duration: 24, // 24 horas para primeira resposta
    },
    sector: 'Meio Ambiente',
    priority: 'urgent',
  },
  {
    id: 'rule-3',
    name: 'Solicitação de Saúde',
    description: 'Processa solicitações relacionadas à saúde',
    questionId: 'q2',
    triggerValue: 'Saúde',
    action: {
      type: 'create_task',
      title: 'Atender Solicitação de Saúde',
      description: 'Processar solicitação relacionada à saúde pública',
    },
    sla: {
      startOffset: 2, // inicia em 2 horas
      duration: 48, // 48 horas para resolver
    },
    sector: 'Saúde',
    priority: 'medium',
  },
];

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Verificar Reclamação de Obras',
    description: 'Analisar e resolver reclamação sobre buraco na Rua das Flores',
    status: 'in_progress',
    priority: 'high',
    sector: 'Obras Públicas',
    assignedTo: 'João Silva',
    createdAt: '2024-01-15T09:00:00Z',
    startDate: '2024-01-15T09:00:00Z',
    dueDate: '2024-01-18T09:00:00Z',
    formResponseId: 'resp-1',
    ruleId: 'rule-1',
    relatedResponses: mockFormResponses,
  },
  {
    id: 'task-2',
    title: 'Atender Solicitação de Saúde',
    description: 'Processar solicitação sobre falta de medicamentos no posto',
    status: 'pending',
    priority: 'medium',
    sector: 'Saúde',
    createdAt: '2024-01-14T14:00:00Z',
    startDate: '2024-01-14T16:00:00Z',
    dueDate: '2024-01-16T16:00:00Z',
    formResponseId: 'resp-2',
    ruleId: 'rule-3',
    relatedResponses: [],
  },
  {
    id: 'task-3',
    title: 'Investigar Denúncia Ambiental',
    description: 'Investigar denúncia de despejo irregular no Rio Verde',
    status: 'overdue',
    priority: 'urgent',
    sector: 'Meio Ambiente',
    assignedTo: 'Biólogo José',
    createdAt: '2024-01-12T08:00:00Z',
    startDate: '2024-01-12T08:00:00Z',
    dueDate: '2024-01-13T08:00:00Z',
    formResponseId: 'resp-3',
    ruleId: 'rule-2',
    relatedResponses: [],
  },
  {
    id: 'task-4',
    title: 'Melhoria na Escola Municipal',
    description: 'Implementar melhorias sugeridas na Escola João Paulo II',
    status: 'completed',
    priority: 'low',
    sector: 'Educação',
    assignedTo: 'Prof. Carlos',
    createdAt: '2024-01-10T10:00:00Z',
    startDate: '2024-01-10T10:00:00Z',
    dueDate: '2024-01-17T10:00:00Z',
    completedAt: '2024-01-16T15:30:00Z',
    formResponseId: 'resp-4',
    ruleId: 'rule-1',
    relatedResponses: [],
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'task_overdue',
    title: 'Tarefa em Atraso',
    message: 'A tarefa "Investigar Denúncia Ambiental" está em atraso',
    timestamp: '2024-01-15T10:00:00Z',
    read: false,
    taskId: 'task-3',
    severity: 'error',
  },
  {
    id: 'notif-2',
    type: 'task_created',
    title: 'Nova Tarefa Criada',
    message: 'Tarefa "Verificar Reclamação de Obras" foi criada automaticamente',
    timestamp: '2024-01-15T09:00:00Z',
    read: false,
    taskId: 'task-1',
    severity: 'info',
  },
  {
    id: 'notif-3',
    type: 'sla_warning',
    title: 'Aviso de SLA',
    message: 'A tarefa "Atender Solicitação de Saúde" vence em 6 horas',
    timestamp: '2024-01-16T10:00:00Z',
    read: true,
    taskId: 'task-2',
    severity: 'warning',
  },
  {
    id: 'notif-4',
    type: 'task_completed',
    title: 'Tarefa Concluída',
    message: 'A tarefa "Melhoria na Escola Municipal" foi concluída com sucesso',
    timestamp: '2024-01-16T15:30:00Z',
    read: true,
    taskId: 'task-4',
    severity: 'success',
  },
];