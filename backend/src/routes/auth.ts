import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../index';
import { LoginRequest, RegisterRequest, ApiResponse, LoginResponse } from '../types';

const router = Router();

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

// Função para gerar token JWT
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não configurado');
  }
  
  const payload = { userId };
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  
  // Converter string para número (em segundos) se necessário
  const expiresInValue: number = expiresIn.includes('h') 
    ? parseInt(expiresIn.replace('h', '')) * 3600 
    : parseInt(expiresIn);
  
  return jwt.sign(payload, secret, { expiresIn: expiresInValue });
};

// Função para calcular expiração do token
const getTokenExpiration = (): number => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  const hours = parseInt(expiresIn.replace('h', ''));
  return hours * 60 * 60; // em segundos
};

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validar dados de entrada
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password } = validatedData;

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Usuário já existe com este email',
      } as ApiResponse);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Gerar token
    const token = generateToken(user.id);
    const expiresIn = getTokenExpiration();

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        user,
        token,
        expiresIn,
      },
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

    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validar dados de entrada
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
      } as ApiResponse);
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Conta desativada',
      } as ApiResponse);
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
      } as ApiResponse);
    }

    // Gerar token
    const token = generateToken(user.id);
    const expiresIn = getTokenExpiration();

    // Retornar dados do usuário (sem senha)
    const { password: _, ...userWithoutPassword } = user;

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        expiresIn,
      },
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

    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido',
      } as ApiResponse);
    }

    // Verificar token atual
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou usuário inativo',
      } as ApiResponse);
    }

    // Gerar novo token
    const newToken = generateToken(user.id);
    const expiresIn = getTokenExpiration();

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        user,
        token: newToken,
        expiresIn,
      },
    };

    res.json(response);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
      } as ApiResponse);
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expirado',
      } as ApiResponse);
    }

    console.error('Erro na renovação do token:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

// GET /api/auth/profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido',
      } as ApiResponse);
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado ou inativo',
      } as ApiResponse);
    }

    const response: ApiResponse<typeof user> = {
      success: true,
      data: user,
    };

    res.json(response);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
      } as ApiResponse);
    }

    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    } as ApiResponse);
  }
});

export default router;
