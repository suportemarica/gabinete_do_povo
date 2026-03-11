import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';

interface AutomationTestProps {
  forms: any[];
  loading: boolean;
  error: string | null;
}

export function AutomationTest({ forms, loading, error }: AutomationTestProps) {
  
  const [testResults, setTestResults] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const handleTestSingle = async () => {
    setIsTesting(true);
    try {
      // Usar um formulário e resposta de exemplo
      const result = await apiService.processAutomation('form-1', 'resp-1', true);
      setTestResults({ type: 'single', result });
    } catch (err) {
      setTestResults({ type: 'single', error: err instanceof Error ? err.message : 'Erro desconhecido' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestAll = async () => {
    setIsTesting(true);
    try {
      const result = await apiService.processAllAutomation('form-1');
      setTestResults({ type: 'all', result });
    } catch (err) {
      setTestResults({ type: 'all', error: err instanceof Error ? err.message : 'Erro desconhecido' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleGetStatus = async () => {
    try {
      const result = await apiService.getAutomationStatus();
      setStatus(result);
    } catch (err) {
      console.error('Erro ao obter status:', err);
    }
  };

  const handleTestFormOptions = async () => {
    if (forms.length === 0) {
      alert('Nenhum formulário disponível para teste');
      return;
    }

    setIsTesting(true);
    setTestResults(null);
    try {
      const form = forms[0]; // Testar com o primeiro formulário
      const response = await apiService.getForm(form.id);
      
      if (response.success && response.data) {
        const questionsWithOptions = response.data.questions?.map((q: any) => {
          return {
            id: q.id,
            text: q.title,
            type: q.type,
            options: q.options,
            hasOptions: q.options && q.options.length > 0
          };
        }) || [];
        
        setTestResults({
          formId: form.id,
          formName: form.name,
          questions: questionsWithOptions
        });
      }
    } catch (err) {
      console.error('Erro ao testar opções do formulário:', err);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Teste de Integração da Automação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={handleTestSingle} 
              disabled={isTesting || loading}
              variant="outline"
            >
              {isTesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Testar Processamento Único
            </Button>
            
            <Button 
              onClick={handleTestAll} 
              disabled={isTesting || loading}
              variant="outline"
            >
              {isTesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Testar Processamento Completo
            </Button>
            
            <Button 
              onClick={handleGetStatus} 
              disabled={loading}
              variant="outline"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Obter Status
            </Button>
            
            <Button 
              onClick={handleTestFormOptions} 
              disabled={isTesting || loading || forms.length === 0}
              variant="outline"
            >
              {isTesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Testar Opções de Formulário
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {testResults && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">
                Resultado do Teste {testResults.type === 'single' ? 'Único' : 'Completo'}:
              </h4>
              {testResults.error ? (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">{testResults.error}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Teste executado com sucesso!</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <pre className="bg-white p-2 rounded border overflow-auto">
                      {JSON.stringify(testResults.result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {status && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Status da Automação:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total de Regras</p>
                  <p className="text-lg font-semibold">{status.totalRules}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Regras Ativas</p>
                  <p className="text-lg font-semibold">{status.activeRules}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sistema Ativo</p>
                  <Badge variant={status.isActive ? "default" : "secondary"}>
                    {status.isActive ? "Sim" : "Não"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Última Execução</p>
                  <p className="text-sm">
                    {status.lastExecution 
                      ? new Date(status.lastExecution).toLocaleString('pt-BR')
                      : 'Nunca'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
