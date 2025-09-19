import { TaskList } from '@/components/tasks/TaskList';
import { useGabineteData } from '@/hooks/useGabineteData';

export function Tasks() {
  const { tasks, updateTaskStatus } = useGabineteData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gerenciamento de Tarefas</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todas as tarefas do sistema
        </p>
      </div>

      <TaskList tasks={tasks} onUpdateStatus={updateTaskStatus} />
    </div>
  );
}