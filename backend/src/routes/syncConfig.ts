import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { ApiResponse, SyncConfigRequest, SyncConfigResponse } from '../types';
import { User } from '@prisma/client';

// Tipo para requisições autenticadas
interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'password'>;
}

const router = Router();

// Schema de validação
const syncConfigSchema = z.object({
  apiEndpoint: z.string().url('Endpoint da API deve ser uma URL válida'),
  apiKey: z.string().optional(),
  autoSync: z.boolean().default(false),
  syncInterval: z.number().min(1, 'Intervalo deve ser pelo menos 1 minuto').max(1440, 'Intervalo não pode ser maior que 1440 minutos (24 horas)'),
});

// GET /api/sync-config
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
      } as ApiResponse);
    }

    // Buscar configuração de sincronização do usuário
    const syncConfig = await prisma.syncConfig.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!syncConfig) {
      // Retornar configuração padrão se não existir
      const defaultConfig = {
        id: 'default',
        userId,
        apiEndpoint: process.env.EXTERNAL_API_URL || 'http://localhost:3001/api',
        apiKey: process.env.EXTERNAL_API_KEY || null,
        autoSync: process.env.DEFAULT_AUTO_SYNC === 'true',
        syncInterval: parseInt(process.env.DEFAULT_SYNC_INTERVAL || '30'),
        lastSyncAt: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: req.user!,
      };

      const response: ApiResponse<any> = {
        success: true,
        data: defaultConfig,
      };

      return res.json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: syncConfig,
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar configuração de sincronização:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// POST /api/sync-config
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
      } as ApiResponse);
    }

    // Validar dados de entrada
    const validatedData = syncConfigSchema.parse(req.body);

    // Verificar se já existe configuração ativa
    const existingConfig = await prisma.syncConfig.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    let syncConfig;

    if (existingConfig) {
      // Atualizar configuração existente
      syncConfig = await prisma.syncConfig.update({
        where: { id: existingConfig.id },
        data: {
          ...validatedData,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    } else {
      // Criar nova configuração
      syncConfig = await prisma.syncConfig.create({
        data: {
          ...validatedData,
          userId,
        } as any,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    }

    const response: ApiResponse<any> = {
      success: true,
      data: syncConfig,
      message: existingConfig ? 'Configuração atualizada com sucesso' : 'Configuração criada com sucesso',
    };

    res.status(existingConfig ? 200 : 201).json(response);
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

    console.error('Erro ao salvar configuração de sincronização:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// PUT /api/sync-config/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
      } as ApiResponse);
    }

    // Validar dados de entrada
    const validatedData = syncConfigSchema.parse(req.body);

    // Verificar se a configuração pertence ao usuário
    const existingConfig = await prisma.syncConfig.findFirst({
      where: {
        id,
        userId,
        isActive: true,
      },
    });

    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        error: 'Configuração não encontrada',
      } as ApiResponse);
    }

    // Atualizar configuração
    const syncConfig = await prisma.syncConfig.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const response: ApiResponse<any> = {
      success: true,
      data: syncConfig,
      message: 'Configuração atualizada com sucesso',
    };

    res.json(response);
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

    console.error('Erro ao atualizar configuração de sincronização:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// DELETE /api/sync-config/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
      } as ApiResponse);
    }

    // Verificar se a configuração pertence ao usuário
    const existingConfig = await prisma.syncConfig.findFirst({
      where: {
        id,
        userId,
        isActive: true,
      },
    });

    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        error: 'Configuração não encontrada',
      } as ApiResponse);
    }

    // Desativar configuração (soft delete)
    await prisma.syncConfig.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Configuração removida com sucesso',
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao remover configuração de sincronização:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// POST /api/sync-config/test
router.post('/test', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { apiEndpoint, apiKey } = req.body;

    if (!apiEndpoint) {
      return res.status(400).json({
        success: false,
        error: 'Endpoint da API é obrigatório',
      } as ApiResponse);
    }

    // Simular teste de conexão (aqui você implementaria a lógica real)
    const testResult = {
      success: true,
      responseTime: Math.random() * 1000, // Simular tempo de resposta
      status: 'OK',
      message: 'Conexão com a API externa bem-sucedida',
    };

    const response: ApiResponse<typeof testResult> = {
      success: true,
      data: testResult,
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao testar conexão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// GET /api/sync-config/status
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

    const status = {
      isRunning: false, // Aqui você implementaria a lógica real de verificação
      lastSync: syncConfig.lastSyncAt,
      nextSync,
      autoSync: syncConfig.autoSync,
      syncInterval: syncConfig.syncInterval,
    };

    const response: ApiResponse<typeof status> = {
      success: true,
      data: status,
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar status de sincronização:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

export default router;
