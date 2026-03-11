import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { ApiResponse, AutomationRuleRequest, AutomationProcessRequest, PaginatedResponse } from '../types';
import { User } from '@prisma/client';
import { getAutomationService } from '../services/automationService';

// Tipo para requisições autenticadas
interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'password'>;
}

const router = Router();

// Schemas de validação
const automationConditionSchema = z.object({
  field: z.string().min(1, 'Campo é obrigatório'),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in']),
  value: z.any(),
  logicalOperator: z.enum(['AND', 'OR']).optional(),
});

const automationActionSchema = z.object({
  type: z.enum(['CREATE_TASK', 'SEND_NOTIFICATION', 'UPDATE_STATUS', 'ASSIGN_SECTOR']),
  config: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    sectorId: z.string().optional(),
    slaId: z.string().optional(),
    notificationTitle: z.string().optional(),
    notificationMessage: z.string().optional(),
    notificationType: z.enum(['INFO', 'WARNING', 'ERROR', 'SUCCESS']).optional(),
  }),
});

const automationRuleSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  formId: z.string().optional().nullable(),
  sectorId: z.string().optional().nullable(),
  slaId: z.string().optional().nullable(),
  conditions: z.array(automationConditionSchema).min(1, 'Pelo menos uma condição é obrigatória'),
  actions: z.array(automationActionSchema).min(1, 'Pelo menos uma ação é obrigatória'),
  priority: z.number().int().min(0).default(0),
});

const sectorSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const slaSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  duration: z.number().int().min(1, 'Duração deve ser maior que 0'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  isActive: z.boolean().default(true),
});

// ===== ROTAS DE REGRAS DE AUTOMAÇÃO =====

