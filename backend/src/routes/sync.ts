import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { ApiResponse } from '../types';
import { User } from '@prisma/client';
import { initializeExternalApiService, getExternalApiService } from '../services/externalApiService';
import { getSyncService } from '../services/syncService';

// Tipo para requisições autenticadas
interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'password'>;
}

const router = Router();

// Schema de validação para sincronização
const syncSchema = z.object({
  apiEndpoint: z.string().url('Endpoint da API deve ser uma URL válida'),
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
  apiKey: z.string().optional(),
  forceSync: z.boolean().optional().default(false),
});

// POST /api/sync/forms - Sincronizar formulários da API externa
router.post('/forms', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
      } as ApiResponse);
    }

    // Validar dados de entrada
    const validatedData = syncSchema.parse(req.body);
    const { apiEndpoint, email, password, apiKey, forceSync } = validatedData;

    console.log('🔄 Iniciando sincronização de formulários...');
    console.log(`📡 API Endpoint: ${apiEndpoint}`);
    console.log(`👤 Usuário: ${email}`);

    // Inicializar serviço de API externa
    const externalApi = initializeExternalApiService({
      baseUrl: apiEndpoint,
      apiKey,
      timeout: 30000,
    });

    // Obter serviço de sincronização
    const syncService = getSyncService();

    // Executar sincronização
    const syncResult = await syncService.syncForms(userId, { email, password });

    if (syncResult.success) {
      console.log('✅ Sincronização concluída com sucesso');
      console.log(`📊 Formulários sincronizados: ${syncResult.syncedForms}`);
      console.log(`📝 Tarefas criadas: ${syncResult.createdTasks}`);
      console.log(`🔔 Notificações enviadas: ${syncResult.sentNotifications}`);
      console.log(`⏱️ Duração: ${syncResult.duration}ms`);

      const response: ApiResponse<typeof syncResult> = {
        success: true,
        data: syncResult,
        message: `Sincronização concluída: ${syncResult.syncedForms} formulários, ${syncResult.createdTasks} tarefas criadas, ${syncResult.sentNotifications} notificações enviadas`,
      };

      res.json(response);
    } else {
      console.error('❌ Sincronização falhou');
      console.error('Erros:', syncResult.errors);

      const response: ApiResponse<typeof syncResult> = {
        success: false,
        data: syncResult,
        error: 'Falha na sincronização',
      };

      res.status(400).json(response);
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      } as ApiResponse);
    }

    console.error('❌ Erro na sincronização:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// POST /api/sync/test - Testar conexão com API externa
router.post('/test', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { apiEndpoint, email, password, apiKey } = req.body;

    if (!apiEndpoint || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'apiEndpoint, email e password são obrigatórios',
      } as ApiResponse);
    }

    console.log('🧪 Testando conexão com API externa...');
    console.log(`📡 API Endpoint: ${apiEndpoint}`);
    console.log(`👤 Usuário: ${email}`);

    // Inicializar serviço de API externa
    const externalApi = initializeExternalApiService({
      baseUrl: apiEndpoint,
      apiKey,
      timeout: 10000, // Timeout menor para teste
    });

    // Testar autenticação
    const authResult = await externalApi.authenticate({ email, password });
    
    if (!authResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Falha na autenticação',
        details: authResult.error,
      } as ApiResponse);
    }

    // Testar conexão
    const testResult = await externalApi.testConnection();
    
    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Falha no teste de conexão',
        details: testResult.error,
      } as ApiResponse);
    }

    console.log('✅ Teste de conexão bem-sucedido');

    const response: ApiResponse<{
      authenticated: boolean;
      user: any;
      connection: any;
    }> = {
      success: true,
      data: {
        authenticated: true,
        user: authResult.data?.user,
        connection: testResult.data,
      },
      message: 'Conexão com API externa estabelecida com sucesso',
    };

    res.json(response);

  } catch (error: any) {
    console.error('❌ Erro no teste de conexão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message,
    } as ApiResponse);
  }
});

// GET /api/sync/status - Obter status da sincronização
router.get('/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
      } as ApiResponse);
    }

    // Buscar configuração de sincronização
    const syncConfig = await prisma.syncConfig.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (!syncConfig) {
      return res.status(404).json({
        success: false,
        error: 'Configuração de sincronização não encontrada',
      } as ApiResponse);
    }

    // Calcular próximo sync
    const nextSync = syncConfig.autoSync && syncConfig.lastSyncAt
      ? new Date(syncConfig.lastSyncAt.getTime() + (syncConfig.syncInterval * 60 * 1000))
      : null;

    // Verificar se precisa sincronizar
    const shouldSync = syncConfig.lastSyncAt
      ? (Date.now() - syncConfig.lastSyncAt.getTime()) >= (syncConfig.syncInterval * 60 * 1000)
      : true;

    const status = {
      isConfigured: true,
      isRunning: false, // Implementar lógica de verificação se está rodando
      lastSync: syncConfig.lastSyncAt,
      nextSync,
      shouldSync,
      autoSync: syncConfig.autoSync,
      syncInterval: syncConfig.syncInterval,
      apiEndpoint: syncConfig.apiEndpoint,
    };

    const response: ApiResponse<typeof status> = {
      success: true,
      data: status,
    };

    res.json(response);

  } catch (error) {
    console.error('Erro ao obter status de sincronização:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// GET /api/sync/forms - Listar formulários sincronizados
router.get('/forms', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
      } as ApiResponse);
    }

    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      category = '',
    } = req.query as any;

    const skip = (Number(page) - 1) * Number(limit);

    // Construir filtros
    const where: any = {
      userId,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    // Buscar formulários sincronizados
    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { updatedAt: 'desc' },
        include: {
          questions: {
            orderBy: { order: 'asc' },
          },
          responses: {
            take: 5,
            orderBy: { submittedAt: 'desc' },
          },
        },
      }),
      prisma.form.count({ where }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    const response: ApiResponse<any> = {
      success: true,
      data: {
        data: forms,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
        },
      },
    };

    res.json(response);

  } catch (error) {
    console.error('Erro ao buscar formulários sincronizados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

export default router;
