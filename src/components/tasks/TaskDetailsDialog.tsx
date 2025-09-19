import { Clock, User, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Task } from '@/types';

interface TaskDetailsDialogProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (taskId: string, status: Task['status']) => void;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
};

const statusLabels = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
  overdue: 'Em Atraso',
};

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

export function TaskDetailsDialog({ task, isOpen, onClose, onUpdateStatus }: TaskDetailsDialogProps) {
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleStatusUpdate = (newStatus: Task['status']) => {
    onUpdateStatus(task.id, newStatus);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(task.status)}
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Priority Badges */}
          <div className="flex gap-2">
            <Badge variant="secondary" className={priorityColors[task.priority]}>
              Prioridade: {priorityLabels[task.priority]}
            </Badge>
            <Badge variant="secondary" className={statusColors[task.status]}>
              Status: {statusLabels[task.status]}
            </Badge>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-medium mb-2">Descrição</h4>
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </div>

          <Separator />

          {/* Task Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Setor Responsável</p>
                  <p className="text-sm text-muted-foreground">{task.sector}</p>
                </div>
              </div>

              {task.assignedTo && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Responsável</p>
                    <p className="text-sm text-muted-foreground">{task.assignedTo}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Data de Criação</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(task.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Prazo de Conclusão</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(task.dueDate).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {task.completedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Concluída em</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(task.completedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Responses */}
          {task.relatedResponses && task.relatedResponses.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Respostas Relacionadas</h4>
                <div className="space-y-2">
                  {task.relatedResponses.map((response) => (
                    <div key={response.id} className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm font-medium">Pergunta ID: {response.questionId}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Resposta: {Array.isArray(response.answer) ? response.answer.join(', ') : response.answer}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(response.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          {task.status !== 'completed' && (
            <>
              <Separator />
              <div className="flex gap-3">
                {task.status === 'pending' && (
                  <Button 
                    onClick={() => handleStatusUpdate('in_progress')}
                    className="flex-1"
                  >
                    Iniciar Tarefa
                  </Button>
                )}
                
                {task.status === 'in_progress' && (
                  <Button 
                    onClick={() => handleStatusUpdate('completed')}
                    className="flex-1"
                  >
                    Marcar como Concluída
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                >
                  Fechar
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}