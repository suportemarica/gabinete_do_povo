import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiService } from '@/services/api';
import { ApiUser } from '@/types/api';
import { useRateLimit } from '@/hooks/useRateLimit';
import { RateLimitDialog } from '@/components/ui/rate-limit-dialog';

interface AuthContextType {
  user: ApiUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getProfile: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const {
    isRateLimited,
    retryAfterSeconds,
    errorMessage,
    handleRateLimitError,
    clearRateLimit,
    retry
  } = useRateLimit();

  // Verificar autenticação inicial
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      
      try {
        if (apiService.isAuthenticated()) {
          const response = await apiService.getProfile();
          if (response.success && response.data) {
            setUser(response.data);
            setIsAuthenticated(true);
          } else {
            // Token inválido, limpar
            apiService.clearToken();
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        apiService.clearToken();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.login({ email, password });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        setError(response.error || 'Erro ao fazer login');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      
      // Verificar se é erro de rate limiting
      if (err instanceof Error && errorMessage.includes('Muitas tentativas')) {
        handleRateLimitError(err);
        return false;
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiService.clearToken();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  const getProfile = async (): Promise<boolean> => {
    if (!isAuthenticated) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getProfile();
      
      if (response.success && response.data) {
        setUser(response.data);
        return true;
      } else {
        setError(response.error || 'Erro ao carregar perfil');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      // Se for erro de token expirado, fazer logout
      if (err instanceof Error && err.message.includes('Token expirado')) {
        logout();
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Verificar autenticação periodicamente
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const currentAuth = apiService.isAuthenticated();
      if (!currentAuth) {
        logout();
      }
    }, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    getProfile,
  };

  const handleRetryLogin = () => {
    retry(() => {
      // A função de retry será chamada quando o usuário clicar no botão
      // O login será tentado novamente automaticamente
    });
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      <RateLimitDialog
        isOpen={isRateLimited}
        onClose={clearRateLimit}
        retryAfterSeconds={retryAfterSeconds}
        onRetry={handleRetryLogin}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
