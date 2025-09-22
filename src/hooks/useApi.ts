import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import { ApiForm, ApiDepartment, FormFilters, DepartmentFilters, ApiResponse, PaginatedResponse } from '@/types/api';

// Hook para gerenciar formulários da API
export function useApiForms(filters: FormFilters = {}) {
  const [forms, setForms] = useState<ApiForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchForms = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Verificar se está autenticado antes de buscar formulários
      if (!apiService.isAuthenticated()) {
        setError('Usuário não autenticado. Faça login para visualizar formulários.');
        setForms([]);
        return;
      }

      const response = await apiService.getForms(filters);
      
      if (response.success && response.data) {
        setForms(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || 'Erro ao carregar formulários');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refreshForms = useCallback(() => {
    fetchForms();
  }, [fetchForms]);

  const getFormById = useCallback(async (id: string): Promise<ApiForm | null> => {
    try {
      const response = await apiService.getForm(id);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      console.error('Erro ao buscar formulário:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  return {
    forms,
    loading,
    error,
    pagination,
    refreshForms,
    getFormById,
  };
}

// Hook para gerenciar departamentos da API
export function useApiDepartments(filters: DepartmentFilters = {}) {
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getDepartments(filters);
      
      if (response.success && response.data) {
        setDepartments(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || 'Erro ao carregar departamentos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refreshDepartments = useCallback(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const getDepartmentById = useCallback(async (id: string): Promise<ApiDepartment | null> => {
    try {
      const response = await apiService.getDepartment(id);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      console.error('Erro ao buscar departamento:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return {
    departments,
    loading,
    error,
    pagination,
    refreshDepartments,
    getDepartmentById,
  };
}

// Hook para autenticação removido - usar AuthContext

// Hook para sincronização de formulários
export function useFormSync() {
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [syncStatus, setSyncStatus] = useState<Record<string, 'idle' | 'syncing' | 'success' | 'error'>>({});

  const syncForm = useCallback(async (formId: string) => {
    setSyncing(prev => ({ ...prev, [formId]: true }));
    setSyncStatus(prev => ({ ...prev, [formId]: 'syncing' }));
    
    try {
      // Verificar se está autenticado antes de sincronizar
      if (!apiService.isAuthenticated()) {
        throw new Error('Usuário não autenticado. Faça login para sincronizar formulários.');
      }

      const response = await apiService.getForm(formId);
      
      if (response.success) {
        setSyncStatus(prev => ({ ...prev, [formId]: 'success' }));
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setSyncStatus(prev => ({ ...prev, [formId]: 'idle' }));
        }, 3000);
        
        return response.data;
      } else {
        setSyncStatus(prev => ({ ...prev, [formId]: 'error' }));
        
        // Reset status after 5 seconds
        setTimeout(() => {
          setSyncStatus(prev => ({ ...prev, [formId]: 'idle' }));
        }, 5000);
        
        return null;
      }
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, [formId]: 'error' }));
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setSyncStatus(prev => ({ ...prev, [formId]: 'idle' }));
      }, 5000);
      
      return null;
    } finally {
      setSyncing(prev => ({ ...prev, [formId]: false }));
    }
  }, []);

  const syncAllForms = useCallback(async (formIds: string[]) => {
    // Verificar se está autenticado antes de sincronizar
    if (!apiService.isAuthenticated()) {
      throw new Error('Usuário não autenticado. Faça login para sincronizar formulários.');
    }

    const results = [];
    
    for (const formId of formIds) {
      const result = await syncForm(formId);
      results.push({ formId, data: result });
    }
    
    return results;
  }, [syncForm]);

  return {
    syncing,
    syncStatus,
    syncForm,
    syncAllForms,
  };
}

// Hook para sincronização com API externa
export function useExternalSync() {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncResult, setSyncResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const syncWithExternalApi = useCallback(async (syncData: {
    apiEndpoint: string;
    email: string;
    password: string;
    apiKey?: string;
    forceSync?: boolean;
  }) => {
    setSyncing(true);
    setSyncStatus('syncing');
    setError(null);
    
    try {
      if (!apiService.isAuthenticated()) {
        throw new Error('Usuário não autenticado. Faça login para sincronizar.');
      }

      const response = await apiService.syncForms(syncData);
      
      if (response.success) {
        setSyncStatus('success');
        setSyncResult(response.data);
        
        // Reset status after 5 seconds
        setTimeout(() => {
          setSyncStatus('idle');
        }, 5000);
        
        return response.data;
      } else {
        setSyncStatus('error');
        setError(response.error || 'Erro na sincronização');
        
        // Reset status after 5 seconds
        setTimeout(() => {
          setSyncStatus('idle');
        }, 5000);
        
        return null;
      }
    } catch (err) {
      setSyncStatus('error');
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setSyncStatus('idle');
      }, 5000);
      
      return null;
    } finally {
      setSyncing(false);
    }
  }, []);

  const testConnection = useCallback(async (testData: {
    apiEndpoint: string;
    email: string;
    password: string;
    apiKey?: string;
  }) => {
    setSyncing(true);
    setError(null);
    
    try {
      if (!apiService.isAuthenticated()) {
        throw new Error('Usuário não autenticado. Faça login para testar conexão.');
      }

      const response = await apiService.testExternalApiConnection(testData);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Falha no teste de conexão');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, []);

  const getSyncStatus = useCallback(async () => {
    try {
      if (!apiService.isAuthenticated()) {
        return null;
      }

      const response = await apiService.getSyncStatus();
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Erro ao obter status de sincronização');
      }
    } catch (err) {
      console.error('Erro ao obter status de sincronização:', err);
      return null;
    }
  }, []);

  return {
    syncing,
    syncStatus,
    syncResult,
    error,
    syncWithExternalApi,
    testConnection,
    getSyncStatus,
  };
}

// Hook para formulários sincronizados
export function useSyncedForms(filters: FormFilters = {}) {
  const [forms, setForms] = useState<ApiForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchSyncedForms = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!apiService.isAuthenticated()) {
        setError('Usuário não autenticado. Faça login para visualizar formulários sincronizados.');
        setForms([]);
        return;
      }

      const response = await apiService.getSyncedForms(filters);
      
      if (response.success && response.data) {
        setForms(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || 'Erro ao carregar formulários sincronizados');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refreshSyncedForms = useCallback(() => {
    fetchSyncedForms();
  }, [fetchSyncedForms]);

  useEffect(() => {
    fetchSyncedForms();
  }, [fetchSyncedForms]);

  return {
    forms,
    loading,
    error,
    pagination,
    refreshSyncedForms,
  };
}
