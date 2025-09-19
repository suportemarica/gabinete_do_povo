import { AutomationRules } from '@/components/automation/AutomationRules';
import { useGabineteData } from '@/hooks/useGabineteData';

export function Automation() {
  const { taskRules, addTaskRule, updateTaskRule, deleteTaskRule } = useGabineteData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuração de Automação</h1>
        <p className="text-muted-foreground">
          Configure regras para automatizar a criação de tarefas baseadas nas respostas dos formulários
        </p>
      </div>

      <AutomationRules 
        rules={taskRules}
        onAddRule={addTaskRule}
        onUpdateRule={updateTaskRule}
        onDeleteRule={deleteTaskRule}
      />
    </div>
  );
}