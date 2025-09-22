import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { ApiResponse, NotificationRequest, NotificationResponse, NotificationFilters, PaginatedResponse } from '../types';
import { User } from '@prisma/client';

// Tipo para requisições autenticadas
interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'password'>;
}

const router = Router();

// Schema de validação
const notificationSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  type: z.enum(['INFO', 'WARNING', 'ERROR', 'SUCCESS']).default('INFO'),
  userId: z.string().optional(),
});

// GET /api/notifications
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }
    const {
      page = 1,
      limit = 10,
      type = '',
      isRead = '',
    } = req.query as any;

    const skip = (Number(page) - 1) * Number(limit);

    // Construir filtros
    const where: any = {
      OR: [
        { userId: null }, // Notificações globais
        { userId }, // Notificações do usuário
      ],
    };

    if (type) {
      where.type = type;
    }

    if (isRead !== '') {
      where.isRead = isRead === 'true';
    }

    // Buscar notificações
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.notification.count({ where }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    const response: ApiResponse<any> = {
      success: true,
      data: {
        data: notifications,
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
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// GET /api/notifications/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        OR: [
          { userId: null }, // Notificações globais
          { userId }, // Notificações do usuário
        ],
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

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notificação não encontrada',
      } as ApiResponse);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: notification,
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar notificação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// POST /api/notifications
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }

    // Validar dados de entrada
    const validatedData = notificationSchema.parse(req.body);

    // Criar notificação
    const notification = await prisma.notification.create({
      data: {
        ...validatedData,
        userId: validatedData.userId || userId,
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

    const response: ApiResponse<any> = {
      success: true,
      data: notification,
      message: 'Notificação criada com sucesso',
    };

    res.status(201).json(response);
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

    console.error('Erro ao criar notificação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// PUT /api/notifications/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }

    // Validar dados de entrada
    const validatedData = notificationSchema.parse(req.body);

    // Verificar se a notificação pertence ao usuário ou é global
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id,
        OR: [
          { userId: null }, // Notificações globais
          { userId }, // Notificações do usuário
        ],
      },
    });

    if (!existingNotification) {
      return res.status(404).json({
        success: false,
        error: 'Notificação não encontrada',
      } as ApiResponse);
    }

    // Atualizar notificação
    const notification = await prisma.notification.update({
      where: { id },
      data: {
        ...validatedData,
        userId: validatedData.userId || userId,
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
      data: notification,
      message: 'Notificação atualizada com sucesso',
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

    console.error('Erro ao atualizar notificação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }

    // Verificar se a notificação pertence ao usuário ou é global
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id,
        OR: [
          { userId: null }, // Notificações globais
          { userId }, // Notificações do usuário
        ],
      },
    });

    if (!existingNotification) {
      return res.status(404).json({
        success: false,
        error: 'Notificação não encontrada',
      } as ApiResponse);
    }

    // Deletar notificação
    await prisma.notification.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Notificação removida com sucesso',
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao remover notificação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }

    // Verificar se a notificação pertence ao usuário ou é global
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id,
        OR: [
          { userId: null }, // Notificações globais
          { userId }, // Notificações do usuário
        ],
      },
    });

    if (!existingNotification) {
      return res.status(404).json({
        success: false,
        error: 'Notificação não encontrada',
      } as ApiResponse);
    }

    // Marcar como lida
    const notification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
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
      data: notification,
      message: 'Notificação marcada como lida',
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }

    // Marcar todas as notificações do usuário como lidas
    const result = await prisma.notification.updateMany({
      where: {
        OR: [
          { userId: null }, // Notificações globais
          { userId }, // Notificações do usuário
        ],
        isRead: false,
      },
      data: {
        isRead: true,
        updatedAt: new Date(),
      },
    });

    const response: ApiResponse<{ updatedCount: number }> = {
      success: true,
      data: { updatedCount: result.count },
      message: `${result.count} notificações marcadas como lidas`,
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// GET /api/notifications/unread/count
router.get('/unread/count', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }

    // Contar notificações não lidas
    const count = await prisma.notification.count({
      where: {
        OR: [
          { userId: null }, // Notificações globais
          { userId }, // Notificações do usuário
        ],
        isRead: false,
      },
    });

    const response: ApiResponse<{ count: number }> = {
      success: true,
      data: { count },
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao contar notificações não lidas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

export default router;
