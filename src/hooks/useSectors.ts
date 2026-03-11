import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import { Sector } from '@/types';

interface UseSectorsOptions {
  autoFetch?: boolean;
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

interface UseSectorsReturn {
  sectors: Sector[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  fetchSectors: (options?: Partial<UseSectorsOptions>) => Promise<void>;
  createSector: (data: { name: string; description?: string; isActive?: boolean }) => Promise<Sector | null>;
  updateSector: (id: string, data: { name?: string; description?: string; isActive?: boolean }) => Promise<Sector | null>;
  deleteSector: (id: string) => Promise<boolean>;
  toggleSectorStatus: (id: string) => Promise<Sector | null>;
  getSector: (id: string) => Promise<Sector | null>;
  refreshSectors: () => Promise<void>;
}

export function useSectors(options: UseSectorsOptions = {}): UseSectorsReturn {
  const {
    autoFetch = true,
    page = 1,
    limit = 10,
    search,
    isActive,
  } = options;

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const fetchSectors = useCallback(async (fetchOptions?: Partial<UseSectorsOptions>) => {
    setLoading(true);
    setError(null);

    try {
      const filters = {
        page: fetchOptions?.page ?? page,
        limit: fetchOptions?.limit ?? limit,
        search: fetchOptions?.search ?? search,
        isActive: fetchOptions?.isActive ?? isActive,
      };

      const response = await apiService.getSectors(filters);

      if (response.success && response.data) {
        // Transformar dados da API para o formato esperado pelo frontend
        const transformedSectors: Sector[] = response.data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          responsibleUsers: item.responsibleUsers || [],
          active: item.active,
        }));

        setSectors(transformedSectors);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.error || 'Erro ao buscar setores');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar setores:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, isActive]);

  const createSector = useCallback(async (data: { name: string; description?: string; isActive?: boolean }): Promise<Sector | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.createSector(data);

      if (response.success && response.data) {
        const newSector: Sector = {
          id: response.data.id,
          name: response.data.name,
          description: response.data.description || '',
          responsibleUsers: response.data.responsibleUsers || [],
          active: response.data.active,
        };

        setSectors(prev => [newSector, ...prev]);
        return newSector;
      } else {
        throw new Error(response.error || 'Erro ao criar setor');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao criar setor:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSector = useCallback(async (id: string, data: { name?: string; description?: string; isActive?: boolean }): Promise<Sector | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.updateSector(id, data);

      if (response.success && response.data) {
        const updatedSector: Sector = {
          id: response.data.id,
          name: response.data.name,
          description: response.data.description || '',
          responsibleUsers: response.data.responsibleUsers || [],
          active: response.data.active,
        };

        setSectors(prev => prev.map(sector => 
          sector.id === id ? updatedSector : sector
        ));
        return updatedSector;
      } else {
        throw new Error(response.error || 'Erro ao atualizar setor');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao atualizar setor:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSector = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.deleteSector(id);

      if (response.success) {
        setSectors(prev => prev.filter(sector => sector.id !== id));
        return true;
      } else {
        throw new Error(response.error || 'Erro ao deletar setor');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao deletar setor:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleSectorStatus = useCallback(async (id: string): Promise<Sector | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.toggleSectorStatus(id);

      if (response.success && response.data) {
        const updatedSector: Sector = {
          id: response.data.id,
          name: response.data.name,
          description: response.data.description || '',
          responsibleUsers: response.data.responsibleUsers || [],
          active: response.data.active,
        };

        setSectors(prev => prev.map(sector => 
          sector.id === id ? updatedSector : sector
        ));
        return updatedSector;
      } else {
        throw new Error(response.error || 'Erro ao alterar status do setor');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao alterar status do setor:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSector = useCallback(async (id: string): Promise<Sector | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getSector(id);

      if (response.success && response.data) {
        const sector: Sector = {
          id: response.data.id,
          name: response.data.name,
          description: response.data.description || '',
          responsibleUsers: response.data.responsibleUsers || [],
          active: response.data.active,
        };
        return sector;
      } else {
        throw new Error(response.error || 'Erro ao buscar setor');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar setor:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSectors = useCallback(async () => {
    await fetchSectors();
  }, [fetchSectors]);

  // Auto-fetch quando o hook é montado ou quando as dependências mudam
  useEffect(() => {
    if (autoFetch) {
      fetchSectors();
    }
  }, [autoFetch, fetchSectors]);

  return {
    sectors,
    loading,
    error,
    pagination,
    fetchSectors,
    createSector,
    updateSector,
    deleteSector,
    toggleSectorStatus,
    getSector,
    refreshSectors,
  };
}


