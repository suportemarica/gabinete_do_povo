import { AutomationRules } from '@/components/automation/AutomationRules';
import { AutomationTest } from '@/components/automation/AutomationTest';
import { useAutomation } from '@/hooks/useAutomation';
import { useState, useEffect } from 'react';

export function Automation() {
  const { 
    rules, 
    forms, 
    createRule, 
    updateRule, 
    deleteRule, 
    loading, 
    error 
  } = useAutomation();

  const [localRules, setLocalRules] = useState(rules);

  // Sincronizar com dados da API
  useEffect(() => {
    setLocalRules(rules);
  }, [rules]);

  const handleAddRule = (rule: any) => {
    setLocalRules(prev => [...prev, rule]);
  };

  const handleUpdateRule = (ruleId: string, updates: any) => {
    setLocalRules(prev => prev.map(r => r.id === ruleId ? { ...r, ...updates } : r));
  };

  const handleDeleteRule = (ruleId: string) => {
    setLocalRules(prev => prev.filter(r => r.id !== ruleId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuração de Automação</h1>
        <p className="text-muted-foreground">
          Configure regras para automatizar a criação de tarefas baseadas nas respostas dos formulários
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <AutomationRules
        rules={localRules}
        onAddRule={handleAddRule}
        onUpdateRule={handleUpdateRule}
        onDeleteRule={handleDeleteRule}
        forms={forms}
        createRule={createRule}
        updateRule={updateRule}
        deleteRule={deleteRule}
        loading={loading}
        error={error}
      />

             <AutomationTest 
               forms={forms}
               loading={loading}
               error={error}
             />
           </div>
         );
       }