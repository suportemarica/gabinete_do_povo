import { Request } from 'express';
import { User, SyncConfig, Form, Task, Notification } from '@prisma/client';

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
