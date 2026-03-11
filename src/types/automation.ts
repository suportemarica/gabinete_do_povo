// Tipos específicos para automação - mapeamento entre frontend e backend

export interface BackendAutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface BackendAutomationAction {
  type: 'CREATE_TASK' | 'SEND_NOTIFICATION' | 'UPDATE_STATUS' | 'ASSIGN_SECTOR';
  config: {
    title?: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    sectorId?: string;
    slaId?: string;
    notificationTitle?: string;
    notificationMessage?: string;
    notificationType?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  };
}

export interface BackendAutomationRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  formId?: string;
  sectorId?: string;
  slaId?: string;
  conditions: BackendAutomationCondition[];
  actions: BackendAutomationAction[];
  priority: number;
  createdAt: string;
  updatedAt: string;
  form?: {
    id: string;
    externalId: string;
    title: string;
    status: string;
  };
  sector?: {
    id: string;
    name: string;
    description?: string;
  };
  sla?: {
    id: string;
    name: string;
    duration: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  };
}

export interface BackendSector {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
    automationRules: number;
  };
}

export interface BackendSLA {
  id: string;
  name: string;
  description?: string;
  duration: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    automationRules: number;
  };
}

export interface BackendForm {
  id: string;
  externalId: string;
  title: string;
  description?: string;
  status: string;
  category?: string;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
  questions?: BackendFormQuestion[];
}

export interface BackendFormQuestion {
  id: string;
  formId: string;
  externalId: string;
  title: string;
  description?: string;
  type: 'TEXT' | 'TEXTAREA' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'DATE' | 'TIME' | 'DATETIME' | 'SELECT' | 'MULTISELECT' | 'RADIO' | 'CHECKBOX' | 'FILE' | 'RATING' | 'SCALE';
  required: boolean;
  order: number;
  options?: any;
  validation?: any;
  conditional?: any;
  createdAt: string;
  updatedAt: string;
}

// Funções de mapeamento
export function mapBackendToFrontendCondition(backend: BackendAutomationCondition, questionText?: string): any {
  return {
    id: `cond_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    questionId: backend.field,
    questionText: questionText || backend.field, // Usar questionText fornecido ou fallback para field
    operator: backend.operator,
    value: backend.value,
    questionType: 'text', // Será determinado baseado na pergunta
    questionOptions: [],
    logicalOperator: backend.logicalOperator || 'AND'
  };
}

export function mapFrontendToBackendCondition(frontend: any): BackendAutomationCondition {
  return {
    field: frontend.questionId,
    operator: frontend.operator,
    value: frontend.value,
    logicalOperator: frontend.logicalOperator || 'AND'
  };
}

export function mapBackendToFrontendAction(backend: BackendAutomationAction): any {
  return {
    type: backend.type.toLowerCase().replace('_', '_') as 'create_task' | 'send_notification' | 'update_status' | 'assign_sector',
    title: backend.config.title || '',
    description: backend.config.description || '',
    template: undefined
  };
}

export function mapFrontendToBackendAction(frontend: any): BackendAutomationAction {
  return {
    type: frontend.type.toUpperCase().replace('_', '_') as 'CREATE_TASK' | 'SEND_NOTIFICATION' | 'UPDATE_STATUS' | 'ASSIGN_SECTOR',
    config: {
      title: frontend.title,
      description: frontend.description,
      priority: frontend.priority?.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
      sectorId: frontend.sectorId,
      slaId: frontend.slaId,
      notificationTitle: frontend.notificationTitle,
      notificationMessage: frontend.notificationMessage,
      notificationType: frontend.notificationType?.toUpperCase() as 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
    }
  };
}

export function mapBackendToFrontendRule(backend: BackendAutomationRule): any {
  return {
    id: backend.id,
    name: backend.name,
    description: backend.description || '',
    formId: backend.formId || '',
    conditions: backend.conditions.map(mapBackendToFrontendCondition),
    logicalOperator: backend.conditions[0]?.logicalOperator || 'AND',
    action: mapBackendToFrontendAction(backend.actions[0] || { type: 'CREATE_TASK', config: {} }),
    sla: {
      startOffset: 0, // Será mapeado do SLA se disponível
      duration: backend.sla?.duration || 24
    },
    sector: backend.sector?.name || '',
    priority: backend.priority === 0 ? 'low' : 
              backend.priority === 1 ? 'medium' : 
              backend.priority === 2 ? 'high' : 'urgent'
  };
}

export function mapFrontendToBackendRule(frontend: any): BackendAutomationRule {
  return {
    id: frontend.id || '',
    name: frontend.name,
    description: frontend.description,
    isActive: true,
    formId: frontend.formId,
    sectorId: undefined, // Será mapeado do setor se necessário
    slaId: undefined, // Será mapeado do SLA se necessário
    conditions: frontend.conditions.map(mapFrontendToBackendCondition),
    actions: [mapFrontendToBackendAction(frontend.action)],
    priority: frontend.priority === 'low' ? 0 : 
              frontend.priority === 'medium' ? 1 : 
              frontend.priority === 'high' ? 2 : 3
  };
}

export function mapBackendToFrontendForm(backend: BackendForm): any {
  const mappedForm = {
    id: backend.id,
    name: backend.title,
    description: backend.description || '',
    questions: backend.questions?.map(q => {
      let mappedOptions = [];
      if (q.options) {
        if (Array.isArray(q.options)) {
          // Verificar se os itens do array são objetos ou strings
          mappedOptions = q.options.map((opt: any) => {
            if (typeof opt === 'object' && opt !== null) {
              return opt.label || opt.value || opt.text || opt.name || JSON.stringify(opt);
            } else {
              return opt;
            }
          });
        } else if (q.options.options && Array.isArray(q.options.options)) {
          mappedOptions = q.options.options.map((opt: any) => {
            return opt.label || opt.value || opt.text || opt.name || JSON.stringify(opt);
          });
        } else {
          mappedOptions = Object.values(q.options);
        }
      }
      
      const mappedQuestion = {
        id: q.id,
        text: q.title,
        type: q.type.toLowerCase() as 'text' | 'select' | 'multiselect' | 'date' | 'boolean',
        options: mappedOptions,
        required: q.required
      };
      
      return mappedQuestion;
    }) || [],
    active: backend.status === 'ACTIVE',
    apiEndpoint: '', // Não disponível no backend
    lastSync: backend.updatedAt
  };
  
  return mappedForm;
}

export function mapBackendToFrontendSector(backend: BackendSector): any {
  return {
    id: backend.id,
    name: backend.name,
    description: backend.description || '',
    responsibleUsers: [], // Não disponível no backend
    active: backend.isActive
  };
}
