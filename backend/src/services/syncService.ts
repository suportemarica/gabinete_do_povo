import { PrismaClient } from '@prisma/client';
import { ExternalApiService, ExternalApiCredentials } from './externalApiService';
import { ApiForm, ApiFormQuestion } from '../types';

const prisma = new PrismaClient();

export interface SyncResult {
  success: boolean;
  syncedForms: number;
  syncedQuestions: number;
  errors: string[];
  duration: number;
}

export interface SyncOptions {
  userId: string;
  credentials: ExternalApiCredentials;
  apiEndpoint: string;
  apiKey?: string;
  forceSync?: boolean; // Forçar sincronização mesmo se já foi feita recentemente
}

export class SyncService {
  private externalApi: ExternalApiService;

  constructor(externalApi: ExternalApiService) {
    this.externalApi = externalApi;
  }

  // Mapear status da API externa para FormStatus do Prisma
  private mapFormStatus(externalStatus: string | undefined): 'ACTIVE' | 'INACTIVE' | 'DRAFT' {
    if (!externalStatus) return 'ACTIVE';
    
    const statusMap: Record<string, 'ACTIVE' | 'INACTIVE' | 'DRAFT'> = {
      'active': 'ACTIVE',
      'inactive': 'INACTIVE',
      'draft': 'DRAFT',
      'ACTIVE': 'ACTIVE',
      'INACTIVE': 'INACTIVE',
      'DRAFT': 'DRAFT',
    };
    
    return statusMap[externalStatus.toLowerCase()] || 'ACTIVE';
  }

  // Mapear tipo de pergunta da API externa para QuestionType do Prisma
  private mapQuestionType(externalType: string | undefined): 'TEXT' | 'TEXTAREA' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'DATE' | 'TIME' | 'DATETIME' | 'SELECT' | 'MULTISELECT' | 'RADIO' | 'CHECKBOX' | 'FILE' | 'RATING' {
    if (!externalType) return 'TEXT';
    
    const typeMap: Record<string, 'TEXT' | 'TEXTAREA' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'DATE' | 'TIME' | 'DATETIME' | 'SELECT' | 'MULTISELECT' | 'RADIO' | 'CHECKBOX' | 'FILE' | 'RATING'> = {
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
      'cep': 'TEXT', // CEP é tratado como texto
      'cpf': 'TEXT', // CPF é tratado como texto
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
    };
    
    return typeMap[externalType.toLowerCase()] || 'TEXT';
  }

