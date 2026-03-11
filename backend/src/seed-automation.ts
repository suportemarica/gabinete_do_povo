import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAutomationData() {
  console.log('🌱 Iniciando seed dos dados de automação...');

  try {
    // Criar setores padrão
    const sectors = [
      {
        name: 'Atendimento ao Cidadão',
        description: 'Setor responsável pelo atendimento direto aos cidadãos',
        isActive: true,
      },
      {
        name: 'Protocolo e Documentação',
        description: 'Setor responsável por protocolos e documentação',
        isActive: true,
      },
      {
        name: 'Análise Técnica',
        description: 'Setor responsável pela análise técnica de solicitações',
        isActive: true,
      },
      {
        name: 'Fiscalização',
        description: 'Setor responsável por atividades de fiscalização',
        isActive: true,
      },
      {
        name: 'Administrativo',
        description: 'Setor administrativo geral',
        isActive: true,
      },
    ];

    console.log('📋 Criando setores...');
    for (const sectorData of sectors) {
      const existingSector = await prisma.sector.findUnique({
        where: { name: sectorData.name },
      });

      if (!existingSector) {
        await prisma.sector.create({
          data: sectorData,
        });
        console.log(`✅ Setor criado: ${sectorData.name}`);
      } else {
        console.log(`⚠️ Setor já existe: ${sectorData.name}`);
      }
    }

    // Criar SLAs padrão
    const slas = [
      {
        name: 'Urgente - 2 horas',
        description: 'SLA para demandas urgentes que precisam ser atendidas em até 2 horas',
        duration: 2,
        priority: 'URGENT' as const,
        isActive: true,
      },
      {
        name: 'Alta Prioridade - 24 horas',
        description: 'SLA para demandas de alta prioridade com prazo de 24 horas',
        duration: 24,
        priority: 'HIGH' as const,
        isActive: true,
      },
      {
        name: 'Média Prioridade - 72 horas',
        description: 'SLA para demandas de média prioridade com prazo de 72 horas',
        duration: 72,
        priority: 'MEDIUM' as const,
        isActive: true,
      },
      {
        name: 'Baixa Prioridade - 7 dias',
        description: 'SLA para demandas de baixa prioridade com prazo de 7 dias',
        duration: 168, // 7 dias em horas
        priority: 'LOW' as const,
        isActive: true,
      },
      {
        name: 'Rotineiro - 15 dias',
        description: 'SLA para demandas rotineiras com prazo de 15 dias',
        duration: 360, // 15 dias em horas
        priority: 'LOW' as const,
        isActive: true,
      },
    ];

    console.log('⏰ Criando SLAs...');
    for (const slaData of slas) {
      const existingSLA = await prisma.sLA.findFirst({
        where: { 
          name: slaData.name,
          duration: slaData.duration,
        },
      });

      if (!existingSLA) {
        await prisma.sLA.create({
          data: slaData,
        });
        console.log(`✅ SLA criado: ${slaData.name}`);
      } else {
        console.log(`⚠️ SLA já existe: ${slaData.name}`);
      }
    }

    // Criar regras de automação de exemplo
    console.log('🤖 Criando regras de automação de exemplo...');
    
    // Buscar um usuário para associar as regras
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('⚠️ Nenhum usuário encontrado. Criando usuário de exemplo...');
      const newUser = await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@gabinete.com',
          password: '$2b$10$example', // Senha hash de exemplo
          role: 'ADMIN',
        },
      });
      console.log(`✅ Usuário criado: ${newUser.email}`);
    }

    // Buscar setores e SLAs criados
    const createdSectors = await prisma.sector.findMany();
    const createdSLAs = await prisma.sLA.findMany();

    const exampleRules = [
        {
          name: 'Solicitação de Documento - Atendimento',
          description: 'Cria tarefa no setor de Atendimento ao Cidadão para solicitações de documentos',
          isActive: true,
          formId: null, // Será associado quando houver formulários
          sectorId: createdSectors.find(s => s.name === 'Atendimento ao Cidadão')?.id,
          slaId: createdSLAs.find(s => s.name === 'Média Prioridade - 72 horas')?.id,
          conditions: [
            {
              field: 'tipo_solicitacao',
              operator: 'equals',
              value: 'documento',
              logicalOperator: 'AND',
            },
          ],
          actions: [
            {
              type: 'CREATE_TASK',
              config: {
                title: 'Solicitação de Documento - {{nome_solicitante}}',
                description: 'Processar solicitação de documento para {{nome_solicitante}}. Tipo: {{tipo_documento}}',
                priority: 'MEDIUM',
              },
            },
            {
              type: 'SEND_NOTIFICATION',
              config: {
                notificationTitle: 'Nova Solicitação de Documento',
                notificationMessage: 'Nova solicitação de documento recebida de {{nome_solicitante}}',
                notificationType: 'INFO',
              },
            },
          ],
          priority: 10,
        },
        {
          name: 'Denúncia - Fiscalização',
          description: 'Cria tarefa no setor de Fiscalização para denúncias',
          isActive: true,
          formId: null,
          sectorId: createdSectors.find(s => s.name === 'Fiscalização')?.id,
          slaId: createdSLAs.find(s => s.name === 'Alta Prioridade - 24 horas')?.id,
          conditions: [
            {
              field: 'tipo_solicitacao',
              operator: 'equals',
              value: 'denuncia',
              logicalOperator: 'AND',
            },
          ],
          actions: [
            {
              type: 'CREATE_TASK',
              config: {
                title: 'Denúncia - {{assunto}}',
                description: 'Investigar denúncia: {{descricao_denuncia}}. Local: {{local_denuncia}}',
                priority: 'HIGH',
              },
            },
            {
              type: 'SEND_NOTIFICATION',
              config: {
                notificationTitle: 'Nova Denúncia Recebida',
                notificationMessage: 'Nova denúncia recebida: {{assunto}}',
                notificationType: 'WARNING',
              },
            },
          ],
          priority: 20,
        },
        {
          name: 'Solicitação Urgente',
          description: 'Cria tarefa urgente para solicitações marcadas como urgentes',
          isActive: true,
          formId: null,
          sectorId: createdSectors.find(s => s.name === 'Atendimento ao Cidadão')?.id,
          slaId: createdSLAs.find(s => s.name === 'Urgente - 2 horas')?.id,
          conditions: [
            {
              field: 'urgencia',
              operator: 'equals',
              value: 'alta',
              logicalOperator: 'OR',
            },
            {
              field: 'prioridade',
              operator: 'equals',
              value: 'urgente',
              logicalOperator: 'OR',
            },
          ],
          actions: [
            {
              type: 'CREATE_TASK',
              config: {
                title: 'URGENTE - {{titulo_solicitacao}}',
                description: 'Solicitação urgente: {{descricao_solicitacao}}',
                priority: 'URGENT',
              },
            },
            {
              type: 'SEND_NOTIFICATION',
              config: {
                notificationTitle: 'Solicitação Urgente',
                notificationMessage: 'Nova solicitação urgente recebida: {{titulo_solicitacao}}',
                notificationType: 'ERROR',
              },
            },
          ],
          priority: 30,
        },
      ];

    if (createdSectors.length > 0 && createdSLAs.length > 0) {
      for (const ruleData of exampleRules) {
        const existingRule = await prisma.automationRule.findFirst({
          where: { name: ruleData.name },
        });

        if (!existingRule) {
          await prisma.automationRule.create({
            data: {
              ...ruleData,
              conditions: ruleData.conditions as any,
              actions: ruleData.actions as any,
            },
          });
          console.log(`✅ Regra criada: ${ruleData.name}`);
        } else {
          console.log(`⚠️ Regra já existe: ${ruleData.name}`);
        }
      }
    }

    console.log('✅ Seed dos dados de automação concluído com sucesso!');
    console.log(`📊 Setores criados: ${createdSectors.length}`);
    console.log(`⏰ SLAs criados: ${createdSLAs.length}`);
    console.log(`🤖 Regras de exemplo criadas: ${exampleRules ? exampleRules.length : 0}`);

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar seed se chamado diretamente
if (require.main === module) {
  seedAutomationData()
    .then(() => {
      console.log('🎉 Seed concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no seed:', error);
      process.exit(1);
    });
}

export { seedAutomationData };
