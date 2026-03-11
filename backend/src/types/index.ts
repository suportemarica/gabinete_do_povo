import { Request } from 'express';
import { User, SyncConfig, Form, Task, Notification, Sector, SLA, AutomationRule, AutomationExecution, AutomationStatus, TaskPriority, NotificationType } from '@prisma/client';

// Tipos de resposta da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Tipos de paginação
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// Tipos de autenticação
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
  expiresIn: number;
}

// Tipos de configuração de sincronização
export interface SyncConfigRequest {
  apiEndpoint: string;
  apiKey?: string;
  autoSync: boolean;
  syncInterval: number;
}

export interface SyncConfigResponse extends SyncConfig {
  user: Omit<User, 'password'>;
}

// Tipos de formulário
export interface FormRequest {
  externalId: string;
  title: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  category?: string;
  instructions?: string;
}

export interface FormResponse extends Form {
  questions: any[];
  responses: any[];
  user: Omit<User, 'password'>;
}

// Tipos da API externa
export interface ApiForm {
  id: string;
  title: string;
  description?: string;
  status?: string;
  category?: string;
  instructions?: string;
  questions?: ApiFormQuestion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiFormQuestion {
  id: string;
  title: string;
  description?: string;
  type: string;
  required?: boolean;
  order?: number;
  options?: any;
  validation?: any;
  conditional?: any;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiDepartment {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos de tarefa
export interface TaskRequest {
  formId?: string;
  title: string;
  description?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
}

export interface TaskResponse extends Task {
  form?: {
    id: string;
    externalId: string;
    title: string;
    status: string;
  } | null;
  user: Omit<User, 'password'>;
}

// Tipos de notificação
export interface NotificationRequest {
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  userId?: string;
}

export interface NotificationResponse extends Notification {
  user?: Omit<User, 'password'> | null;
}

// Tipos de filtros
export interface FormFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
}

export interface TaskFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  userId?: string;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
  userId?: string;
}

// Tipos de middleware
export interface AuthenticatedRequest extends Request {
  user: Omit<User, 'password'>;
}

// Tipo para requisições autenticadas (usando declaração global)
export type AuthRequest = Request;

// Tipos de sincronização
export interface SyncStatus {
  isRunning: boolean;
  lastSync: Date | null;
  nextSync: Date | null;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  syncedForms: number;
  errors: string[];
  duration: number;
}

// Tipos de configuração externa
export interface ExternalApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retries: number;
}

// Tipos de validação
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Tipos de automação
export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface AutomationAction {
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

export interface AutomationRuleRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  formId?: string;
  sectorId?: string;
  slaId?: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  priority?: number;
}

export interface AutomationRuleResponse extends AutomationRule {
  form?: {
    id: string;
    externalId: string;
    title: string;
    status: string;
  } | null;
  sector?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  sla?: {
    id: string;
    name: string;
    duration: number;
    priority: TaskPriority;
  } | null;
}

export interface SectorRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface SectorResponse extends Sector {
  tasksCount?: number;
  automationRulesCount?: number;
}

export interface SLARequest {
  name: string;
  description?: string;
  duration: number;
  priority: TaskPriority;
  isActive?: boolean;
}

export interface SLAResponse extends SLA {
  automationRulesCount?: number;
}

export interface AutomationExecutionResponse extends AutomationExecution {
  rule: {
    id: string;
    name: string;
  };
  form: {
    id: string;
    title: string;
  };
  response: {
    id: string;
    submittedAt: Date;
  };
}

export interface AutomationProcessRequest {
  formId: string;
  responseId: string;
  forceExecution?: boolean;
}

export interface AutomationProcessResponse {
  success: boolean;
  executedRules: number;
  createdTasks: number;
  sentNotifications: number;
  errors: string[];
  executions: AutomationExecutionResponse[];
}

export interface AutomationStatusResponse {
  isActive: boolean;
  totalRules: number;
  activeRules: number;
  lastExecution: Date | null;
  nextExecution: Date | null;
  recentExecutions: AutomationExecutionResponse[];
}
