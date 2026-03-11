import { prisma } from '../index';
import { 
  AutomationRule, 
  AutomationExecution, 
  FormResponse, 
  Task, 
  Notification,
  AutomationStatus,
  TaskPriority,
  NotificationType
} from '@prisma/client';
import { 
  AutomationCondition, 
  AutomationAction, 
  AutomationProcessRequest, 
  AutomationProcessResponse,
  AutomationStatusResponse
} from '../types';

export class AutomationService {
  /**
   * Processa uma resposta de formulário e executa as regras de automação aplicáveis
   */
  async processFormResponse(request: AutomationProcessRequest): Promise<AutomationProcessResponse> {
    const { formId, responseId, forceExecution = false } = request;
    
    try {
      // Buscar a resposta do formulário
      const response = await prisma.formResponse.findFirst({
        where: { id: responseId, formId },
        include: {
          form: {
            include: {
              questions: true
            }
          }
        }
      });

      if (!response) {
        throw new Error('Resposta do formulário não encontrada');
      }

      // Buscar regras de automação ativas para este formulário
      const rules = await prisma.automationRule.findMany({
        where: {
          isActive: true,
          formId: formId
        },
        include: {
          sector: true,
          sla: true
        },
        orderBy: { priority: 'desc' }
      });

      const executions: AutomationExecution[] = [];
      let createdTasks = 0;
      let sentNotifications = 0;
      const errors: string[] = [];

      // Processar cada regra
      for (const rule of rules) {
        try {
          const execution = await this.executeRule(rule, response, forceExecution);
          executions.push(execution);
          
          if (execution.status === AutomationStatus.SUCCESS) {
            // Contar tarefas e notificações criadas
            if (execution.result) {
              const result = execution.result as any;
              if (result.createdTasks) createdTasks += result.createdTasks;
              if (result.sentNotifications) sentNotifications += result.sentNotifications;
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          errors.push(`Regra ${rule.name}: ${errorMessage}`);
          
          // Registrar execução com erro
          const failedExecution = await prisma.automationExecution.create({
            data: {
              ruleId: rule.id,
              formId: formId,
              responseId: responseId,
              status: AutomationStatus.FAILED,
              error: errorMessage
            }
          });
          executions.push(failedExecution);
        }
      }

      return {
        success: errors.length === 0,
        executedRules: executions.length,
        createdTasks,
        sentNotifications,
        errors,
        executions: executions.map(exec => ({
          ...exec,
          rule: { id: exec.ruleId, name: rules.find(r => r.id === exec.ruleId)?.name || 'N/A' },
          form: { id: exec.formId, title: response.form.title },
          response: { id: exec.responseId, submittedAt: response.submittedAt }
        }))
      };

    } catch (error) {
      console.error('Erro ao processar resposta do formulário:', error);
      throw error;
    }
  }

  /**
   * Executa uma regra de automação específica
   */
  private async executeRule(
    rule: AutomationRule & { sector?: any; sla?: any }, 
    response: FormResponse & { form: any }, 
    forceExecution: boolean
  ): Promise<AutomationExecution> {
    const conditions = rule.conditions as unknown as AutomationCondition[];
    const actions = rule.actions as unknown as AutomationAction[];

    // Verificar se as condições são atendidas
    const conditionsMet = forceExecution || await this.evaluateConditions(conditions, response);
    
    if (!conditionsMet) {
      return await prisma.automationExecution.create({
        data: {
          ruleId: rule.id,
          formId: response.formId,
          responseId: response.id,
          status: AutomationStatus.SKIPPED,
          result: { reason: 'Condições não atendidas' }
        }
      });
    }

    // Executar ações
    const executionResult = await this.executeActions(actions, rule, response);

    return await prisma.automationExecution.create({
      data: {
        ruleId: rule.id,
        formId: response.formId,
        responseId: response.id,
        status: AutomationStatus.SUCCESS,
        result: executionResult
      }
    });
  }

  /**
   * Avalia se as condições de uma regra são atendidas
   */
  private async evaluateConditions(
    conditions: AutomationCondition[], 
    response: FormResponse & { form: any }
  ): Promise<boolean> {
    if (conditions.length === 0) return true;

    const answers = response.answers as Record<string, any>;
    let result = true;
    let logicalOperator: 'AND' | 'OR' = 'AND';

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      const fieldValue = this.getFieldValue(answers, condition.field);
      const conditionResult = this.evaluateCondition(fieldValue, condition);

      if (i === 0) {
        result = conditionResult;
      } else {
        if (logicalOperator === 'AND') {
          result = result && conditionResult;
        } else {
          result = result || conditionResult;
        }
      }

      logicalOperator = condition.logicalOperator || 'AND';
    }

    return result;
  }

  /**
   * Obtém o valor de um campo nas respostas
   */
  private getFieldValue(answers: Record<string, any>, field: string): any {
    const fieldParts = field.split('.');
    let value = answers;

    for (const part of fieldParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Avalia uma condição específica
   */
  private evaluateCondition(fieldValue: any, condition: AutomationCondition): boolean {
    const { operator, value } = condition;

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      case 'less_than':
        return Number(fieldValue) < Number(value);
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(value) && !value.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Executa as ações de uma regra
   */
  private async executeActions(
    actions: AutomationAction[], 
    rule: AutomationRule & { sector?: any; sla?: any }, 
    response: FormResponse & { form: any }
  ): Promise<any> {
    const result: any = {
      createdTasks: 0,
      sentNotifications: 0,
      actions: []
    };

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'CREATE_TASK':
            const task = await this.createTask(action, rule, response);
            if (task) {
              result.createdTasks++;
              result.actions.push({ type: 'CREATE_TASK', taskId: task.id });
            }
            break;

          case 'SEND_NOTIFICATION':
            const notification = await this.sendNotification(action, rule, response);
            if (notification) {
              result.sentNotifications++;
              result.actions.push({ type: 'SEND_NOTIFICATION', notificationId: notification.id });
            }
            break;

          case 'UPDATE_STATUS':
            // Implementar atualização de status se necessário
            result.actions.push({ type: 'UPDATE_STATUS', status: 'updated' });
            break;

          case 'ASSIGN_SECTOR':
            // Implementar atribuição de setor se necessário
            result.actions.push({ type: 'ASSIGN_SECTOR', sectorId: action.config.sectorId });
            break;
        }
      } catch (error) {
        console.error(`Erro ao executar ação ${action.type}:`, error);
        result.actions.push({ 
          type: action.type, 
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        });
      }
    }

    return result;
  }

  /**
   * Cria uma tarefa baseada na ação
   */
  private async createTask(
    action: AutomationAction, 
    rule: AutomationRule & { sector?: any; sla?: any }, 
    response: FormResponse & { form: any }
  ): Promise<Task | null> {
    const config = action.config;
    const answers = response.answers as Record<string, any>;

    // Gerar título e descrição da tarefa
    const title = this.interpolateString(config.title || 'Nova Tarefa', answers);
    const description = this.interpolateString(config.description || '', answers);

    // Calcular data de vencimento baseada no SLA
    let dueDate: Date | undefined;
    if (rule.sla) {
      dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + rule.sla.duration);
    }

    const task = await prisma.task.create({
      data: {
        formId: response.formId,
        title,
        description,
        priority: config.priority || rule.sla?.priority || TaskPriority.MEDIUM,
        dueDate,
        sectorId: config.sectorId || rule.sectorId,
        userId: response.form.userId // Usar o usuário proprietário do formulário
      }
    });

    return task;
  }

