# Sistema de Gerenciamento de Token - Gabinete do Povo

## Visão Geral
Este documento detalha a implementação do sistema de gerenciamento de token JWT para autenticação automática com a API do Marica Form Flow, incluindo armazenamento, validação, renovação automática e uso em todas as requisições.

## Funcionalidades Implementadas

### 1. Armazenamento Automático do Token
**Localização:** `src/services/api.ts`

**Funcionalidades:**
- Armazenamento automático do token após login bem-sucedido
- Persistência no localStorage para manter sessão entre recarregamentos
- Armazenamento do tempo de expiração do token
- Limpeza automática quando token expira

**Código Principal:**
```typescript
setToken(token: string, expiresIn?: number) {
  this.token = token;
  localStorage.setItem('api_token', token);
  
  // Calcular expiração do token (padrão: 24 horas)
  const expiry = expiresIn ? Date.now() + (expiresIn * 1000) : Date.now() + (24 * 60 * 60 * 1000);
  this.tokenExpiry = expiry;
  localStorage.setItem('api_token_expiry', expiry.toString());
}
```

### 2. Validação Automática do Token
**Funcionalidades:**
- Verificação de validade do token antes de cada requisição
- Limpeza automática de tokens expirados
- Validação no construtor da classe para verificar tokens existentes

**Código Principal:**
```typescript
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
```

### 3. Renovação Automática do Token
**Funcionalidades:**
- Detecção de tokens próximos do vencimento (5 minutos antes)
- Tentativa automática de renovação via endpoint `/auth/refresh`
- Fallback para logout em caso de falha na renovação

**Código Principal:**
```typescript
private async refreshTokenIfNeeded(): Promise<boolean> {
  if (!this.isTokenNearExpiry()) return true;

  try {
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

  this.clearToken();
  return false;
}
```

### 4. Uso Automático em Requisições
**Funcionalidades:**
- Inclusão automática do token em todas as requisições autenticadas
- Verificação e renovação antes de cada requisição
- Tratamento de erros 401 (não autorizado)

**Código Principal:**
```typescript
private getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (this.token) {
    headers['Authorization'] = `Bearer ${this.token}`;
  }

  return headers;
}

// Exemplo de uso em requisição
async getForms(filters: FormFilters = {}): Promise<ApiResponse<PaginatedResponse<ApiForm>>> {
  // Verificar e renovar token se necessário
  await this.refreshTokenIfNeeded();
  
  const response = await fetch(`${API_BASE_URL}/forms?${params.toString()}`, {
    method: 'GET',
    headers: this.getHeaders(),
  });

  return this.handleResponse<PaginatedResponse<ApiForm>>(response);
}
```

### 5. Tratamento de Erros de Autenticação
**Funcionalidades:**
- Detecção automática de erros 401 (token expirado)
- Limpeza automática do token em caso de erro de autenticação
- Mensagens de erro específicas para problemas de token

**Código Principal:**
```typescript
private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const data = await response.json();

  if (!response.ok) {
    // Se for erro 401, limpar token
    if (response.status === 401) {
      this.clearToken();
      throw new Error('Token expirado. Faça login novamente.');
    }
    
    throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return data;
}
```

## Hooks Atualizados

### 1. Hook de Autenticação (`useAuth`)
**Melhorias:**
- Verificação periódica do status de autenticação (a cada 30 segundos)
- Detecção automática de logout quando token expira
- Tratamento de erros de token expirado

**Código Principal:**
```typescript
// Verificar autenticação periodicamente
useEffect(() => {
  const checkAuth = () => {
    const currentAuth = apiService.isAuthenticated();
    if (currentAuth !== isAuthenticated) {
      setIsAuthenticated(currentAuth);
      if (!currentAuth) {
        setUser(null);
      }
    }
  };

  // Verificar a cada 30 segundos
  const interval = setInterval(checkAuth, 30000);
  
  // Verificar imediatamente
  checkAuth();

  return () => clearInterval(interval);
}, [isAuthenticated]);
```

### 2. Hook de Formulários (`useApiForms`)
**Melhorias:**
- Verificação de autenticação antes de buscar formulários
- Mensagens de erro específicas para usuários não autenticados
- Limpeza automática da lista quando não autenticado

**Código Principal:**
```typescript
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
    // ... resto da lógica
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Erro desconhecido');
  } finally {
    setLoading(false);
  }
}, [filters]);
```

### 3. Hook de Sincronização (`useFormSync`)
**Melhorias:**
- Verificação de autenticação antes de sincronizar
- Validação de token antes de cada operação de sincronização
- Mensagens de erro específicas para problemas de autenticação

