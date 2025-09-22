import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { ApiResponse, FormRequest, FormResponse, FormFilters, PaginatedResponse } from '../types';
import { User } from '@prisma/client';

// Tipo para requisições autenticadas
interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'password'>;
}

const router = Router();

// Schema de validação
const formSchema = z.object({
  externalId: z.string().min(1, 'ID externo é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT']).default('ACTIVE'),
  category: z.string().optional(),
  instructions: z.string().optional(),
});

// GET /api/forms
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
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

    // Buscar formulários
    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          questions: {
            orderBy: { order: 'asc' },
          },
          responses: {
            take: 5,
            orderBy: { submittedAt: 'desc' },
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
    console.error('Erro ao buscar formulários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// GET /api/forms/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }

    const form = await prisma.form.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        responses: {
          orderBy: { submittedAt: 'desc' },
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

    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'Formulário não encontrado',
      } as ApiResponse);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: form,
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar formulário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// POST /api/forms
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }

    // Validar dados de entrada
    const validatedData = formSchema.parse(req.body);

    // Verificar se já existe formulário com o mesmo externalId
    const existingForm = await prisma.form.findUnique({
      where: { externalId: validatedData.externalId },
    });

    if (existingForm) {
      return res.status(409).json({
        success: false,
        error: 'Já existe um formulário com este ID externo',
      } as ApiResponse);
    }

    // Criar formulário
    const form = await prisma.form.create({
      data: {
        ...validatedData,
        userId,
      } as any,
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        responses: {
          orderBy: { submittedAt: 'desc' },
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
      data: form,
      message: 'Formulário criado com sucesso',
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

    console.error('Erro ao criar formulário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// PUT /api/forms/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }

    // Validar dados de entrada
    const validatedData = formSchema.parse(req.body);

    // Verificar se o formulário pertence ao usuário
    const existingForm = await prisma.form.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingForm) {
      return res.status(404).json({
        success: false,
        error: 'Formulário não encontrado',
      } as ApiResponse);
    }

    // Verificar se o externalId já existe em outro formulário
    if (validatedData.externalId !== existingForm.externalId) {
      const duplicateForm = await prisma.form.findUnique({
        where: { externalId: validatedData.externalId },
      });

      if (duplicateForm) {
        return res.status(409).json({
          success: false,
          error: 'Já existe um formulário com este ID externo',
        } as ApiResponse);
      }
    }

    // Atualizar formulário
    const form = await prisma.form.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        responses: {
          orderBy: { submittedAt: 'desc' },
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
      data: form,
      message: 'Formulário atualizado com sucesso',
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

    console.error('Erro ao atualizar formulário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// DELETE /api/forms/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }

    // Verificar se o formulário pertence ao usuário
    const existingForm = await prisma.form.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingForm) {
      return res.status(404).json({
        success: false,
        error: 'Formulário não encontrado',
      } as ApiResponse);
    }

    // Deletar formulário (cascade delete das perguntas e respostas)
    await prisma.form.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Formulário removido com sucesso',
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao remover formulário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// POST /api/forms/:id/sync
router.post('/:id/sync', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }

    // Verificar se o formulário pertence ao usuário
    const form = await prisma.form.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'Formulário não encontrado',
      } as ApiResponse);
    }

    // Aqui você implementaria a lógica real de sincronização
    // Por enquanto, apenas simular
    const syncResult = {
      success: true,
      syncedAt: new Date(),
      message: 'Formulário sincronizado com sucesso',
    };

    // Atualizar última sincronização na configuração
    await prisma.syncConfig.updateMany({
      where: { userId, isActive: true },
      data: { lastSyncAt: new Date() },
    });

    const response: ApiResponse<typeof syncResult> = {
      success: true,
      data: syncResult,
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao sincronizar formulário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// GET /api/forms/:id/responses
router.get('/:id/responses', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; if (!userId) { return res.status(401).json({ success: false, error: 'Usu�rio n�o autenticado', } as ApiResponse); }
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Verificar se o formulário pertence ao usuário
    const form = await prisma.form.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'Formulário não encontrado',
      } as ApiResponse);
    }

    // Buscar respostas
    const [responses, total] = await Promise.all([
      prisma.formResponse.findMany({
        where: { formId: id },
        skip,
        take: Number(limit),
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.formResponse.count({ where: { formId: id } }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    const response: ApiResponse<PaginatedResponse<typeof responses[0]>> = {
      success: true,
      data: {
        data: responses,
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
    console.error('Erro ao buscar respostas do formulário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

export default router;
