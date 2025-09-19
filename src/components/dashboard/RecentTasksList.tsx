import { Clock, User, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/types';

interface RecentTasksListProps {
  tasks: Task[];
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

export function RecentTasksList({ tasks }: RecentTasksListProps) {
  const recentTasks = tasks
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Tarefas Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentTasks.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma tarefa encontrada
          </p>
        ) : (
          recentTasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm line-clamp-1">{task.title}</h4>
                  <div className="flex gap-1">
                    <Badge 
                      variant="secondary" 
                      className={priorityColors[task.priority]}
                    >
                      {priorityLabels[task.priority]}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className={statusColors[task.status]}
                    >
                      {statusLabels[task.status]}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {task.description}
                </p>
                
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{task.sector}</span>
                  </div>
                  
                  {task.status === 'overdue' && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      <span>Vencido</span>
                    </div>
                  )}
                  
                  <span>
                    Criada em {new Date(task.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}