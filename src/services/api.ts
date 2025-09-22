import { 
  ApiResponse, 
  ApiForm, 
  ApiUser, 
  ApiDepartment, 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest,
  FormFilters,
  DepartmentFilters,
  PaginatedResponse
} from '@/types/api';

// Configuração da API
const API_BASE_URL = 'http://localhost:3002/api';

class ApiService {
  private token: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    // Recuperar token do localStorage se existir
    this.token = localStorage.getItem('api_token');
    const expiry = localStorage.getItem('api_token_expiry');
    this.tokenExpiry = expiry ? parseInt(expiry, 10) : null;
    
    // Verificar se o token ainda é válido
    this.validateToken();
  }

  // Métodos de autenticação
  setToken(token: string, expiresIn?: number) {
    this.token = token;
    localStorage.setItem('api_token', token);
    
    // Calcular expiração do token (padrão: 24 horas)
    const expiry = expiresIn ? Date.now() + (expiresIn * 1000) : Date.now() + (24 * 60 * 60 * 1000);
    this.tokenExpiry = expiry;
    localStorage.setItem('api_token_expiry', expiry.toString());
  }

  clearToken() {
    this.token = null;
    this.tokenExpiry = null;
    localStorage.removeItem('api_token');
    localStorage.removeItem('api_token_expiry');
  }

  // Validar se o token ainda é válido
  private validateToken(): boolean {
    if (!this.token || !this.tokenExpiry) {
      this.clearToken();
      return false;
    }

    if (Date.now() >= this.tokenExpiry) {
      this.clearToken();
      return false;
    }

    return true;
  }

  // Verificar se está autenticado com token válido
  isAuthenticated(): boolean {
    return this.validateToken();
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    console.log('🔍 Processando resposta:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('📄 Dados da resposta:', data);

    if (!response.ok) {
      console.error('❌ Erro na resposta:', response.status, data);
      
      // Se for erro 401, limpar token
      if (response.status === 401) {
        this.clearToken();
        throw new Error('Token expirado. Faça login novamente.');
      }
      
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✅ Resposta processada com sucesso');
    return data;
  }

  // Verificar se o token está próximo do vencimento (5 minutos antes)
  private isTokenNearExpiry(): boolean {
    if (!this.tokenExpiry) return false;
    const fiveMinutes = 5 * 60 * 1000; // 5 minutos em millisegundos
    return Date.now() >= (this.tokenExpiry - fiveMinutes);
  }

  // Renovar token se necessário
  private async refreshTokenIfNeeded(): Promise<boolean> {
    if (!this.isTokenNearExpiry()) return true;

    try {
      // Tentar renovar o token usando o endpoint de refresh
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.token) {
          this.setToken(data.data.token, data.data.expiresIn);
          return true;
        }
      }
    } catch (error) {
      console.warn('Falha ao renovar token:', error);
    }

    // Se não conseguir renovar, limpar token
    this.clearToken();
    return false;
  }

  // Autenticação
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    console.log('🔐 Tentando fazer login com:', credentials);
    console.log('🌐 URL da API:', `${API_BASE_URL}/auth/login`);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('📡 Resposta da API:', response.status, response.statusText);
    console.log('📋 Headers da resposta:', Object.fromEntries(response.headers.entries()));

    const result = await this.handleResponse<LoginResponse>(response);
    
    if (result.success && result.data?.token) {
      // Armazenar token com tempo de expiração
      this.setToken(result.data.token, result.data.expiresIn);
    }

    return result;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await this.handleResponse<LoginResponse>(response);
    
    if (result.success && result.data?.token) {
      // Armazenar token com tempo de expiração
      this.setToken(result.data.token, result.data.expiresIn);
    }

    return result;
  }

  async getProfile(): Promise<ApiResponse<ApiUser>> {
    // Verificar e renovar token se necessário
    await this.refreshTokenIfNeeded();
    
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<ApiUser>(response);
  }

  async changePassword(newPassword: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ newPassword }),
    });

    return this.handleResponse<void>(response);
  }

  // Formulários
  async getForms(filters: FormFilters = {}): Promise<ApiResponse<PaginatedResponse<ApiForm>>> {
    // Verificar e renovar token se necessário
    await this.refreshTokenIfNeeded();
    
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);

    const response = await fetch(`${API_BASE_URL}/forms?${params.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<PaginatedResponse<ApiForm>>(response);
  }

  async getForm(id: string): Promise<ApiResponse<ApiForm>> {
    // Verificar e renovar token se necessário
    await this.refreshTokenIfNeeded();
    
    const response = await fetch(`${API_BASE_URL}/forms/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<ApiForm>(response);
  }

  async getPublicForm(token: string): Promise<ApiResponse<{ form: ApiForm }>> {
    const response = await fetch(`${API_BASE_URL}/forms/public/${token}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<{ form: ApiForm }>(response);
  }

  async createForm(formData: Partial<ApiForm>): Promise<ApiResponse<ApiForm>> {
    const response = await fetch(`${API_BASE_URL}/forms`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(formData),
    });

    return this.handleResponse<ApiForm>(response);
  }

  async updateForm(id: string, formData: Partial<ApiForm>): Promise<ApiResponse<ApiForm>> {
    const response = await fetch(`${API_BASE_URL}/forms/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(formData),
    });

    return this.handleResponse<ApiForm>(response);
  }

  async deleteForm(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/forms/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<void>(response);
  }

  async duplicateForm(id: string): Promise<ApiResponse<ApiForm>> {
    const response = await fetch(`${API_BASE_URL}/forms/${id}/duplicate`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    return this.handleResponse<ApiForm>(response);
  }

  // Departamentos
  async getDepartments(filters: DepartmentFilters = {}): Promise<ApiResponse<PaginatedResponse<ApiDepartment>>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await fetch(`${API_BASE_URL}/departments?${params.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<PaginatedResponse<ApiDepartment>>(response);
  }

  async getDepartment(id: string): Promise<ApiResponse<ApiDepartment>> {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<ApiDepartment>(response);
  }

  async createDepartment(departmentData: { name: string; description?: string }): Promise<ApiResponse<ApiDepartment>> {
    const response = await fetch(`${API_BASE_URL}/departments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(departmentData),
    });

    return this.handleResponse<ApiDepartment>(response);
  }

  async updateDepartment(id: string, departmentData: { name: string; description?: string }): Promise<ApiResponse<ApiDepartment>> {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(departmentData),
    });

    return this.handleResponse<ApiDepartment>(response);
  }

  async deleteDepartment(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<void>(response);
  }

  // Respostas de Formulários
  async submitFormResponse(responseData: {
    formId: string;
    answers: Record<string, any>;
    respondentEmail?: string;
  }): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/forms/responses`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(responseData),
    });

    return this.handleResponse<void>(response);
  }

  async getFormResponses(formId: string): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/forms/${formId}/responses`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<any[]>(response);
  }

  async exportFormResponses(formId: string, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/forms/${formId}/responses/export?format=${format}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.blob();
  }

  // Sincronização com API externa
  async syncForms(syncData: {
    apiEndpoint: string;
    email: string;
    password: string;
    apiKey?: string;
    forceSync?: boolean;
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/sync/forms`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(syncData),
    });

    return this.handleResponse<any>(response);
  }

  async testExternalApiConnection(testData: {
    apiEndpoint: string;
    email: string;
    password: string;
    apiKey?: string;
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/sync/test`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(testData),
    });

    return this.handleResponse<any>(response);
  }

  async getSyncStatus(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/sync/status`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<any>(response);
  }

  async getSyncedForms(filters: FormFilters = {}): Promise<ApiResponse<PaginatedResponse<ApiForm>>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);

    const response = await fetch(`${API_BASE_URL}/sync/forms?${params.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<PaginatedResponse<ApiForm>>(response);
  }

  // Utilitários
  getToken(): string | null {
    return this.token;
  }
}

// Instância singleton do serviço
export const apiService = new ApiService();
export default apiService;
