import { prisma } from '../index';
import { getExternalApiService } from './externalApiService';
import { getAutomationService } from './automationService';
import { ApiForm, ApiFormQuestion } from '../types';

export interface SyncResult {
  success: boolean;
  syncedForms: number;
  updatedForms: number;
  createdForms: number;
  errors: string[];
  duration: number;
  processedResponses: number;
  createdTasks: number;
  sentNotifications: number;
}

export class SyncService {
  /**
   * Mapeia status da API externa para FormStatus do Prisma
   */
  private mapFormStatus(apiStatus: string): 'ACTIVE' | 'INACTIVE' | 'DRAFT' {
    const statusMap: { [key: string]: 'ACTIVE' | 'INACTIVE' | 'DRAFT' } = {
      'active': 'ACTIVE',
      'inactive': 'INACTIVE',
      'draft': 'DRAFT',
      'ACTIVE': 'ACTIVE',
      'INACTIVE': 'INACTIVE',
      'DRAFT': 'DRAFT',
    };
    
    return statusMap[apiStatus.toLowerCase()] || 'ACTIVE';
  }

  /**
   * Mapeia tipo de pergunta da API externa para QuestionType do Prisma
   */
  private mapQuestionType(apiType: string): 'TEXT' | 'TEXTAREA' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'DATE' | 'TIME' | 'DATETIME' | 'SELECT' | 'MULTISELECT' | 'RADIO' | 'CHECKBOX' | 'FILE' | 'RATING' | 'SCALE' {
    const typeMap: { [key: string]: 'TEXT' | 'TEXTAREA' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'DATE' | 'TIME' | 'DATETIME' | 'SELECT' | 'MULTISELECT' | 'RADIO' | 'CHECKBOX' | 'FILE' | 'RATING' | 'SCALE' } = {
      'text': 'TEXT',
      'textarea': 'TEXTAREA',
      'email': 'EMAIL',
      'phone': 'PHONE',
      'number': 'NUMBER',
      'date': 'DATE',
      'time': 'TIME',
      'datetime': 'DATETIME',
      'select': 'SELECT',
      'multiselect': 'MULTISELECT',
      'radio': 'RADIO',
      'checkbox': 'CHECKBOX',
      'file': 'FILE',
      'rating': 'RATING',
      'scale': 'SCALE',
      // Valores em maiúsculo também
      'TEXT': 'TEXT',
      'TEXTAREA': 'TEXTAREA',
      'EMAIL': 'EMAIL',
      'PHONE': 'PHONE',
      'NUMBER': 'NUMBER',
      'DATE': 'DATE',
      'TIME': 'TIME',
      'DATETIME': 'DATETIME',
      'SELECT': 'SELECT',
      'MULTISELECT': 'MULTISELECT',
      'RADIO': 'RADIO',
      'CHECKBOX': 'CHECKBOX',
      'FILE': 'FILE',
      'RATING': 'RATING',
      'SCALE': 'SCALE',
    };
    
    return typeMap[apiType.toLowerCase()] || 'TEXT';
  }

