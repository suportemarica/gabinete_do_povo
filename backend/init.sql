-- Script de inicialização do banco de dados
-- Este arquivo é executado automaticamente quando o container PostgreSQL é criado

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar schema se não existir
CREATE SCHEMA IF NOT EXISTS public;

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';

-- Comentários sobre o banco
COMMENT ON DATABASE gabinete_do_povo IS 'Banco de dados do sistema Gabinete do Povo';