  // Sincronizar formulários da API externa para o banco local
  async syncForms(options: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let syncedForms = 0;
    let syncedQuestions = 0;

    try {
      console.log('🔄 Iniciando sincronização de formulários...');

      // 1. Autenticar na API externa
      console.log('🔐 Autenticando na API externa...');
      const authResult = await this.externalApi.authenticate(options.credentials);
      
      if (!authResult.success) {
        throw new Error(`Falha na autenticação: ${authResult.error}`);
      }

      console.log('✅ Autenticado com sucesso na API externa');

      // 2. Buscar formulários da API externa
      console.log('📋 Buscando formulários da API externa...');
      const formsResult = await this.externalApi.syncForms();
      
      if (!formsResult.success) {
        throw new Error(`Falha ao buscar formulários: ${formsResult.error}`);
      }

      const externalForms = formsResult.data?.forms || [];
      console.log(`📊 Encontrados ${externalForms.length} formulários na API externa`);

      // 3. Sincronizar cada formulário
      for (const externalForm of externalForms) {
        try {
          const syncResult = await this.syncSingleForm(externalForm, options.userId);
          syncedForms += syncResult.forms;
          syncedQuestions += syncResult.questions;
        } catch (error: any) {
          const errorMsg = `Erro ao sincronizar formulário ${externalForm.title}: ${error.message}`;
          console.error('❌', errorMsg);
          errors.push(errorMsg);
        }
      }

      // 4. Atualizar configuração de sincronização
      await this.updateSyncConfig(options);

      const duration = Date.now() - startTime;
      console.log(`✅ Sincronização concluída em ${duration}ms`);

      return {
        success: errors.length === 0,
        syncedForms,
        syncedQuestions,
        errors,
        duration,
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('❌ Erro na sincronização:', error);
      
      return {
        success: false,
        syncedForms,
        syncedQuestions,
        errors: [...errors, error.message],
        duration,
      };
    }
  }

  // Sincronizar um formulário específico
  private async syncSingleForm(externalForm: ApiForm, userId: string): Promise<{ forms: number; questions: number }> {
    let formsCount = 0;
    let questionsCount = 0;

    // Verificar se o formulário já existe
    const existingForm = await prisma.form.findFirst({
      where: {
        externalId: externalForm.id,
        userId,
      },
    });

    let formData: any;

    if (existingForm) {
      // Atualizar formulário existente
      formData = await prisma.form.update({
        where: { id: existingForm.id },
        data: {
          title: externalForm.title,
          description: externalForm.description,
          status: this.mapFormStatus(externalForm.status),
          category: externalForm.category,
          instructions: externalForm.instructions,
          updatedAt: new Date(),
        },
      });
      console.log(`🔄 Formulário atualizado: ${formData.title}`);
    } else {
      // Criar novo formulário
      formData = await prisma.form.create({
        data: {
          externalId: externalForm.id,
          title: externalForm.title,
          description: externalForm.description,
          status: this.mapFormStatus(externalForm.status),
          category: externalForm.category,
          instructions: externalForm.instructions,
          userId,
        },
      });
      console.log(`➕ Formulário criado: ${formData.title}`);
    }

    formsCount = 1;

    // Sincronizar perguntas do formulário
    if (externalForm.questions && externalForm.questions.length > 0) {
      // Remover perguntas antigas
      await prisma.formQuestion.deleteMany({
        where: { formId: formData.id },
      });

      // Criar novas perguntas
        const questionsData = externalForm.questions.map((question: ApiFormQuestion, index: number) => ({
          formId: formData.id,
          externalId: question.id,
          title: question.title,
          description: question.description,
          type: this.mapQuestionType(question.type),
          required: question.required || false,
          order: question.order || index + 1,
          options: question.options ? JSON.stringify(question.options) : null,
          validation: question.validation ? JSON.stringify(question.validation) : null,
          conditional: question.conditional ? JSON.stringify(question.conditional) : null,
        }));

      await prisma.formQuestion.createMany({
        data: questionsData,
      });

      questionsCount = questionsData.length;
      console.log(`📝 ${questionsCount} perguntas sincronizadas para: ${formData.title}`);
    }

    return { forms: formsCount, questions: questionsCount };
  }

  // Atualizar configuração de sincronização
  private async updateSyncConfig(options: SyncOptions): Promise<void> {
    try {
      await prisma.syncConfig.upsert({
        where: {
          id: `sync-${options.userId}`,
        },
        update: {
          apiEndpoint: options.apiEndpoint,
          apiKey: options.apiKey,
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        },
        create: {
          userId: options.userId,
          apiEndpoint: options.apiEndpoint,
          apiKey: options.apiKey,
          autoSync: false,
          syncInterval: 30,
          lastSyncAt: new Date(),
          isActive: true,
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar configuração de sincronização:', error);
    }
  }

  // Verificar se precisa sincronizar (baseado no último sync)
  async shouldSync(userId: string, syncIntervalMinutes: number = 30): Promise<boolean> {
    try {
      const syncConfig = await prisma.syncConfig.findFirst({
        where: {
          userId,
          isActive: true,
        },
      });

      if (!syncConfig || !syncConfig.lastSyncAt) {
        return true;
      }

      const lastSync = syncConfig.lastSyncAt.getTime();
      const now = Date.now();
      const intervalMs = syncIntervalMinutes * 60 * 1000;

      return (now - lastSync) >= intervalMs;
    } catch (error) {
      console.error('Erro ao verificar necessidade de sincronização:', error);
      return true;
    }
  }

  // Obter status da sincronização
  async getSyncStatus(userId: string): Promise<{
    lastSync: Date | null;
    nextSync: Date | null;
    isRunning: boolean;
    autoSync: boolean;
    syncInterval: number;
  }> {
    try {
      const syncConfig = await prisma.syncConfig.findFirst({
        where: {
          userId,
          isActive: true,
        },
      });

      if (!syncConfig) {
        return {
          lastSync: null,
          nextSync: null,
          isRunning: false,
          autoSync: false,
          syncInterval: 30,
        };
      }

      const nextSync = syncConfig.lastSyncAt && syncConfig.autoSync
        ? new Date(syncConfig.lastSyncAt.getTime() + (syncConfig.syncInterval * 60 * 1000))
        : null;

      return {
        lastSync: syncConfig.lastSyncAt,
        nextSync,
        isRunning: false, // Implementar lógica de verificação se está rodando
        autoSync: syncConfig.autoSync,
        syncInterval: syncConfig.syncInterval,
      };
    } catch (error) {
      console.error('Erro ao obter status de sincronização:', error);
      return {
        lastSync: null,
        nextSync: null,
        isRunning: false,
        autoSync: false,
        syncInterval: 30,
      };
    }
  }
}

// Função utilitária para criar instância do serviço
export function createSyncService(externalApi: ExternalApiService): SyncService {
  return new SyncService(externalApi);
}
