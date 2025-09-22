import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Question } from '@/types';
import { Plus, X } from 'lucide-react';

interface QuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Omit<Question, 'id'>) => void;
  question?: Question;
}

export function QuestionDialog({ isOpen, onClose, onSave, question }: QuestionDialogProps) {
  const [formData, setFormData] = useState({
    text: question?.text || '',
    type: question?.type || 'text',
    required: question?.required || false,
    options: question?.options || [],
  });

  const [newOption, setNewOption] = useState('');

  const handleSave = () => {
    if (!formData.text.trim()) return;

    const questionData: Omit<Question, 'id'> = {
      text: formData.text,
      type: formData.type as Question['type'],
      required: formData.required,
      options: formData.type === 'select' || formData.type === 'multiselect' ? formData.options : undefined,
    };

    onSave(questionData);
    onClose();
  };

  const handleAddOption = () => {
    if (newOption.trim() && !formData.options.includes(newOption.trim())) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, newOption.trim()]
      }));
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type: type as Question['type'],
      options: type === 'select' || type === 'multiselect' ? prev.options : []
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {question ? 'Editar Pergunta' : 'Nova Pergunta'}
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes da pergunta do formulário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="text">Texto da Pergunta</Label>
            <Textarea
              id="text"
              placeholder="Digite a pergunta..."
              value={formData.text}
              onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo de Resposta</Label>
            <Select value={formData.type} onValueChange={handleTypeChange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texto Livre</SelectItem>
                <SelectItem value="select">Seleção Única</SelectItem>
                <SelectItem value="multiselect">Seleção Múltipla</SelectItem>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="boolean">Sim/Não</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.type === 'select' || formData.type === 'multiselect') && (
            <div>
              <Label>Opções de Resposta</Label>
              <div className="space-y-2 mt-1">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={option} readOnly />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nova opção..."
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={formData.required}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, required: !!checked }))
              }
            />
            <Label htmlFor="required">Pergunta obrigatória</Label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.text.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {question ? 'Salvar Alterações' : 'Criar Pergunta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

