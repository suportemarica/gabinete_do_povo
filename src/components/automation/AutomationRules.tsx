import { useState } from 'react';
import { Plus, Edit, Trash2, Zap, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskRule, FormConfig } from '@/types';
import { AutomationRuleDialog } from './AutomationRuleDialog';

interface AutomationRulesProps {
  rules: TaskRule[];
  onAddRule: (rule: Omit<TaskRule, 'id'>) => TaskRule;
  onUpdateRule: (ruleId: string, updates: Partial<TaskRule>) => void;
  onDeleteRule: (ruleId: string) => void;
  forms?: FormConfig[];
  // Funções da API
  createRule: (rule: Omit<TaskRule, 'id'>) => Promise<TaskRule>;
  updateRule: (ruleId: string, updates: Partial<TaskRule>) => Promise<void>;
  deleteRule: (ruleId: string) => Promise<void>;
  // Estados de loading
  loading?: boolean;
  error?: string | null;
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

export function AutomationRules({ 
  rules, 
  onAddRule, 
  onUpdateRule, 
  onDeleteRule, 
  forms = [],
  createRule,
  updateRule: updateRuleApi,
  deleteRule: deleteRuleApi,
  loading = false,
  error = null
}: AutomationRulesProps) {
  
  const [selectedRule, setSelectedRule] = useState<TaskRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleAddRule = () => {
    setSelectedRule(null);
    setIsDialogOpen(true);
  };

  const handleEditRule = (rule: TaskRule) => {
    setSelectedRule(rule);
    setIsDialogOpen(true);
  };

  const handleSaveRule = async (ruleData: Omit<TaskRule, 'id'>) => {
    try {
      if (selectedRule) {
        await updateRuleApi(selectedRule.id, ruleData);
        onUpdateRule(selectedRule.id, ruleData);
      } else {
        const newRule = await createRule(ruleData);
        onAddRule(newRule);
      }
      setIsDialogOpen(false);
      setSelectedRule(null);
    } catch (error) {
      console.error('Erro ao salvar regra:', error);
      // O erro já é tratado no hook
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Tem certeza que deseja excluir esta regra?')) {
      setIsDeleting(ruleId);
      try {
        await deleteRuleApi(ruleId);
        onDeleteRule(ruleId);
      } catch (error) {
        console.error('Erro ao deletar regra:', error);
        // O erro já é tratado no hook
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Regras de Automação
            </CardTitle>
            <Button onClick={handleAddRule} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando regras...</p>
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma regra configurada</h3>
              <p className="text-muted-foreground mb-4">
                Crie regras para automatizar a criação de tarefas baseadas nas respostas dos formulários
              </p>
              <Button onClick={handleAddRule}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira regra
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{rule.name}</h3>
                        <Badge variant="secondary" className={priorityColors[rule.priority]}>
                          {priorityLabels[rule.priority]}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {rule.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="font-medium">Formulário:</span>
                          <p className="text-muted-foreground">
                            {forms.find(f => f.id === rule.formId)?.name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Condições:</span>
                          <p className="text-muted-foreground">
                            {rule.conditions?.length || 0} condição(ões) ({rule.logicalOperator})
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Setor:</span>
                          <p className="text-muted-foreground">{rule.sector}</p>
                        </div>
                        <div>
                          <span className="font-medium">SLA:</span>
                          <p className="text-muted-foreground">
                            {rule.sla.duration}h (início em {rule.sla.startOffset}h)
                          </p>
                        </div>
                      </div>
                      
                      {rule.conditions && rule.conditions.length > 0 && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium mb-3">Condições:</p>
                          <div className="space-y-2">
                            {rule.conditions.map((condition, index) => (
                              <div key={condition.id} className="flex flex-col gap-1 p-2 bg-background rounded border">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-primary">
                                    Pergunta:
                                  </span>
                                  <span className="text-xs text-foreground font-medium">
                                    {condition.questionText || 'Texto não encontrado'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-muted-foreground">
                                    Operador:
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {condition.operator === 'equals' && 'Igual a'}
                                    {condition.operator === 'not_equals' && 'Diferente de'}
                                    {condition.operator === 'contains' && 'Contém'}
                                    {condition.operator === 'not_contains' && 'Não contém'}
                                    {condition.operator === 'greater_than' && 'Maior que'}
                                    {condition.operator === 'less_than' && 'Menor que'}
                                    {condition.operator === 'in' && 'Está em'}
                                    {condition.operator === 'not_in' && 'Não está em'}
                                  </Badge>
                                  <span className="text-muted-foreground">
                                    Valor:
                                  </span>
                                  <span className="text-foreground font-medium">
                                    {Array.isArray(condition.value) 
                                      ? condition.value.join(', ') 
                                      : condition.value}
                                  </span>
                                </div>
                                {index < rule.conditions.length - 1 && (
                                  <div className="flex justify-center">
                                    <Badge variant="secondary" className="text-xs">
                                      {rule.logicalOperator}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium">Ação:</p>
                        <p className="text-sm text-muted-foreground">{rule.action.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{rule.action.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditRule(rule)}
                        disabled={loading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteRule(rule.id)}
                        disabled={loading || isDeleting === rule.id}
                      >
                        <Trash2 className="h-4 w-4" />
                        {isDeleting === rule.id && <span className="ml-1">...</span>}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AutomationRuleDialog
        rule={selectedRule}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedRule(null);
        }}
        onSave={handleSaveRule}
        forms={forms}
      />
    </div>
  );
}