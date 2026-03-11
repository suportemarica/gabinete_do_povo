export interface Question {
  id: string;
  text: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'boolean';
  options?: string[];
  required: boolean;
}

export interface FormResponse {
  id: string;
  questionId: string;
  answer: string | string[];
  timestamp: string;
  formId: string;
}

export interface TaskRule {
  id: string;
  name: string;
  description: string;
  formId: string; // ID do formulário associado
  conditions: AutomationCondition[]; // Múltiplas condições com operadores lógicos
  action: TaskAction;
  sla: {
    startOffset: number; // hours
    duration: number; // hours
  };
  sector: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  logicalOperator: 'AND' | 'OR'; // Operador lógico para combinar condições
}

export interface AutomationCondition {
  id: string;
  questionId: string;
  questionText: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: string | string[];
  questionType: 'text' | 'select' | 'multiselect' | 'date' | 'boolean';
  questionOptions?: string[]; // Opções disponíveis para perguntas de seleção
}

export interface TaskAction {
  type: 'create_task' | 'send_notification' | 'assign_sector';
  title: string;
  description: string;
  template?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sector: string;
  assignedTo?: string;
  createdAt: string;
  startDate: string;
  dueDate: string;
  completedAt?: string;
  formResponseId: string;
  ruleId: string;
  relatedResponses: FormResponse[];
}

export interface Notification {
  id: string;
  type: 'task_created' | 'task_overdue' | 'sla_warning' | 'task_completed';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  taskId?: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface FormConfig {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  active: boolean;
  apiEndpoint: string;
  apiKey?: string;
  lastSync?: string;
}

export interface Sector {
  id: string;
  name: string;
  description: string;
  responsibleUsers: string[];
  active: boolean;
}

export interface DashboardStats {
  totalTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completedTasks: number;
  tasksByPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  tasksBySector: Record<string, number>;
  slaCompliance: number;
}