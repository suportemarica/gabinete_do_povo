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
import { TaskRule } from '@/types';

interface AutomationRuleDialogProps {
  rule: TaskRule | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: Omit<TaskRule, 'id'>) => void;
}

const priorityOptions = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

const sectorOptions = [
  'Obras Públicas',
  'Saúde',
  'Educação',
  'Meio Ambiente',
  'Transporte',
  'Segurança',
  'Administração',
];

export function AutomationRuleDialog({ rule, isOpen, onClose, onSave }: AutomationRuleDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    questionId: '',
    triggerValue: '',
    actionTitle: '',
    actionDescription: '',
    slaStartOffset: 0,
    slaDuration: 24,
    sector: '',
    priority: 'medium' as TaskRule['priority'],
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description,
        questionId: rule.questionId,
        triggerValue: Array.isArray(rule.triggerValue) ? rule.triggerValue.join(', ') : rule.triggerValue,
        actionTitle: rule.action.title,
        actionDescription: rule.action.description,
        slaStartOffset: rule.sla.startOffset,
        slaDuration: rule.sla.duration,
        sector: rule.sector,
        priority: rule.priority,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        questionId: '',
        triggerValue: '',
        actionTitle: '',
        actionDescription: '',
        slaStartOffset: 0,
        slaDuration: 24,
        sector: '',
        priority: 'medium' as TaskRule['priority'],
      });
    }
  }, [rule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const ruleData: Omit<TaskRule, 'id'> = {
      name: formData.name,
      description: formData.description,
      questionId: formData.questionId,
      triggerValue: formData.triggerValue.includes(',') 
        ? formData.triggerValue.split(',').map(v => v.trim())
        : formData.triggerValue,
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

    onSave(ruleData);
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
          </div>

          {/* Trigger Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configuração do Gatilho</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="questionId">ID da Pergunta</Label>
                <Input
                  id="questionId"
                  value={formData.questionId}
                  onChange={(e) => setFormData({ ...formData, questionId: e.target.value })}
                  placeholder="Ex: q1, q2, etc."
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="triggerValue">Valor de Gatilho</Label>
                <Input
                  id="triggerValue"
                  value={formData.triggerValue}
                  onChange={(e) => setFormData({ ...formData, triggerValue: e.target.value })}
                  placeholder="Ex: Reclamação (use vírgula para múltiplos valores)"
                  required
                />
              </div>
            </div>
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
                    {sectorOptions.map(sector => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
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
            <Button type="submit" className="flex-1">
              {rule ? 'Atualizar Regra' : 'Criar Regra'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}