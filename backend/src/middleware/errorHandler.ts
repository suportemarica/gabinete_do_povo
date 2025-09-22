import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Erro capturado:', error);

  // Erro de validação do Prisma
  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos fornecidos',
      details: error.message,
    });
  }

  // Erro de constraint do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          error: 'Registro duplicado',
          details: 'Já existe um registro com esses dados',
        });
      case 'P2025':
        return res.status(404).json({
          success: false,
          error: 'Registro não encontrado',
        });
      case 'P2003':
        return res.status(400).json({
          success: false,
          error: 'Referência inválida',
          details: 'O registro referenciado não existe',
        });
      default:
        return res.status(400).json({
          success: false,
          error: 'Erro no banco de dados',
          details: error.message,
        });
    }
  }

  // Erro de conexão do Prisma
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return res.status(500).json({
      success: false,
      error: 'Erro de conexão com o banco de dados',
    });
  }

  // Erro de timeout do Prisma
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno do banco de dados',
    });
  }

  // Erro de validação personalizado
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: error.message,
    });
  }

  // Erro de autorização
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Não autorizado',
    });
  }

  // Erro de permissão
  if (error.name === 'ForbiddenError') {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado',
    });
  }

  // Erro de não encontrado
  if (error.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      error: 'Recurso não encontrado',
    });
  }

  // Erro de conflito
  if (error.name === 'ConflictError') {
    return res.status(409).json({
      success: false,
      error: 'Conflito de dados',
    });
  }

  // Erro de limite de taxa
  if (error.name === 'RateLimitError') {
    return res.status(429).json({
      success: false,
      error: 'Muitas requisições',
      details: 'Tente novamente mais tarde',
    });
  }

  // Erro de sintaxe JSON
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return res.status(400).json({
      success: false,
      error: 'JSON inválido',
    });
  }

  // Erro padrão do servidor
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Erro interno do servidor';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error,
    }),
  });
};

