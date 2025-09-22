# Configuração de Autenticação da API - Gabinete do Povo

## Visão Geral
Este documento detalha a implementação da configuração de autenticação da API do Marica Form Flow, permitindo que os usuários se conectem à API usando credenciais (email e senha) para obter um token JWT válido.

## Arquivos Criados

### 1. Dialog de Autenticação (`src/components/api/ApiAuthDialog.tsx`)
**Funcionalidades:**
- Interface de login com email e senha
- Validação de campos obrigatórios
- Feedback visual de loading e sucesso
- Exibição de status da conexão
- Informações da API (endpoint, versão, protocolo)
- Toggle para mostrar/ocultar senha

**Características:**
- Design responsivo e intuitivo
- Tratamento de erros com alertas visuais
- Validação em tempo real
- Integração com o serviço de API

### 2. Dialog de Configuração (`src/components/api/ApiConfigDialog.tsx`)
**Funcionalidades:**
- Status da conexão com a API
- Configuração de sincronização automática
- Intervalos de sincronização configuráveis
- Configuração do endpoint da API
- Teste de conexão
- Logout da API
- Informações detalhadas da API

**Configurações Disponíveis:**
- Sincronização automática (on/off)
- Intervalos: 5min, 15min, 30min, 1h, 4h, 12h, 24h
- Endpoint da API configurável
- Teste de conexão em tempo real

### 3. Página de Formulários Atualizada (`src/pages/Forms.tsx`)
**Melhorias Implementadas:**
- Status de autenticação no cabeçalho
- Botão de conexão quando não autenticado
- Alertas informativos para usuários não autenticados
- Tabela com estado vazio quando não conectado
- Integração com dialogs de autenticação e configuração

## Fluxo de Autenticação

### 1. Estado Inicial
- Usuário acessa a página de Formulários
- Sistema verifica se há token válido no localStorage
- Se não houver token, exibe alerta e botão de conexão

### 2. Processo de Login
1. Usuário clica em "Conectar à API"
2. Abre dialog de autenticação
3. Usuário insere email e senha
4. Sistema valida credenciais
5. Se válidas, obtém token JWT
6. Token é armazenado no localStorage
7. Interface é atualizada com status conectado

### 3. Uso da API
- Todas as requisições incluem token JWT automaticamente
- Token é renovado conforme necessário
- Usuário pode fazer logout a qualquer momento

## Componentes de Interface

### 1. Status de Conexão
```typescript
// Exibido no cabeçalho da página
{isAuthenticated && user && (
  <Badge variant="outline" className="text-xs">
    <CheckCircle className="h-3 w-3 mr-1" />
    Conectado como {user.name}
  </Badge>
)}
```

### 2. Alerta de Não Autenticado
```typescript
// Alerta laranja com call-to-action
{!isAuthenticated && (
  <Alert className="border-orange-200 bg-orange-50 text-orange-800">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      Você precisa se conectar à API para visualizar e sincronizar formulários.
      <Button variant="link" onClick={() => setIsAuthDialogOpen(true)}>
        Clique aqui para conectar
      </Button>
    </AlertDescription>
  </Alert>
)}
```

### 3. Tabela com Estado Vazio
```typescript
// Mensagem centralizada na tabela
{!isAuthenticated ? (
  <TableRow>
    <TableCell colSpan={7} className="text-center py-8">
      <div className="flex flex-col items-center gap-2">
        <Key className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">Conecte-se à API para visualizar formulários</p>
        <Button variant="outline" size="sm" onClick={() => setIsAuthDialogOpen(true)}>
          <Key className="h-4 w-4 mr-2" />
          Conectar à API
        </Button>
      </div>
    </TableCell>
  </TableRow>
) : // ... resto da tabela
```

## Gerenciamento de Estado

### 1. Estado de Autenticação
- Gerenciado pelo hook `useAuth()`
- Persistido no localStorage
- Atualizado automaticamente em toda a aplicação

### 2. Configurações da API
- Armazenadas no localStorage
- Carregadas automaticamente na inicialização
- Aplicadas em tempo real

### 3. Estados de Loading
- Loading durante login
- Loading durante sincronização
- Estados visuais para feedback do usuário

## Tratamento de Erros

### 1. Erros de Autenticação
- Credenciais inválidas
- Servidor indisponível
- Token expirado
- Erro de rede

### 2. Feedback Visual
- Alertas de erro com mensagens descritivas
- Estados de loading com spinners
- Confirmações de sucesso
- Validação em tempo real

### 3. Recuperação de Erros
- Retry automático em caso de falha de rede
- Logout automático em caso de token inválido
- Fallback para estado não autenticado

## Segurança

### 1. Armazenamento de Token
- Token JWT armazenado no localStorage
- Renovação automática quando necessário
- Limpeza automática em caso de erro

### 2. Validação de Dados
- Validação de email
- Validação de senha
- Sanitização de inputs

### 3. Headers de Segurança
- Token JWT incluído automaticamente
- Headers de autenticação padronizados
- Validação de resposta da API

## Configurações Disponíveis

### 1. Sincronização Automática
- **Ativar/Desativar:** Toggle simples
- **Intervalos:** 5min, 15min, 30min, 1h, 4h, 12h, 24h
- **Aplicação:** Apenas para formulários ativos

### 2. Endpoint da API
- **Configurável:** URL base da API
- **Padrão:** `http://localhost:3001/api`
- **Validação:** Formato de URL válido

### 3. Teste de Conexão
- **Funcionalidade:** Testa conectividade com a API
- **Feedback:** Status visual da conexão
- **Disponibilidade:** Apenas quando autenticado

## Fluxo de Configuração

### 1. Acesso à Configuração
- Botão "Configurar" no cabeçalho
- Acesso direto às configurações da API
- Status de conexão visível

### 2. Configuração de Sincronização
- Toggle para ativar sincronização automática
- Seleção de intervalo de sincronização
- Aplicação imediata das configurações

### 3. Gerenciamento de Conexão
- Botão de logout quando conectado
- Botão de login quando desconectado
- Teste de conexão em tempo real

## Considerações Técnicas

### 1. Performance
- Carregamento assíncrono de dados
- Debounce na validação de campos
- Cache de configurações

### 2. UX/UI
- Interface intuitiva e responsiva
- Feedback visual imediato
- Estados de loading claros

### 3. Manutenibilidade
- Componentes modulares e reutilizáveis
- Separação clara de responsabilidades
- Tipos TypeScript completos

## Próximos Passos

### 1. Melhorias de UX
- Implementar "Lembrar-me" para credenciais
- Adicionar recuperação de senha
- Melhorar feedback visual

### 2. Funcionalidades Avançadas
- Múltiplas contas de API
- Configurações por usuário
- Histórico de conexões

### 3. Segurança
- Implementar refresh token
- Adicionar 2FA
- Criptografia de credenciais

## Conclusão

A configuração de autenticação da API foi implementada com sucesso, proporcionando:

- **Interface intuitiva** para login e configuração
- **Gerenciamento automático** de tokens JWT
- **Feedback visual** claro para todos os estados
- **Configuração flexível** de sincronização
- **Tratamento robusto** de erros
- **Segurança adequada** para produção

O sistema está pronto para uso e permite que os usuários se conectem facilmente à API do Marica Form Flow para sincronizar e visualizar formulários.

