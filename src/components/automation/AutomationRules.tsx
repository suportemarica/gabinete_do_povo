import { useState } from 'react';
import { Plus, Edit, Trash2, Zap, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskRule } from '@/types';
import { AutomationRuleDialog } from './AutomationRuleDialog';

interface AutomationRulesProps {
  rules: TaskRule[];
  onAddRule: (rule: Omit<TaskRule, 'id'>) => TaskRule;
  onUpdateRule: (ruleId: string, updates: Partial<TaskRule>) => void;
  onDeleteRule: (ruleId: string) => void;
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

export function AutomationRules({ rules, onAddRule, onUpdateRule, onDeleteRule }: AutomationRulesProps) {
  const [selectedRule, setSelectedRule] = useState<TaskRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddRule = () => {
    setSelectedRule(null);
    setIsDialogOpen(true);
  };

  const handleEditRule = (rule: TaskRule) => {
    setSelectedRule(rule);
    setIsDialogOpen(true);
  };

  const handleSaveRule = (ruleData: Omit<TaskRule, 'id'>) => {
    if (selectedRule) {
      onUpdateRule(selectedRule.id, ruleData);
    } else {
      onAddRule(ruleData);
    }
    setIsDialogOpen(false);
    setSelectedRule(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Tem certeza que deseja excluir esta regra?')) {
      onDeleteRule(ruleId);
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
            <Button onClick={handleAddRule}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
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
                          <span className="font-medium">Pergunta:</span>
                          <p className="text-muted-foreground">{rule.questionId}</p>
                        </div>
                        <div>
                          <span className="font-medium">Valor de Gatilho:</span>
                          <p className="text-muted-foreground">
                            {Array.isArray(rule.triggerValue) 
                              ? rule.triggerValue.join(', ') 
                              : rule.triggerValue}
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
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
      />
    </div>
  );
}