  /**
   * Sincroniza formulários da API externa e processa automações
   */
  async syncForms(userId: string, credentials?: { email: string; password: string }): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      syncedForms: 0,
      updatedForms: 0,
      createdForms: 0,
      errors: [],
      duration: 0,
      processedResponses: 0,
      createdTasks: 0,
      sentNotifications: 0,
    };

    try {
      // Obter configuração de sincronização do usuário
      const syncConfig = await prisma.syncConfig.findFirst({
        where: { userId, isActive: true },
      });

      if (!syncConfig) {
        throw new Error('Configuração de sincronização não encontrada');
      }

      // Inicializar serviço da API externa
      const externalApiService = getExternalApiService({
        baseUrl: syncConfig.apiEndpoint,
        apiKey: syncConfig.apiKey,
        timeout: 30000,
      });

      // Autenticar na API externa
      const authResult = await externalApiService.authenticate({
        email: credentials?.email || process.env.EXTERNAL_API_EMAIL || '',
        password: credentials?.password || process.env.EXTERNAL_API_PASSWORD || '',
      });

      if (!authResult.success) {
        throw new Error(`Falha na autenticação: ${authResult.error}`);
      }

      // Buscar formulários da API externa
      const formsResult = await externalApiService.syncForms();
      if (!formsResult.success || !formsResult.data) {
        throw new Error(`Erro ao buscar formulários: ${formsResult.error}`);
      }

      const externalForms = formsResult.data.forms;
      result.syncedForms = externalForms.length;

      // Processar cada formulário
      for (const externalForm of externalForms) {
        try {
          await this.syncForm(externalForm, userId);
          result.createdForms++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          result.errors.push(`Formulário ${externalForm.id}: ${errorMessage}`);
        }
      }

      // Processar automações para formulários existentes
      const automationService = getAutomationService();
      const forms = await prisma.form.findMany({
        where: { userId },
        include: {
          responses: {
            where: {
              submittedAt: {
                gte: syncConfig.lastSyncAt || new Date(0),
              },
            },
          },
        },
      });

      for (const form of forms) {
        if (form.responses.length > 0) {
          try {
            const automationResult = await automationService.processAllPendingResponses(form.id);
            result.processedResponses += automationResult.executedRules;
            result.createdTasks += automationResult.createdTasks;
            result.sentNotifications += automationResult.sentNotifications;
            result.errors.push(...automationResult.errors);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            result.errors.push(`Automação para formulário ${form.id}: ${errorMessage}`);
          }
        }
      }

      // Atualizar última sincronização
      await prisma.syncConfig.update({
        where: { id: syncConfig.id },
        data: { lastSyncAt: new Date() },
      });

      result.duration = Date.now() - startTime;
      result.success = result.errors.length === 0;

    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      result.errors.push(errorMessage);
    }

    return result;
  }

  /**
   * Sincroniza um formulário específico
   */
  private async syncForm(externalForm: ApiForm, userId: string): Promise<void> {
    // Verificar se o formulário já existe
    const existingForm = await prisma.form.findUnique({
      where: { externalId: externalForm.id },
    });

    if (existingForm) {
      // Atualizar formulário existente
      await prisma.form.update({
        where: { id: existingForm.id },
        data: {
          title: externalForm.title,
          description: externalForm.description,
          status: this.mapFormStatus(externalForm.status || 'active'),
          category: externalForm.category,
          instructions: externalForm.instructions,
          updatedAt: new Date(),
        },
      });

      // Sincronizar perguntas
      if (externalForm.questions && externalForm.questions.length > 0) {
        await this.syncFormQuestions(existingForm.id, externalForm.questions);
      }
    } else {
      // Criar novo formulário
      const newForm = await prisma.form.create({
        data: {
          externalId: externalForm.id,
          title: externalForm.title,
          description: externalForm.description,
          status: this.mapFormStatus(externalForm.status || 'active'),
          category: externalForm.category,
          instructions: externalForm.instructions,
          userId,
        },
      });

      // Sincronizar perguntas
      if (externalForm.questions && externalForm.questions.length > 0) {
        await this.syncFormQuestions(newForm.id, externalForm.questions);
      }
    }
  }

  /**
   * Sincroniza as perguntas de um formulário
   */
  private async syncFormQuestions(formId: string, questions: ApiFormQuestion[]): Promise<void> {
    // Deletar perguntas existentes
    await prisma.formQuestion.deleteMany({
      where: { formId },
    });

    // Criar novas perguntas
    for (const question of questions) {
      await prisma.formQuestion.create({
        data: {
          formId,
          externalId: question.id,
          title: question.title,
          description: question.description,
          type: this.mapQuestionType(question.type),
          required: question.required || false,
          order: question.order || 0,
          options: question.options || null,
          validation: question.validation || null,
          conditional: question.conditional || null,
        },
      });
    }
  }

  /**
   * Sincroniza respostas de um formulário específico
   */
  async syncFormResponses(formId: string, userId: string, credentials?: { email: string; password: string }): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      syncedForms: 0,
      updatedForms: 0,
      createdForms: 0,
      errors: [],
      duration: 0,
      processedResponses: 0,
      createdTasks: 0,
      sentNotifications: 0,
    };

    try {
      // Verificar se o formulário pertence ao usuário
      const form = await prisma.form.findFirst({
        where: { id: formId, userId },
      });

      if (!form) {
        throw new Error('Formulário não encontrado');
      }

      // Obter configuração de sincronização
      const syncConfig = await prisma.syncConfig.findFirst({
        where: { userId, isActive: true },
      });

      if (!syncConfig) {
        throw new Error('Configuração de sincronização não encontrada');
      }

      // Inicializar serviço da API externa
      const externalApiService = getExternalApiService({
        baseUrl: syncConfig.apiEndpoint,
        apiKey: syncConfig.apiKey,
        timeout: 30000,
      });

      // Autenticar na API externa
      const authResult = await externalApiService.authenticate({
        email: credentials?.email || process.env.EXTERNAL_API_EMAIL || '',
        password: credentials?.password || process.env.EXTERNAL_API_PASSWORD || '',
      });

      if (!authResult.success) {
        throw new Error(`Falha na autenticação: ${authResult.error}`);
      }

      // Buscar respostas do formulário da API externa
      // Nota: Esta funcionalidade precisaria ser implementada na API externa
      // Por enquanto, vamos simular o processamento de respostas existentes
      const responses = await prisma.formResponse.findMany({
        where: {
          formId,
          submittedAt: {
            gte: syncConfig.lastSyncAt || new Date(0),
          },
        },
      });

      result.syncedForms = 1;
      result.processedResponses = responses.length;

      // Processar automações para as respostas
      const automationService = getAutomationService();
      const automationResult = await automationService.processAllPendingResponses(formId);
      
      result.createdTasks = automationResult.createdTasks;
      result.sentNotifications = automationResult.sentNotifications;
      result.errors.push(...automationResult.errors);

      // Atualizar última sincronização
      await prisma.syncConfig.update({
        where: { id: syncConfig.id },
        data: { lastSyncAt: new Date() },
      });

      result.duration = Date.now() - startTime;
      result.success = result.errors.length === 0;

    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      result.errors.push(errorMessage);
    }

    return result;
  }

  /**
   * Obtém o status da sincronização
   */
  async getSyncStatus(userId: string): Promise<{
    isActive: boolean;
    lastSync: Date | null;
    nextSync: Date | null;
    totalForms: number;
    totalRules: number;
    activeRules: number;
  }> {
    const syncConfig = await prisma.syncConfig.findFirst({
      where: { userId, isActive: true },
    });

    const [totalForms, totalRules, activeRules] = await Promise.all([
      prisma.form.count({ where: { userId } }),
      prisma.automationRule.count(),
      prisma.automationRule.count({ where: { isActive: true } }),
    ]);

    return {
      isActive: !!syncConfig,
      lastSync: syncConfig?.lastSyncAt || null,
      nextSync: syncConfig?.lastSyncAt ? 
        new Date(syncConfig.lastSyncAt.getTime() + (syncConfig.syncInterval * 60 * 1000)) : 
        null,
      totalForms,
      totalRules,
      activeRules,
    };
  }
}

// Instância singleton do serviço
let syncService: SyncService | null = null;

export function getSyncService(): SyncService {
  if (!syncService) {
    syncService = new SyncService();
  }
  return syncService;
}