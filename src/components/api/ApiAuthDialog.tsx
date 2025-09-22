import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, CheckCircle, AlertCircle, Key, User, Globe } from 'lucide-react';

interface ApiAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApiAuthDialog({ isOpen, onClose, onSuccess }: ApiAuthDialogProps) {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    if (!credentials.email || !credentials.password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.login(credentials);
      
      if (response.success && response.data) {
        // Token já foi armazenado automaticamente pelo apiService
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(response.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleClose = () => {
    setCredentials({ email: '', password: '' });
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configuração da API
          </DialogTitle>
          <DialogDescription>
            Configure a autenticação para acessar a API do Marica Form Flow
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
                <Badge variant={isAuthenticated ? "default" : "secondary"}>
                  {isAuthenticated ? "Conectado" : "Desconectado"}
                </Badge>
              </div>
              {isAuthenticated && user && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Conectado como: {user.name}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formulário de Login */}
          {!isAuthenticated && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Alertas */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Login realizado com sucesso! Conectando à API...
                  </AlertDescription>
                </Alert>
              )}

              {/* Botões */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleLogin} 
                  disabled={loading || !credentials.email || !credentials.password}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 mr-2" />
                      Conectar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Informações da API */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Informações da API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Endpoint:</span>
                <span className="font-mono">http://localhost:3001/api</span>
              </div>
              <div className="flex justify-between">
                <span>Autenticação:</span>
                <span>JWT Token</span>
              </div>
              <div className="flex justify-between">
                <span>Versão:</span>
                <span>1.0</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
