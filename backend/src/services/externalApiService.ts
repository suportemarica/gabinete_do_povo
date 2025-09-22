import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiForm, ApiFormQuestion, ApiUser, ApiDepartment, ApiResponse, PaginatedResponse } from '../types';

export interface ExternalApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface ExternalApiCredentials {
  email: string;
  password: string;
}

export interface ExternalApiAuth {
  token: string;
  expiresIn: number;
  user: ApiUser;
}

export class ExternalApiService {
  private client: AxiosInstance;
  private auth: ExternalApiAuth | null = null;
  private config: ExternalApiConfig;

  constructor(config: ExternalApiConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token automaticamente
    this.client.interceptors.request.use((config) => {
      if (this.auth?.token) {
        config.headers.Authorization = `Bearer ${this.auth.token}`;
      }
      return config;
    });

    // Interceptor para tratar respostas
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado, limpar auth
          this.auth = null;
        }
        return Promise.reject(error);
      }
    );
  }

  // Autenticação
  async authenticate(credentials: ExternalApiCredentials): Promise<ApiResponse<ExternalApiAuth>> {
    try {
      const response: AxiosResponse<ApiResponse<ExternalApiAuth>> = await this.client.post('/auth/login', credentials);
      
      if (response.data.success && response.data.data) {
        this.auth = response.data.data;
        return response.data;
      } else {
        return {
          success: false,
          error: response.data.error || 'Falha na autenticação',
        };
      }
    } catch (error: any) {
      console.error('Erro na autenticação com API externa:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erro de conexão com a API externa',
      };
    }
  }

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    return !!this.auth?.token;
  }

  // Obter informações do usuário autenticado
  getAuthenticatedUser(): ApiUser | null {
    return this.auth?.user || null;
  }

  // Buscar formulários da API externa
  async getForms(filters: any = {}): Promise<ApiResponse<PaginatedResponse<ApiForm>>> {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Não autenticado na API externa',
        };
      }

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response: AxiosResponse<ApiResponse<PaginatedResponse<ApiForm>>> = await this.client.get(`/forms?${params.toString()}`);
      
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar formulários da API externa:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erro ao buscar formulários',
      };
    }
  }

  // Buscar formulário específico da API externa
  async getForm(id: string): Promise<ApiResponse<ApiForm>> {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Não autenticado na API externa',
        };
      }

      const response: AxiosResponse<ApiResponse<ApiForm>> = await this.client.get(`/forms/${id}`);
      
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar formulário da API externa:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erro ao buscar formulário',
      };
    }
  }

  // Buscar departamentos da API externa
  async getDepartments(filters: any = {}): Promise<ApiResponse<PaginatedResponse<ApiDepartment>>> {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Não autenticado na API externa',
        };
      }

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response: AxiosResponse<ApiResponse<PaginatedResponse<ApiDepartment>>> = await this.client.get(`/departments?${params.toString()}`);
      
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar departamentos da API externa:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erro ao buscar departamentos',
      };
    }
  }

  // Testar conexão com a API externa
  async testConnection(): Promise<ApiResponse<{ status: string; responseTime: number }>> {
    try {
      const startTime = Date.now();
      const response = await this.client.get('/health');
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          status: response.data.status || 'OK',
          responseTime,
        },
      };
    } catch (error: any) {
      console.error('Erro ao testar conexão com API externa:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erro de conexão',
      };
    }
  }

  // Sincronizar formulários (buscar todos e retornar dados para sincronização)
  async syncForms(): Promise<ApiResponse<{ forms: ApiForm[]; total: number }>> {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Não autenticado na API externa',
        };
      }

      // Buscar todos os formulários usando paginação
      const allForms: ApiForm[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      const limit = 100; // Limite máximo permitido pela API
      let totalForms = 0;

      while (hasMorePages) {
        const response = await this.getForms({ limit, page: currentPage });
        
        if (!response.success || !response.data) {
          return {
            success: false,
            error: response.error || 'Erro ao buscar formulários da API externa',
          };
        }

        allForms.push(...response.data.data);
        totalForms = response.data.pagination.total;
        
        // Verificar se há mais páginas
        hasMorePages = currentPage < response.data.pagination.totalPages;
        currentPage++;

        // Limite de segurança para evitar loops infinitos
        if (currentPage > 50) {
          console.warn('Limite de páginas atingido (50). Interrompendo busca.');
          break;
        }
      }

      return {
        success: true,
        data: {
          forms: allForms,
          total: totalForms,
        },
      };
    } catch (error: any) {
      console.error('Erro na sincronização de formulários:', error);
      return {
        success: false,
        error: error.message || 'Erro na sincronização',
      };
    }
  }

  // Limpar autenticação
  clearAuth(): void {
    this.auth = null;
  }

  // Obter configuração atual
  getConfig(): ExternalApiConfig {
    return { ...this.config };
  }
}

// Instância singleton do serviço
let externalApiService: ExternalApiService | null = null;

export function getExternalApiService(config?: ExternalApiConfig): ExternalApiService {
  if (!externalApiService && config) {
    externalApiService = new ExternalApiService(config);
  }
  
  if (!externalApiService) {
    throw new Error('Serviço de API externa não inicializado. Configure primeiro.');
  }
  
  return externalApiService;
}

export function initializeExternalApiService(config: ExternalApiConfig): ExternalApiService {
  externalApiService = new ExternalApiService(config);
  return externalApiService;
}

export function clearExternalApiService(): void {
  externalApiService = null;
}
