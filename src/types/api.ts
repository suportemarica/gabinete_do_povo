// Tipos da API baseados na documentação do Marica Form Flow

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

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

// Tipos de Usuário
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  departments: ApiDepartment[];
  userRoles?: UserRole[];
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

// Tipos de Departamento
export interface ApiDepartment {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos de Formulário
export interface ApiForm {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  category?: string;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  departmentIds: string[];
  sections: ApiFormSection[];
  questions: ApiFormQuestion[];
  settings?: ApiFormSettings;
}

export interface ApiFormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  formId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiFormQuestion {
  id: string;
  type: ValidQuestionType;
  title: string;
  description?: string;
  required: boolean;
  order: number;
  formId: string;
  sectionId?: string;
  options: ApiFormQuestionOption[] | string; // Pode ser array ou string JSON
  validation?: ApiFormQuestionValidation | string; // Pode ser objeto ou string JSON
  conditional?: ApiFormQuestionConditional | string; // Pode ser objeto ou string JSON
  createdAt: string;
  updatedAt: string;
}

export type ValidQuestionType = 
  | 'text' 
  | 'email' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'file' 
  | 'date' 
  | 'time' 
  | 'datetime' 
  | 'url' 
  | 'phone' 
  | 'cpf' 
  | 'cnpj' 
  | 'cep' 
  | 'scale' 
  | 'matrix-radio' 
  | 'matrix-checkbox' 
  | 'table-dynamic' 
  | 'checkbox-quantity' 
  | 'coded-selection' 
  | 'composite-field';

export interface ApiFormQuestionOption {
  id: string;
  value: string;
  order: number;
  isExclusive: boolean;
  questionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiFormQuestionValidation {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface ApiFormQuestionConditional {
  dependsOn: string;
  value: string;
  operator: 'equals' | 'contains' | 'not_equals';
}

export interface ApiFormSettings {
  allowMultipleResponses: boolean;
  showProgress: boolean;
  collectEmail: boolean;
  isPublic: boolean;
  responsePeriodStart?: string;
  responsePeriodEnd?: string;
}

// Tipos de Resposta
export interface ApiFormResponse {
  id: string;
  status: 'draft' | 'in_progress' | 'completed';
  submittedAt: string;
  ipAddress?: string;
  formId: string;
  userId?: string;
  respondentEmail?: string;
  questions: ApiFormQuestionResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiFormQuestionResponse {
  id: string;
  questionId: string;
  responseId: string;
  value: any;
  createdAt: string;
  updatedAt: string;
}

// Tipos de Autenticação
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: ApiUser;
  token: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
  departmentIds?: string[];
}

// Tipos de Filtros e Query
export interface FormFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  departmentId?: string;
}

export interface DepartmentFilters {
  page?: number;
  limit?: number;
  search?: string;
}

// Tipos de Upload
export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

// Tipos de Tags
export interface ApiTag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos de Notas de Resposta
export interface ApiResponseNote {
  id: string;
  responseId: string;
  content: string;
  isPrivate: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos de Permissões
export interface ApiPermission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiRole {
  id: string;
  name: string;
  description?: string;
  permissions: ApiPermission[];
  createdAt: string;
  updatedAt: string;
}