// GET /api/automation/rules
router.get('/rules', async (req: AuthenticatedRequest, res: Response) => {
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
      isActive = '',
      formId = '',
    } = req.query as any;

    const skip = (Number(page) - 1) * Number(limit);

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== '') {
      where.isActive = isActive === 'true';
    }

    if (formId) {
      where.formId = formId;
    }

    // Buscar regras
    const [rules, total] = await Promise.all([
      prisma.automationRule.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { priority: 'desc' },
        include: {
          form: {
            select: {
              id: true,
              externalId: true,
              title: true,
              status: true,
            },
          },
          sector: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          sla: {
            select: {
              id: true,
              name: true,
              duration: true,
              priority: true,
            },
          },
        },
      }),
      prisma.automationRule.count({ where }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    const response: ApiResponse<PaginatedResponse<typeof rules[0]>> = {
      success: true,
      data: {
        data: rules,
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
    console.error('Erro ao buscar regras de automação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// GET /api/automation/rules/:id
router.get('/rules/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
      } as ApiResponse);
    }

    const rule = await prisma.automationRule.findUnique({
      where: { id },
      include: {
        form: {
          select: {
            id: true,
            externalId: true,
            title: true,
            status: true,
          },
        },
        sector: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        sla: {
          select: {
            id: true,
            name: true,
            duration: true,
            priority: true,
          },
        },
      },
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Regra de automação não encontrada',
      } as ApiResponse);
    }

    const response: ApiResponse<typeof rule> = {
      success: true,
      data: rule,
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar regra de automação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// POST /api/automation/rules
router.post('/rules', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
      } as ApiResponse);
    }

    // Validar dados de entrada
    const validatedData = automationRuleSchema.parse(req.body);

    // Verificar se o formulário pertence ao usuário (se especificado)
    if (validatedData.formId) {
      const form = await prisma.form.findFirst({
        where: { id: validatedData.formId, userId },
      });

      if (!form) {
        return res.status(404).json({
          success: false,
          error: 'Formulário não encontrado',
        } as ApiResponse);
      }
    }

    // Verificar se o setor existe (se especificado)
    if (validatedData.sectorId) {
      const sector = await prisma.sector.findUnique({
        where: { id: validatedData.sectorId },
      });

      if (!sector) {
        return res.status(404).json({
          success: false,
          error: 'Setor não encontrado',
        } as ApiResponse);
      }
    }

    // Verificar se o SLA existe (se especificado)
    if (validatedData.slaId) {
      const sla = await prisma.sLA.findUnique({
        where: { id: validatedData.slaId },
      });

      if (!sla) {
        return res.status(404).json({
          success: false,
          error: 'SLA não encontrado',
        } as ApiResponse);
      }
    }

    // Criar regra de automação
    const rule = await prisma.automationRule.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        isActive: validatedData.isActive,
        formId: validatedData.formId || undefined,
        sectorId: validatedData.sectorId || undefined,
        slaId: validatedData.slaId || undefined,
        conditions: validatedData.conditions as unknown as any,
        actions: validatedData.actions as unknown as any,
        priority: validatedData.priority,
      },
      include: {
        form: {
          select: {
            id: true,
            externalId: true,
            title: true,
            status: true,
          },
        },
        sector: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        sla: {
          select: {
            id: true,
            name: true,
            duration: true,
            priority: true,
          },
        },
      },
    });

    const response: ApiResponse<typeof rule> = {
      success: true,
      data: rule,
      message: 'Regra de automação criada com sucesso',
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

    console.error('Erro ao criar regra de automação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// PUT /api/automation/rules/:id
router.put('/rules/:id', async (req: AuthenticatedRequest, res: Response) => {
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
    const validatedData = automationRuleSchema.parse(req.body);

    // Verificar se a regra existe
    const existingRule = await prisma.automationRule.findUnique({
      where: { id },
    });

    if (!existingRule) {
      return res.status(404).json({
        success: false,
        error: 'Regra de automação não encontrada',
      } as ApiResponse);
    }

    // Verificar se o formulário pertence ao usuário (se especificado)
    if (validatedData.formId) {
      const form = await prisma.form.findFirst({
        where: { id: validatedData.formId, userId },
      });

      if (!form) {
        return res.status(404).json({
          success: false,
          error: 'Formulário não encontrado',
        } as ApiResponse);
      }
    }

    // Verificar se o setor existe (se especificado)
    if (validatedData.sectorId) {
      const sector = await prisma.sector.findUnique({
        where: { id: validatedData.sectorId },
      });

      if (!sector) {
        return res.status(404).json({
          success: false,
          error: 'Setor não encontrado',
        } as ApiResponse);
      }
    }

    // Verificar se o SLA existe (se especificado)
    if (validatedData.slaId) {
      const sla = await prisma.sLA.findUnique({
        where: { id: validatedData.slaId },
      });

      if (!sla) {
        return res.status(404).json({
          success: false,
          error: 'SLA não encontrado',
        } as ApiResponse);
      }
    }

    // Atualizar regra de automação
    const rule = await prisma.automationRule.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        isActive: validatedData.isActive,
        formId: validatedData.formId || undefined,
        sectorId: validatedData.sectorId || undefined,
        slaId: validatedData.slaId || undefined,
        conditions: validatedData.conditions as unknown as any,
        actions: validatedData.actions as unknown as any,
        priority: validatedData.priority,
        updatedAt: new Date(),
      },
      include: {
        form: {
          select: {
            id: true,
            externalId: true,
            title: true,
            status: true,
          },
        },
        sector: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        sla: {
          select: {
            id: true,
            name: true,
            duration: true,
            priority: true,
          },
        },
      },
    });

    const response: ApiResponse<typeof rule> = {
      success: true,
      data: rule,
      message: 'Regra de automação atualizada com sucesso',
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

    console.error('Erro ao atualizar regra de automação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// DELETE /api/automation/rules/:id
router.delete('/rules/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
      } as ApiResponse);
    }

    // Verificar se a regra existe
    const existingRule = await prisma.automationRule.findUnique({
      where: { id },
    });

    if (!existingRule) {
      return res.status(404).json({
        success: false,
        error: 'Regra de automação não encontrada',
      } as ApiResponse);
    }

    // Deletar regra de automação
    await prisma.automationRule.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Regra de automação removida com sucesso',
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao remover regra de automação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// ===== ROTAS DE SETORES =====

// GET /api/automation/sectors
router.get('/sectors', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      isActive = '',
    } = req.query as any;

    const skip = (Number(page) - 1) * Number(limit);

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Buscar setores
    const [sectors, total] = await Promise.all([
      prisma.sector.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              tasks: true,
              automationRules: true,
            },
          },
        },
      }),
      prisma.sector.count({ where }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    const response: ApiResponse<PaginatedResponse<typeof sectors[0]>> = {
      success: true,
      data: {
        data: sectors,
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
    console.error('Erro ao buscar setores:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// POST /api/automation/sectors
router.post('/sectors', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validar dados de entrada
    const validatedData = sectorSchema.parse(req.body);

    // Verificar se já existe setor com o mesmo nome
    const existingSector = await prisma.sector.findUnique({
      where: { name: validatedData.name },
    });

    if (existingSector) {
      return res.status(409).json({
        success: false,
        error: 'Já existe um setor com este nome',
      } as ApiResponse);
    }

    // Criar setor
    const sector = await prisma.sector.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        isActive: validatedData.isActive,
      },
    });

    const response: ApiResponse<typeof sector> = {
      success: true,
      data: sector,
      message: 'Setor criado com sucesso',
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

    console.error('Erro ao criar setor:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// ===== ROTAS DE SLA =====

// GET /api/automation/slas
router.get('/slas', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      isActive = '',
    } = req.query as any;

    const skip = (Number(page) - 1) * Number(limit);

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Buscar SLAs
    const [slas, total] = await Promise.all([
      prisma.sLA.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { priority: 'desc' },
        include: {
          _count: {
            select: {
              automationRules: true,
            },
          },
        },
      }),
      prisma.sLA.count({ where }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    const response: ApiResponse<PaginatedResponse<typeof slas[0]>> = {
      success: true,
      data: {
        data: slas,
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
    console.error('Erro ao buscar SLAs:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// POST /api/automation/slas
router.post('/slas', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validar dados de entrada
    const validatedData = slaSchema.parse(req.body);

    // Criar SLA
    const sla = await prisma.sLA.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        duration: validatedData.duration,
        priority: validatedData.priority,
        isActive: validatedData.isActive,
      },
    });

    const response: ApiResponse<typeof sla> = {
      success: true,
      data: sla,
      message: 'SLA criado com sucesso',
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

    console.error('Erro ao criar SLA:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// ===== ROTAS DE PROCESSAMENTO =====

// POST /api/automation/process
router.post('/process', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
      } as ApiResponse);
    }

    const { formId, responseId, forceExecution } = req.body as AutomationProcessRequest;

    if (!formId || !responseId) {
      return res.status(400).json({
        success: false,
        error: 'formId e responseId são obrigatórios',
      } as ApiResponse);
    }

    // Verificar se o formulário pertence ao usuário
    const form = await prisma.form.findFirst({
      where: { id: formId, userId },
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'Formulário não encontrado',
      } as ApiResponse);
    }

    // Processar resposta
    const automationService = getAutomationService();
    const result = await automationService.processFormResponse({
      formId,
      responseId,
      forceExecution: forceExecution || false,
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao processar automação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// POST /api/automation/process-all/:formId
router.post('/process-all/:formId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
      } as ApiResponse);
    }

    const { formId } = req.params;

    // Verificar se o formulário pertence ao usuário
    const form = await prisma.form.findFirst({
      where: { id: formId, userId },
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'Formulário não encontrado',
      } as ApiResponse);
    }

    // Processar todas as respostas pendentes
    const automationService = getAutomationService();
    const result = await automationService.processAllPendingResponses(formId);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao processar todas as respostas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// GET /api/automation/status
router.get('/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const automationService = getAutomationService();
    const status = await automationService.getAutomationStatus();

    const response: ApiResponse<typeof status> = {
      success: true,
      data: status,
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao obter status da automação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

export default router;
