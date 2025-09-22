import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Clock, Globe, Key, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface ApiConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthRequired: () => void;
}

export function ApiConfigDialog({ isOpen, onClose, onAuthRequired }: ApiConfigDialogProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const [config, setConfig] = useState({
    autoSync: false,
    syncInterval: '30',
    apiEndpoint: 'http://localhost:3001/api',
  });

  // Carregar configurações salvas
  useEffect(() => {
    const savedConfig = localStorage.getItem('api_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleSaveConfig = () => {
    localStorage.setItem('api_config', JSON.stringify(config));
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleTestConnection = async () => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    
    try {
      // Testar conexão tentando buscar o perfil do usuário
      const response = await apiService.getProfile();
      if (response.success) {
        console.log('Conexão com a API bem-sucedida!');
        // Aqui poderia mostrar uma notificação de sucesso
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      // Aqui poderia mostrar uma notificação de erro
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração da API
          </DialogTitle>
          <DialogDescription>
            Configure as opções de sincronização e conexão com a API
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status da Conexão */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Status da Conexão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Marica Form Flow</span>
                <div className="flex items-center gap-2">
                  <Badge variant={isAuthenticated ? "default" : "secondary"}>
                    {isAuthenticated ? "Conectado" : "Desconectado"}
                  </Badge>
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="text-red-600 hover:text-red-700"
                    >
                      Desconectar
                    </Button>
                  )}
                </div>
              </div>
              {isAuthenticated && user && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Conectado como: {user.name} ({user.email})
                </div>
              )}
              {!isAuthenticated && (
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAuthRequired}
                    className="w-full"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Fazer Login na API
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configurações de Sincronização */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Sincronização Automática
              </CardTitle>
              <CardDescription>
                Configure como o sistema deve sincronizar com a API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-sync">Ativar Sincronização Automática</Label>
                  <p className="text-xs text-muted-foreground">
                    Sincronizar formulários automaticamente em intervalos regulares
                  </p>
                </div>
                <Switch
                  id="auto-sync"
                  checked={config.autoSync}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, autoSync: checked }))
                  }
                />
              </div>

              {config.autoSync && (
                <div className="space-y-2">
                  <Label htmlFor="sync-interval">Intervalo de Sincronização</Label>
                  <Select
                    value={config.syncInterval}
                    onValueChange={(value) => 
                      setConfig(prev => ({ ...prev, syncInterval: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutos</SelectItem>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="240">4 horas</SelectItem>
                      <SelectItem value="720">12 horas</SelectItem>
                      <SelectItem value="1440">24 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configurações da API */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Configurações da API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-endpoint">Endpoint da API</Label>
                <Input
                  id="api-endpoint"
                  value={config.apiEndpoint}
                  onChange={(e) => 
                    setConfig(prev => ({ ...prev, apiEndpoint: e.target.value }))
                  }
                  placeholder="http://localhost:3001/api"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={!isAuthenticated}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Testar Conexão
                </Button>
                {isAuthenticated && (
                  <div className="flex items-center gap-1 text-green-600 text-xs">
                    <CheckCircle className="h-3 w-3" />
                    Conectado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Token */}
          {isAuthenticated && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Informações do Token
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant="outline" className="text-green-600">
                    Válido
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <span>JWT Bearer Token</span>
                </div>
                <div className="flex justify-between">
                  <span>Armazenamento:</span>
                  <span>LocalStorage</span>
                </div>
                <div className="flex justify-between">
                  <span>Renovação:</span>
                  <span>Automática</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações Adicionais */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Informações da API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Versão da API:</span>
                <span>1.0</span>
              </div>
              <div className="flex justify-between">
                <span>Protocolo:</span>
                <span>HTTPS/HTTP</span>
              </div>
              <div className="flex justify-between">
                <span>Autenticação:</span>
                <span>JWT Token</span>
              </div>
              <div className="flex justify-between">
                <span>Formato de Dados:</span>
                <span>JSON</span>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveConfig}
              className="bg-red-600 hover:bg-red-700"
            >
              Salvar Configurações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
