import { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Eye, RefreshCw, FileText, Settings, Clock, Globe, AlertCircle, CheckCircle, Key, Wifi } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApiForms, useSyncedForms, useExternalSync } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { ApiForm } from '@/types/api';
import { FormViewer } from '@/components/forms/FormViewer';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiAuthDialog } from '@/components/api/ApiAuthDialog';
import { ApiConfigDialog } from '@/components/api/ApiConfigDialog';

export function Forms() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForm, setSelectedForm] = useState<ApiForm | null>(null);
  const [isFormViewerOpen, setIsFormViewerOpen] = useState(false);
  const [isSyncConfigOpen, setIsSyncConfigOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [syncConfig, setSyncConfig] = useState({
    autoSync: false,
    syncInterval: '30', // minutos
    apiEndpoint: 'http://localhost:3001/api',
  });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
  });

  // Hooks da API
  const { forms, loading, error, pagination, refreshSyncedForms } = useSyncedForms(filters);
  const { syncing, syncStatus, syncResult, error: syncError, syncWithExternalApi, testConnection } = useExternalSync();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // Atualizar filtros quando searchTerm muda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Recarregar formulários quando sincronização for bem-sucedida
  useEffect(() => {
    if (syncStatus === 'success' && syncResult) {
      // Pequeno delay para garantir que o toast apareça antes do recarregamento
      const timeoutId = setTimeout(() => {
        refreshSyncedForms();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [syncStatus, syncResult, refreshSyncedForms]);

  // Configurar sincronização automática (removido - usar sincronização manual)

  const handleViewForm = (form: ApiForm) => {
    setSelectedForm(form);
    setIsFormViewerOpen(true);
  };

  const handleSyncWithExternalApi = async () => {
    const syncData = {
      apiEndpoint: syncConfig.apiEndpoint,
      email: 'admin@marica.rj.gov.br', // Usar credenciais do usuário logado
      password: '123456',
      forceSync: true,
    };

    try {
      const result = await syncWithExternalApi(syncData);
      if (result) {
        // Mostrar toast de sucesso
        toast({
          title: "Sincronização Concluída! 🎉",
          description: `${result.syncedForms} formulários e ${result.syncedQuestions} perguntas sincronizados com sucesso.`,
          duration: 5000,
        });
        
        // Recarregar a lista de formulários
        await refreshSyncedForms();
      }
    } catch (error) {
      toast({
        title: "Erro na Sincronização",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleTestConnection = async () => {
    const testData = {
      apiEndpoint: syncConfig.apiEndpoint,
      email: 'admin@marica.rj.gov.br',
      password: '123456',
    };

    try {
      await testConnection(testData);
      toast({
        title: "Conexão Estabelecida! ✅",
        description: "Conexão com API externa estabelecida com sucesso!",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Erro na Conexão",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
        duration: 5000,
      });
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'archived':
        return <Badge variant="destructive">Arquivado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Formulários</h1>
          <p className="text-muted-foreground">
            Visualize e sincronize formulários da API externa
          </p>
          {isAuthenticated && user && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Conectado como {user.name}
              </Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isAuthenticated && (
            <Button 
              onClick={() => setIsAuthDialogOpen(true)} 
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Key className="h-4 w-4 mr-2" />
              Conectar à API
            </Button>
          )}
          <Button 
            onClick={handleTestConnection} 
            variant="outline"
            disabled={!isAuthenticated}
          >
            <Wifi className="h-4 w-4 mr-2" />
            Testar Conexão
          </Button>
          <Button 
            onClick={handleSyncWithExternalApi} 
            variant="outline"
            disabled={syncing || !isAuthenticated}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizar da API Externa
          </Button>
          <Button 
            onClick={() => setIsSyncConfigOpen(true)} 
            className="bg-red-600 hover:bg-red-700"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Alerta de erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta de erro de sincronização */}
      {syncError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro na sincronização: {syncError}
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta de sucesso na sincronização */}
      {syncResult && syncStatus === 'success' && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Sincronização concluída! {syncResult.syncedForms} formulários e {syncResult.syncedQuestions} perguntas sincronizados em {syncResult.duration}ms.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta de sincronização em andamento */}
      {syncing && (
        <Alert className="border-blue-200 bg-blue-50 text-blue-800">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Sincronizando formulários da API externa... Aguarde.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta de não autenticado */}
      {!isAuthenticated && (
        <Alert className="border-orange-200 bg-orange-50 text-orange-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você precisa se conectar à API para visualizar e sincronizar formulários. 
            <Button 
              variant="link" 
              className="p-0 h-auto text-orange-800 underline ml-1"
              onClick={() => setIsAuthDialogOpen(true)}
            >
              Clique aqui para conectar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Formulários da API</CardTitle>
              <CardDescription>
                Formulários sincronizados da API externa
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar formulários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Perguntas</TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isAuthenticated ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Key className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">Conecte-se à API para visualizar formulários</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsAuthDialogOpen(true)}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Conectar à API
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : forms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">Nenhum formulário encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {form.description}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(form.status)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {form.questions?.length || 0} perguntas
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {form.updatedAt ? new Date(form.updatedAt).toLocaleString('pt-BR') : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewForm(form)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de autenticação da API */}
      <ApiAuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        onSuccess={() => {
          refreshSyncedForms();
        }}
      />

      {/* Dialog de configuração da API */}
      <ApiConfigDialog
        isOpen={isSyncConfigOpen}
        onClose={() => setIsSyncConfigOpen(false)}
        onAuthRequired={() => {
          setIsSyncConfigOpen(false);
          setIsAuthDialogOpen(true);
        }}
      />

      {/* Dialog para visualizar formulário */}
      {selectedForm && (
        <Dialog open={isFormViewerOpen} onOpenChange={setIsFormViewerOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedForm.title}</DialogTitle>
              <DialogDescription>
                Visualizando formulário: {selectedForm.description || 'Sem descrição'}
              </DialogDescription>
            </DialogHeader>
            <FormViewer 
              form={selectedForm} 
              onClose={() => setIsFormViewerOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

