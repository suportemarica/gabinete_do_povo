import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Schemas de validação
const createSectorSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateSectorSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

const sectorFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

// GET /api/sectors - Listar setores
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = sectorFiltersSchema.parse(req.query);
    const skip = (filters.page - 1) * filters.limit;

    // Construir filtros do Prisma
    const where: any = {};
    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Buscar setores
    const [sectors, total] = await Promise.all([
      prisma.sector.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
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

    // Transformar dados para o formato esperado pelo frontend
    const transformedSectors = sectors.map(sector => ({
      id: sector.id,
      name: sector.name,
      description: sector.description || '',
      responsibleUsers: [], // Por enquanto vazio, pode ser implementado depois
      active: sector.isActive,
      createdAt: sector.createdAt,
      updatedAt: sector.updatedAt,
      tasksCount: sector._count.tasks,
      rulesCount: sector._count.automationRules,
    }));

    res.json({
      success: true,
      data: {
        items: transformedSectors,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar setores:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

// GET /api/sectors/:id - Buscar setor por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sector = await prisma.sector.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tasks: true,
            automationRules: true,
          },
        },
      },
    });

    if (!sector) {
      return res.status(404).json({
        success: false,
        error: 'Setor não encontrado',
      });
    }

    const transformedSector = {
      id: sector.id,
      name: sector.name,
      description: sector.description || '',
      responsibleUsers: [], // Por enquanto vazio
      active: sector.isActive,
      createdAt: sector.createdAt,
      updatedAt: sector.updatedAt,
      tasksCount: sector._count.tasks,
      rulesCount: sector._count.automationRules,
    };

    res.json({
      success: true,
      data: transformedSector,
    });
  } catch (error) {
    console.error('Erro ao buscar setor:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

// POST /api/sectors - Criar setor
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createSectorSchema.parse(req.body);

    // Verificar se já existe um setor com o mesmo nome
    const existingSector = await prisma.sector.findUnique({
      where: { name: data.name },
    });

    if (existingSector) {
      return res.status(400).json({
        success: false,
        error: 'Já existe um setor com este nome',
      });
    }

    const sector = await prisma.sector.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
      },
      include: {
        _count: {
          select: {
            tasks: true,
            automationRules: true,
          },
        },
      },
    });

    const transformedSector = {
      id: sector.id,
      name: sector.name,
      description: sector.description || '',
      responsibleUsers: [],
      active: sector.isActive,
      createdAt: sector.createdAt,
      updatedAt: sector.updatedAt,
      tasksCount: sector._count.tasks,
      rulesCount: sector._count.automationRules,
    };

    res.status(201).json({
      success: true,
      data: transformedSector,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      });
    }

    console.error('Erro ao criar setor:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

// PUT /api/sectors/:id - Atualizar setor
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateSectorSchema.parse(req.body);

    // Verificar se o setor existe
    const existingSector = await prisma.sector.findUnique({
      where: { id },
    });

    if (!existingSector) {
      return res.status(404).json({
        success: false,
        error: 'Setor não encontrado',
      });
    }

    // Se está alterando o nome, verificar se não existe outro com o mesmo nome
    if (data.name && data.name !== existingSector.name) {
      const nameExists = await prisma.sector.findUnique({
        where: { name: data.name },
      });

      if (nameExists) {
        return res.status(400).json({
          success: false,
          error: 'Já existe um setor com este nome',
        });
      }
    }

    const sector = await prisma.sector.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        _count: {
          select: {
            tasks: true,
            automationRules: true,
          },
        },
      },
    });

    const transformedSector = {
      id: sector.id,
      name: sector.name,
      description: sector.description || '',
      responsibleUsers: [],
      active: sector.isActive,
      createdAt: sector.createdAt,
      updatedAt: sector.updatedAt,
      tasksCount: sector._count.tasks,
      rulesCount: sector._count.automationRules,
    };

    res.json({
      success: true,
      data: transformedSector,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      });
    }

    console.error('Erro ao atualizar setor:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

// DELETE /api/sectors/:id - Deletar setor
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se o setor existe
    const existingSector = await prisma.sector.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tasks: true,
            automationRules: true,
          },
        },
      },
    });

    if (!existingSector) {
      return res.status(404).json({
        success: false,
        error: 'Setor não encontrado',
      });
    }

    // Verificar se há tarefas ou regras associadas
    if (existingSector._count.tasks > 0 || existingSector._count.automationRules > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível deletar setor com tarefas ou regras associadas',
      });
    }

    await prisma.sector.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Setor deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar setor:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

// PATCH /api/sectors/:id/toggle - Alternar status do setor
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingSector = await prisma.sector.findUnique({
      where: { id },
    });

    if (!existingSector) {
      return res.status(404).json({
        success: false,
        error: 'Setor não encontrado',
      });
    }

    const sector = await prisma.sector.update({
      where: { id },
      data: {
        isActive: !existingSector.isActive,
      },
      include: {
        _count: {
          select: {
            tasks: true,
            automationRules: true,
          },
        },
      },
    });

    const transformedSector = {
      id: sector.id,
      name: sector.name,
      description: sector.description || '',
      responsibleUsers: [],
      active: sector.isActive,
      createdAt: sector.createdAt,
      updatedAt: sector.updatedAt,
      tasksCount: sector._count.tasks,
      rulesCount: sector._count.automationRules,
    };

    res.json({
      success: true,
      data: transformedSector,
    });
  } catch (error) {
    console.error('Erro ao alternar status do setor:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

export default router;