  /**
   * Envia uma notificação baseada na ação
   */
  private async sendNotification(
    action: AutomationAction, 
    rule: AutomationRule & { sector?: any; sla?: any }, 
    response: FormResponse & { form: any }
  ): Promise<Notification | null> {
    const config = action.config;
    const answers = response.answers as Record<string, any>;

    const title = this.interpolateString(config.notificationTitle || 'Notificação', answers);
    const message = this.interpolateString(config.notificationMessage || '', answers);

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: config.notificationType || NotificationType.INFO,
        userId: response.form.userId
      }
    });

    return notification;
  }

  /**
   * Interpola variáveis em strings usando as respostas do formulário
   */
  private interpolateString(template: string, answers: Record<string, any>): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, field) => {
      const value = this.getFieldValue(answers, field);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Obtém o status do sistema de automação
   */
  async getAutomationStatus(): Promise<AutomationStatusResponse> {
    const [totalRules, activeRules, lastExecution, recentExecutions] = await Promise.all([
      prisma.automationRule.count(),
      prisma.automationRule.count({ where: { isActive: true } }),
      prisma.automationExecution.findFirst({
        orderBy: { executedAt: 'desc' },
        select: { executedAt: true }
      }),
      prisma.automationExecution.findMany({
        take: 10,
        orderBy: { executedAt: 'desc' },
        include: {
          rule: { select: { id: true, name: true } },
          form: { select: { id: true, title: true } },
          response: { select: { id: true, submittedAt: true } }
        }
      })
    ]);

    return {
      isActive: activeRules > 0,
      totalRules,
      activeRules,
      lastExecution: lastExecution?.executedAt || null,
      nextExecution: null, // Implementar lógica de agendamento se necessário
      recentExecutions: recentExecutions.map(exec => ({
        ...exec,
        rule: { id: exec.rule.id, name: exec.rule.name },
        form: { id: exec.form.id, title: exec.form.title },
        response: { id: exec.response.id, submittedAt: exec.response.submittedAt }
      }))
    };
  }

  /**
   * Processa todas as respostas pendentes de um formulário
   */
  async processAllPendingResponses(formId: string): Promise<AutomationProcessResponse> {
    const responses = await prisma.formResponse.findMany({
      where: { formId },
      include: {
        form: {
          include: {
            questions: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    let totalExecutedRules = 0;
    let totalCreatedTasks = 0;
    let totalSentNotifications = 0;
    const allErrors: string[] = [];
    const allExecutions: any[] = [];

    for (const response of responses) {
      try {
        const result = await this.processFormResponse({
          formId,
          responseId: response.id,
          forceExecution: false
        });

        totalExecutedRules += result.executedRules;
        totalCreatedTasks += result.createdTasks;
        totalSentNotifications += result.sentNotifications;
        allErrors.push(...result.errors);
        allExecutions.push(...result.executions);
      } catch (error) {
        allErrors.push(`Erro ao processar resposta ${response.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    return {
      success: allErrors.length === 0,
      executedRules: totalExecutedRules,
      createdTasks: totalCreatedTasks,
      sentNotifications: totalSentNotifications,
      errors: allErrors,
      executions: allExecutions
    };
  }
}

// Instância singleton do serviço
let automationService: AutomationService | null = null;

export function getAutomationService(): AutomationService {
  if (!automationService) {
    automationService = new AutomationService();
  }
  return automationService;
}
