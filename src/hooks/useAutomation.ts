import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '@/services/api';
import { 
  mapBackendToFrontendRule, 
  mapFrontendToBackendRule, 
  mapBackendToFrontendForm, 
  mapBackendToFrontendSector,
  BackendAutomationRule,
  BackendForm,
  BackendSector
} from '@/types/automation';
import { TaskRule, FormConfig, Sector } from '@/types';

export function useAutomation() {
  const [rules, setRules] = useState<TaskRule[]>([]);
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref para controlar se os dados iniciais já foram carregados
  const initialDataLoaded = useRef(false);

  // Função para enriquecer regras com textos das perguntas
  const enrichRulesWithQuestionTexts = useCallback((rules: any[], forms: FormConfig[]) => {
    return rules.map(rule => ({
      ...rule,
      conditions: rule.conditions.map((condition: any) => {
        // Buscar o formulário da regra
        const form = forms.find(f => f.id === rule.formId);
        if (form) {
          // Buscar a pergunta no formulário
          const question = form.questions.find(q => q.id === condition.questionId);
          if (question) {
            return {
              ...condition,
              questionText: question.text,
              questionType: question.type,
              questionOptions: question.options || []
            };
          }
        }
        return condition;
      })
    }));
  }, []);

  // Carregar regras de automação
  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAutomationRules({ limit: 100 });
      
      if (response.success && response.data) {
        const backendRules = response.data.data as BackendAutomationRule[];
        const frontendRules = backendRules.map(mapBackendToFrontendRule);
        setRules(frontendRules);
      } else {
        setError(response.error || 'Erro ao carregar regras');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []); // Removidas dependências que causavam loop

  // Carregar formulários
  const loadForms = useCallback(async () => {
    try {
      const response = await apiService.getSyncedForms({ limit: 100 });
      
      if (response.success && response.data) {
        const backendForms = response.data.data as BackendForm[];
        const frontendForms = backendForms.map(mapBackendToFrontendForm);
        setForms(frontendForms);
      } else {
        setError(response.error || 'Erro ao carregar formulários');
      }
    } catch (err) {
      console.error('Erro ao carregar formulários:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, []);

  // Carregar formulário específico com perguntas e opções
  const loadFormWithQuestions = useCallback(async (formId: string) => {
    try {
      const response = await apiService.getForm(formId);
      
      if (response.success && response.data) {
        const backendForm = response.data as BackendForm;
        const frontendForm = mapBackendToFrontendForm(backendForm);
        
        // Atualizar o formulário na lista se já existir
        setForms(prev => {
          const existingIndex = prev.findIndex(f => f.id === formId);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = frontendForm;
            return updated;
          }
          return [...prev, frontendForm];
        });
        
        return frontendForm;
      }
    } catch (err) {
      console.error('Erro ao carregar formulário com perguntas:', err);
    }
    return null;
  }, []);

  // Carregar setores
  const loadSectors = useCallback(async () => {
    try {
      const response = await apiService.getSectors({ limit: 100 });
      
      if (response.success && response.data) {
        const backendSectors = response.data.data as BackendSector[];
        const frontendSectors = backendSectors.map(mapBackendToFrontendSector);
        setSectors(frontendSectors);
      } else {
        setError(response.error || 'Erro ao carregar setores');
      }
    } catch (err) {
      console.error('Erro ao carregar setores:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, []);

  // Criar regra de automação
  const createRule = useCallback(async (ruleData: Omit<TaskRule, 'id'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const backendRule = mapFrontendToBackendRule(ruleData);
      const response = await apiService.createAutomationRule(backendRule);
      
      if (response.success && response.data) {
        const frontendRule = mapBackendToFrontendRule(response.data as BackendAutomationRule);
        setRules(prev => [...prev, frontendRule]);
        return frontendRule;
      } else {
        setError(response.error || 'Erro ao criar regra');
        throw new Error(response.error || 'Erro ao criar regra');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar regra de automação
  const updateRule = useCallback(async (ruleId: string, updates: Partial<TaskRule>) => {
    setLoading(true);
    setError(null);
    
    try {
      const existingRule = rules.find(r => r.id === ruleId);
      if (!existingRule) {
        throw new Error('Regra não encontrada');
      }

      const updatedRule = { ...existingRule, ...updates };
      const backendRule = mapFrontendToBackendRule(updatedRule);
      const response = await apiService.updateAutomationRule(ruleId, backendRule);
      
      if (response.success && response.data) {
        const frontendRule = mapBackendToFrontendRule(response.data as BackendAutomationRule);
        setRules(prev => prev.map(r => r.id === ruleId ? frontendRule : r));
        return frontendRule;
      } else {
        setError(response.error || 'Erro ao atualizar regra');
        throw new Error(response.error || 'Erro ao atualizar regra');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [rules]);

  // Deletar regra de automação
  const deleteRule = useCallback(async (ruleId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.deleteAutomationRule(ruleId);
      
      if (response.success) {
        setRules(prev => prev.filter(r => r.id !== ruleId));
      } else {
        setError(response.error || 'Erro ao deletar regra');
        throw new Error(response.error || 'Erro ao deletar regra');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Processar automação
  const processAutomation = useCallback(async (formId: string, responseId: string, forceExecution = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.processAutomation(formId, responseId, forceExecution);
      
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Erro ao processar automação');
        throw new Error(response.error || 'Erro ao processar automação');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Processar todas as respostas de um formulário
  const processAllAutomation = useCallback(async (formId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.processAllAutomation(formId);
      
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Erro ao processar todas as respostas');
        throw new Error(response.error || 'Erro ao processar todas as respostas');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obter status da automação
  const getAutomationStatus = useCallback(async () => {
    try {
      const response = await apiService.getAutomationStatus();
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Erro ao obter status');
      }
    } catch (err) {
      console.error('Erro ao obter status da automação:', err);
      throw err;
    }
  }, []);

  // Re-enriquecer regras quando formulários forem carregados
  useEffect(() => {
    if (rules.length > 0 && forms.length > 0) {
      // Verificar se as regras já têm questionText preenchido
      const needsEnrichment = rules.some(rule => 
        rule.conditions.some(condition => !condition.questionText || condition.questionText === condition.questionId)
      );
      
      if (needsEnrichment) {
        const enrichedRules = enrichRulesWithQuestionTexts(rules, forms);
        // Verificar se realmente há mudanças antes de atualizar
        const hasChanges = enrichedRules.some((enrichedRule, index) => {
          const originalRule = rules[index];
          return enrichedRule.conditions.some((enrichedCondition, condIndex) => {
            const originalCondition = originalRule.conditions[condIndex];
            return enrichedCondition.questionText !== originalCondition.questionText ||
                   enrichedCondition.questionType !== originalCondition.questionType ||
                   JSON.stringify(enrichedCondition.questionOptions) !== JSON.stringify(originalCondition.questionOptions);
          });
        });
        
        if (hasChanges) {
          setRules(enrichedRules);
        }
      }
    }
  }, [forms, enrichRulesWithQuestionTexts]); // Adicionado enrichRulesWithQuestionTexts de volta

  // Carregar dados iniciais
  useEffect(() => {
    if (!initialDataLoaded.current) {
      initialDataLoaded.current = true;
      loadRules();
      loadForms();
      loadSectors();
    }
  }, []); // Executar apenas uma vez na montagem do componente

  return {
    // Dados
    rules,
    forms,
    sectors,
    loading,
    error,
    
    // Ações
    createRule,
    updateRule,
    deleteRule,
    processAutomation,
    processAllAutomation,
    getAutomationStatus,
    
    // Recarregar dados
    loadRules,
    loadForms,
    loadFormWithQuestions,
    loadSectors,
    
    // Utilitários
    clearError: () => setError(null)
  };
}