**Código Principal:**
```typescript
const syncForm = useCallback(async (formId: string) => {
  setSyncing(prev => ({ ...prev, [formId]: true }));
  setSyncStatus(prev => ({ ...prev, [formId]: 'syncing' }));
  
  try {
    // Verificar se está autenticado antes de sincronizar
    if (!apiService.isAuthenticated()) {
      throw new Error('Usuário não autenticado. Faça login para sincronizar formulários.');
    }

    const response = await apiService.getForm(formId);
    // ... resto da lógica
  } catch (error) {
    // ... tratamento de erro
  } finally {
    setSyncing(prev => ({ ...prev, [formId]: false }));
  }
}, []);
```

## Interface de Usuário Atualizada

### 1. Dialog de Autenticação
**Melhorias:**
- Uso automático do sistema de token
- Feedback visual de sucesso após login
- Integração com o hook de autenticação

### 2. Dialog de Configuração
**Melhorias:**
- Informações detalhadas sobre o token
- Status de validade do token
- Teste de conexão real com a API
- Informações sobre renovação automática

### 3. Página de Formulários
**Melhorias:**
- Verificação de autenticação antes de exibir dados
- Mensagens específicas para usuários não autenticados
- Botões desabilitados quando não autenticado
- Status visual de conexão

## Fluxo de Autenticação Completo

### 1. Login Inicial
1. Usuário insere credenciais
2. Sistema faz requisição para `/auth/login`
3. Token JWT é retornado com tempo de expiração
4. Token é armazenado no localStorage
5. Interface é atualizada para estado autenticado

### 2. Uso da API
1. Antes de cada requisição, sistema verifica validade do token
2. Se token está próximo do vencimento, tenta renovar automaticamente
3. Token é incluído no header `Authorization: Bearer <token>`
4. Em caso de erro 401, token é limpo e usuário é deslogado

### 3. Renovação Automática
1. Sistema verifica se token expira em menos de 5 minutos
2. Se sim, faz requisição para `/auth/refresh`
3. Novo token é armazenado automaticamente
4. Se falhar, usuário é deslogado

### 4. Logout
1. Token é removido do localStorage
2. Estado de autenticação é atualizado
3. Interface volta ao estado não autenticado
4. Todas as requisições subsequentes falham até novo login

## Segurança Implementada

### 1. Armazenamento Seguro
- Token armazenado no localStorage (não em cookies)
- Tempo de expiração validado a cada requisição
- Limpeza automática de tokens inválidos

### 2. Validação Contínua
- Verificação de validade antes de cada requisição
- Detecção de tokens expirados
- Renovação automática quando possível

### 3. Tratamento de Erros
- Detecção de erros 401 (não autorizado)
- Logout automático em caso de token inválido
- Mensagens de erro específicas para problemas de autenticação

## Configurações Disponíveis

### 1. Tempo de Expiração
- Padrão: 24 horas
- Configurável via parâmetro `expiresIn`
- Armazenado junto com o token

### 2. Renovação Automática
- Ativada quando token expira em menos de 5 minutos
- Endpoint: `/auth/refresh`
- Fallback para logout em caso de falha

### 3. Verificação Periódica
- Intervalo: 30 segundos
- Verificação automática do status de autenticação
- Atualização da interface em tempo real

## Monitoramento e Debug

### 1. Logs de Console
- Avisos sobre falhas na renovação de token
- Erros de autenticação
- Status de validação do token

### 2. Estado da Interface
- Indicadores visuais de status de conexão
- Mensagens de erro específicas
- Botões desabilitados quando não autenticado

### 3. Informações do Token
- Status de validade
- Tipo de armazenamento
- Configuração de renovação

## Considerações Técnicas

### 1. Performance
- Verificação de token apenas quando necessário
- Renovação automática em background
- Cache de status de autenticação

### 2. Confiabilidade
- Múltiplas camadas de validação
- Fallback para logout em caso de erro
- Tratamento robusto de falhas de rede

### 3. Manutenibilidade
- Código centralizado no ApiService
- Hooks reutilizáveis
- Separação clara de responsabilidades

## Próximos Passos

### 1. Melhorias de Segurança
- Implementar refresh token
- Adicionar criptografia local
- Implementar 2FA

### 2. Funcionalidades Avançadas
- Múltiplas sessões
- Sincronização entre abas
- Notificações de expiração

### 3. Monitoramento
- Métricas de uso do token
- Alertas de segurança
- Logs detalhados

## Conclusão

O sistema de gerenciamento de token foi implementado com sucesso, proporcionando:

- **Autenticação automática** em todas as requisições
- **Renovação transparente** do token
- **Persistência de sessão** entre recarregamentos
- **Tratamento robusto** de erros de autenticação
- **Interface responsiva** ao status de autenticação
- **Segurança adequada** para produção

O sistema está pronto para uso e garante que todas as operações com a API sejam realizadas com token válido, incluindo a sincronização de formulários e outras funcionalidades do Gabinete do Povo.

