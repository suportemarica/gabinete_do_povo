import { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Settings } from 'lucide-react';
import { TaskRule, AutomationCondition, FormConfig, Question } from '@/types';
import { useAutomation } from '@/hooks/useAutomation';

interface AutomationRuleDialogProps {
  rule: TaskRule | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: Omit<TaskRule, 'id'>) => void;
  forms?: FormConfig[];
}

const priorityOptions = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

// Removido - agora usamos dados da API

export function AutomationRuleDialog({ rule, isOpen, onClose, onSave, forms = [] }: AutomationRuleDialogProps) {
  const { sectors, loading: apiLoading, error: apiError, loadFormWithQuestions } = useAutomation();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    formId: '',
    actionTitle: '',
    actionDescription: '',
    slaStartOffset: 0,
    slaDuration: 24,
    sector: '',
    priority: 'medium' as TaskRule['priority'],
    logicalOperator: 'AND' as 'AND' | 'OR',
  });

  const [conditions, setConditions] = useState<AutomationCondition[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description,
        formId: rule.formId,
        actionTitle: rule.action.title,
        actionDescription: rule.action.description,
        slaStartOffset: rule.sla.startOffset,
        slaDuration: rule.sla.duration,
        sector: rule.sector,
        priority: rule.priority,
        logicalOperator: rule.logicalOperator,
      });
      setConditions(rule.conditions || []);
      
      // Encontrar o formulário selecionado
      const form = forms.find(f => f.id === rule.formId);
      setSelectedForm(form || null);
    } else {
      setFormData({
        name: '',
        description: '',
        formId: '',
        actionTitle: '',
        actionDescription: '',
        slaStartOffset: 0,
        slaDuration: 24,
        sector: '',
        priority: 'medium' as TaskRule['priority'],
        logicalOperator: 'AND' as 'AND' | 'OR',
      });
      setConditions([]);
      setSelectedForm(null);
    }
  }, [rule, forms]);

  // Funções auxiliares
  const handleFormChange = async (formId: string) => {
    setFormData({ ...formData, formId });
    setLoadingForm(true);
    
    try {
      // Carregar formulário com perguntas e opções
      const form = await loadFormWithQuestions(formId);
      setSelectedForm(form || null);
      setConditions([]); // Limpar condições ao trocar formulário
    } catch (error) {
      console.error('Erro ao carregar formulário:', error);
    } finally {
      setLoadingForm(false);
    }
  };

  const addCondition = () => {
    const newCondition: AutomationCondition = {
      id: `cond_${Date.now()}`,
      questionId: '',
      questionText: '',
      operator: 'equals',
      value: '',
      questionType: 'text',
      questionOptions: [],
    };
    setConditions([...conditions, newCondition]);
  };

  const updateCondition = (id: string, updates: Partial<AutomationCondition>) => {
    const newConditions = conditions.map(cond => 
      cond.id === id ? { ...cond, ...updates } : cond
    );
    setConditions(newConditions);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(cond => cond.id !== id));
  };

  const handleQuestionChange = (conditionId: string, questionId: string) => {
    const question = selectedForm?.questions.find(q => q.id === questionId);
    
    if (question) {
      updateCondition(conditionId, {
        questionId,
        questionText: question.text,
        questionType: question.type,
        questionOptions: question.options || [],
        value: '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (conditions.length === 0) {
      alert('Adicione pelo menos uma condição para a regra.');
      return;
    }

    setIsSubmitting(true);

    try {
    const ruleData: Omit<TaskRule, 'id'> = {
      name: formData.name,
      description: formData.description,
        formId: formData.formId,
        conditions,
        logicalOperator: formData.logicalOperator,
      action: {
        type: 'create_task',
        title: formData.actionTitle,
        description: formData.actionDescription,
      },
      sla: {
        startOffset: formData.slaStartOffset,
        duration: formData.slaDuration,
      },
      sector: formData.sector,
      priority: formData.priority,
    };

      await onSave(ruleData);
    } catch (error) {
      console.error('Erro ao salvar regra:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Editar Regra de Automação' : 'Nova Regra de Automação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Regra</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Reclamação de Obras Públicas"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({ ...formData, priority: value as TaskRule['priority'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva quando esta regra deve ser ativada"
                required
              />
            </div>

            <div>
              <Label htmlFor="formId">Formulário Associado</Label>
              <Select 
                value={formData.formId} 
                onValueChange={handleFormChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formulário" />
                </SelectTrigger>
                <SelectContent>
                  {forms.map(form => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Trigger Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Configuração do Gatilho</h3>
              <div className="flex items-center gap-2">
                <Label htmlFor="logicalOperator">Operador Lógico:</Label>
                <Select 
                  value={formData.logicalOperator} 
                  onValueChange={(value) => setFormData({ ...formData, logicalOperator: value as 'AND' | 'OR' })}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">E (AND)</SelectItem>
                    <SelectItem value="OR">OU (OR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loadingForm ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Carregando perguntas e opções...</p>
              </div>
            ) : !selectedForm ? (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-8 w-8 mx-auto mb-2" />
                <p>Selecione um formulário para configurar as condições</p>
              </div>
            ) : (
              <div className="space-y-4">
                {conditions.map((condition, index) => (
                  <Card key={condition.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Condição {index + 1}</CardTitle>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCondition(condition.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Pergunta</Label>
                          <Select 
                            value={condition.questionId} 
                            onValueChange={(value) => handleQuestionChange(condition.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a pergunta" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedForm.questions.map(question => (
                                <SelectItem key={question.id} value={question.id}>
                                  {question.text}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Operador</Label>
                          <Select 
                            value={condition.operator} 
                            onValueChange={(value) => updateCondition(condition.id, { operator: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">Igual a</SelectItem>
                              <SelectItem value="not_equals">Diferente de</SelectItem>
                              <SelectItem value="contains">Contém</SelectItem>
                              <SelectItem value="not_contains">Não contém</SelectItem>
                              <SelectItem value="greater_than">Maior que</SelectItem>
                              <SelectItem value="less_than">Menor que</SelectItem>
                              <SelectItem value="in">Está em</SelectItem>
                              <SelectItem value="not_in">Não está em</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
              </div>
              
              <div>
                        <Label>Valor de Gatilho</Label>
                        {(condition.questionType === 'select' || condition.questionType === 'multiselect' || condition.questionType === 'radio') ? (
                          <div className="space-y-2">
                            
                            
                            {condition.questionOptions && condition.questionOptions.length > 0 ? (
                              <>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Opções disponíveis para esta pergunta:
                                </p>
                                {condition.questionOptions.map((option, index) => (
                                  <div key={`${condition.id}-${option}-${index}`} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${condition.id}-${option}-${index}`}
                                      checked={Array.isArray(condition.value) ? condition.value.includes(option) : false}
                                      onCheckedChange={(checked) => {
                                        const currentValues = Array.isArray(condition.value) ? condition.value : [];
                                        const newValues = checked 
                                          ? [...currentValues, option]
                                          : currentValues.filter(v => v !== option);
                                        updateCondition(condition.id, { value: newValues });
                                      }}
                                    />
                                    <Label htmlFor={`${condition.id}-${option}-${index}`} className="text-sm">
                                      {option}
                                    </Label>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Esta pergunta não possui opções pré-definidas.
                              </p>
                            )}
                          </div>
                        ) : condition.questionType === 'boolean' ? (
                          <Select 
                            value={condition.value as string} 
                            onValueChange={(value) => updateCondition(condition.id, { value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Sim</SelectItem>
                              <SelectItem value="false">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                <Input
                            value={Array.isArray(condition.value) ? condition.value.join(', ') : condition.value}
                            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                            placeholder="Digite o valor ou valores (separados por vírgula)"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addCondition}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Condição
                </Button>
              </div>
            )}
          </div>

          {/* Action Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configuração da Ação</h3>
            
            <div>
              <Label htmlFor="actionTitle">Título da Tarefa</Label>
              <Input
                id="actionTitle"
                value={formData.actionTitle}
                onChange={(e) => setFormData({ ...formData, actionTitle: e.target.value })}
                placeholder="Ex: Verificar Reclamação de Obras"
                required
              />
            </div>

            <div>
              <Label htmlFor="actionDescription">Descrição da Tarefa</Label>
              <Textarea
                id="actionDescription"
                value={formData.actionDescription}
                onChange={(e) => setFormData({ ...formData, actionDescription: e.target.value })}
                placeholder="Descreva o que deve ser feito na tarefa"
                required
              />
            </div>
          </div>

          {/* Assignment and SLA */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Atribuição e SLA</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="sector">Setor Responsável</Label>
                <Select 
                  value={formData.sector} 
                  onValueChange={(value) => setFormData({ ...formData, sector: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map(sector => (
                      <SelectItem key={sector.id} value={sector.name}>
                        {sector.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="slaStartOffset">Início da Tarefa (horas)</Label>
                <Input
                  id="slaStartOffset"
                  type="number"
                  min="0"
                  value={formData.slaStartOffset}
                  onChange={(e) => setFormData({ ...formData, slaStartOffset: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div>
                <Label htmlFor="slaDuration">Prazo para Conclusão (horas)</Label>
                <Input
                  id="slaDuration"
                  type="number"
                  min="1"
                  value={formData.slaDuration}
                  onChange={(e) => setFormData({ ...formData, slaDuration: parseInt(e.target.value) || 24 })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting || apiLoading}>
              {isSubmitting ? 'Salvando...' : rule ? 'Atualizar Regra' : 'Criar Regra'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
          
          {apiError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{apiError}</p>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}