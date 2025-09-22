import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário administrador
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gabinete.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@gabinete.com',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Usuário administrador criado:', admin.email);

  // Criar usuário de teste
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@gabinete.com' },
    update: {},
    create: {
      name: 'Usuário Teste',
      email: 'user@gabinete.com',
      password: userPassword,
      role: 'USER',
      isActive: true,
    },
  });

  console.log('✅ Usuário de teste criado:', user.email);

  // Criar configuração de sincronização para o usuário
  const syncConfig = await prisma.syncConfig.upsert({
    where: { id: 'default-sync-config' },
    update: {},
    create: {
      id: 'default-sync-config',
      userId: user.id,
      apiEndpoint: 'http://localhost:3001/api',
      apiKey: 'test-api-key',
      autoSync: true,
      syncInterval: 30,
      isActive: true,
    },
  });

  console.log('✅ Configuração de sincronização criada');

  // Criar formulários de exemplo
  const form1 = await prisma.form.create({
    data: {
      externalId: 'form-001',
      title: 'Formulário de Atendimento',
      description: 'Formulário para registro de atendimentos ao cidadão',
      status: 'ACTIVE',
      category: 'Atendimento',
      instructions: 'Preencha todos os campos obrigatórios',
      userId: user.id,
    },
  });

  const form2 = await prisma.form.create({
    data: {
      externalId: 'form-002',
      title: 'Solicitação de Serviços',
      description: 'Formulário para solicitação de serviços públicos',
      status: 'ACTIVE',
      category: 'Serviços',
      instructions: 'Descreva detalhadamente sua solicitação',
      userId: user.id,
    },
  });

  console.log('✅ Formulários de exemplo criados');

  // Criar perguntas para o formulário 1
  await prisma.formQuestion.createMany({
    data: [
      {
        formId: form1.id,
        externalId: 'q1',
        title: 'Nome completo',
        description: 'Digite seu nome completo',
        type: 'TEXT',
        required: true,
        order: 1,
      },
      {
        formId: form1.id,
        externalId: 'q2',
        title: 'Email',
        description: 'Digite seu email para contato',
        type: 'EMAIL',
        required: true,
        order: 2,
      },
      {
        formId: form1.id,
        externalId: 'q3',
        title: 'Tipo de atendimento',
        description: 'Selecione o tipo de atendimento',
        type: 'SELECT',
        required: true,
        order: 3,
        options: {
          options: [
            { value: 'duvida', label: 'Dúvida' },
            { value: 'reclamacao', label: 'Reclamação' },
            { value: 'sugestao', label: 'Sugestão' },
            { value: 'elogio', label: 'Elogio' },
          ],
        },
      },
      {
        formId: form1.id,
        externalId: 'q4',
        title: 'Descrição do atendimento',
        description: 'Descreva detalhadamente sua solicitação',
        type: 'TEXTAREA',
        required: true,
        order: 4,
      },
    ],
  });

  // Criar perguntas para o formulário 2
  await prisma.formQuestion.createMany({
    data: [
      {
        formId: form2.id,
        externalId: 'q1',
        title: 'Nome completo',
        description: 'Digite seu nome completo',
        type: 'TEXT',
        required: true,
        order: 1,
      },
      {
        formId: form2.id,
        externalId: 'q2',
        title: 'CPF',
        description: 'Digite seu CPF',
        type: 'TEXT',
        required: true,
        order: 2,
        validation: {
          pattern: '^[0-9]{3}\\.[0-9]{3}\\.[0-9]{3}-[0-9]{2}$',
          message: 'CPF deve estar no formato 000.000.000-00',
        },
      },
      {
        formId: form2.id,
        externalId: 'q3',
        title: 'Serviço solicitado',
        description: 'Selecione o serviço que deseja solicitar',
        type: 'RADIO',
        required: true,
        order: 3,
        options: {
          options: [
            { value: 'licenca', label: 'Licença de Funcionamento' },
            { value: 'alvara', label: 'Alvará de Funcionamento' },
            { value: 'certidao', label: 'Certidão Negativa' },
            { value: 'outro', label: 'Outro' },
          ],
        },
      },
      {
        formId: form2.id,
        externalId: 'q4',
        title: 'Observações',
        description: 'Informações adicionais',
        type: 'TEXTAREA',
        required: false,
        order: 4,
      },
    ],
  });

  console.log('✅ Perguntas dos formulários criadas');

  // Criar respostas de exemplo
  await prisma.formResponse.createMany({
    data: [
      {
        formId: form1.id,
        answers: {
          q1: 'João Silva',
          q2: 'joao@email.com',
          q3: 'duvida',
          q4: 'Gostaria de saber sobre o horário de funcionamento da prefeitura.',
        },
      },
      {
        formId: form1.id,
        answers: {
          q1: 'Maria Santos',
          q2: 'maria@email.com',
          q3: 'reclamacao',
          q4: 'O atendimento está muito lento, preciso de mais agilidade.',
        },
      },
      {
        formId: form2.id,
        answers: {
          q1: 'Pedro Oliveira',
          q2: 'pedro@email.com',
          q3: 'licenca',
          q4: 'Preciso de uma licença para abrir meu comércio.',
        },
      },
    ],
  });

  console.log('✅ Respostas de exemplo criadas');

  // Criar tarefas de exemplo
  await prisma.task.createMany({
    data: [
      {
        formId: form1.id,
        title: 'Analisar dúvida sobre horário de funcionamento',
        description: 'Responder ao cidadão sobre o horário de funcionamento da prefeitura',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        userId: user.id,
      },
      {
        formId: form1.id,
        title: 'Investigar reclamação sobre lentidão no atendimento',
        description: 'Analisar e propor melhorias para o atendimento',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 horas
        userId: user.id,
      },
      {
        formId: form2.id,
        title: 'Processar solicitação de licença de funcionamento',
        description: 'Analisar documentação e processar licença',
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 horas
        userId: user.id,
      },
    ],
  });

  console.log('✅ Tarefas de exemplo criadas');

  // Criar notificações de exemplo
  await prisma.notification.createMany({
    data: [
      {
        title: 'Bem-vindo ao Gabinete do Povo',
        message: 'Sistema configurado com sucesso! Você pode começar a usar todas as funcionalidades.',
        type: 'SUCCESS',
        userId: user.id,
      },
      {
        title: 'Nova resposta recebida',
        message: 'Você recebeu uma nova resposta no formulário "Formulário de Atendimento"',
        type: 'INFO',
        userId: user.id,
      },
      {
        title: 'Tarefa pendente',
        message: 'Você tem 3 tarefas pendentes que precisam de atenção',
        type: 'WARNING',
        userId: user.id,
      },
      {
        title: 'Sincronização automática ativada',
        message: 'A sincronização automática foi ativada e funcionará a cada 30 minutos',
        type: 'INFO',
        userId: null, // Notificação global
      },
    ],
  });

  console.log('✅ Notificações de exemplo criadas');

  console.log('🎉 Seed concluído com sucesso!');
  console.log('\n📋 Dados criados:');
  console.log('- 2 usuários (admin e user)');
  console.log('- 1 configuração de sincronização');
  console.log('- 2 formulários com perguntas');
  console.log('- 3 respostas de exemplo');
  console.log('- 3 tarefas de exemplo');
  console.log('- 4 notificações de exemplo');
  console.log('\n🔑 Credenciais de acesso:');
  console.log('Admin: admin@gabinete.com / admin123');
  console.log('User: user@gabinete.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

