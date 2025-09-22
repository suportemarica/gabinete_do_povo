import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { ApiResponse, TaskRequest, TaskResponse, TaskFilters, PaginatedResponse } from '../types';
import { User } from '@prisma/client';

// Tipo para requisições autenticadas
interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'password'>;
}

const router = Router();

// Schema de validação
const taskSchema = z.object({
  formId: z.string().optional(),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
});

// GET /api/tasks
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      priority = '',
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

    if (priority) {
      where.priority = priority;
    }

    // Buscar tarefas
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          form: {
            select: {
              id: true,
              title: true,
              externalId: true,
              status: true,
            },
          },
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
      prisma.task.count({ where }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    const response: ApiResponse<any> = {
      success: true,
      data: {
        data: tasks,
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
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            externalId: true,
            status: true,
          },
        },
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

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
      } as ApiResponse);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: task,
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// POST /api/tasks
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }

    // Validar dados de entrada
    const validatedData = taskSchema.parse(req.body);

    // Verificar se o formulário pertence ao usuário (se fornecido)
    if (validatedData.formId) {
      const form = await prisma.form.findFirst({
        where: {
          id: validatedData.formId,
          userId,
        },
      });

      if (!form) {
        return res.status(404).json({
          success: false,
          error: 'Formulário não encontrado',
        } as ApiResponse);
      }
    }

    // Criar tarefa
    const task = await prisma.task.create({
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        userId,
      } as any,
      include: {
        form: {
          select: {
            id: true,
            title: true,
            externalId: true,
            status: true,
          },
        },
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
      data: task,
      message: 'Tarefa criada com sucesso',
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

    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }

    // Validar dados de entrada
    const validatedData = taskSchema.parse(req.body);

    // Verificar se a tarefa pertence ao usuário
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
      } as ApiResponse);
    }

    // Verificar se o formulário pertence ao usuário (se fornecido)
    if (validatedData.formId) {
      const form = await prisma.form.findFirst({
        where: {
          id: validatedData.formId,
          userId,
        },
      });

      if (!form) {
        return res.status(404).json({
          success: false,
          error: 'Formulário não encontrado',
        } as ApiResponse);
      }
    }

    // Atualizar tarefa
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        completedAt: validatedData.status === 'COMPLETED' ? new Date() : null,
        updatedAt: new Date(),
      },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            externalId: true,
            status: true,
          },
        },
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
      data: task,
      message: 'Tarefa atualizada com sucesso',
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

    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }

    // Verificar se a tarefa pertence ao usuário
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
      } as ApiResponse);
    }

    // Deletar tarefa
    await prisma.task.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Tarefa removida com sucesso',
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao remover tarefa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }
    const { status } = req.body;

    if (!status || !['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido',
      } as ApiResponse);
    }

    // Verificar se a tarefa pertence ao usuário
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
      } as ApiResponse);
    }

    // Atualizar status da tarefa
    const task = await prisma.task.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        updatedAt: new Date(),
      },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            externalId: true,
            status: true,
          },
        },
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
      data: task,
      message: 'Status da tarefa atualizado com sucesso',
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao atualizar status da tarefa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

export default router;
