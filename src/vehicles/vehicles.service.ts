// backend/src/vehicles/vehicles.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CreateVehicleAssociationDto } from './dto/create-vehicle-association.dto';
import { UpdateVehicleAssociationDto } from './dto/update-vehicle-association.dto';
import { AssociationType } from '@prisma/client'; // Importe o ENUM

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cria um novo veículo físico e sua primeira associação com a conta do usuário logado.
   * A placa deve ser única no sistema.
   * O tipo de vínculo pode ser FROTA, AGREGADO ou TERCEIRO.
   */
  async createVehicleAndAssociation(
    createVehicleDto: CreateVehicleDto,
    accountId: string,
  ) {
    const { plate, associationType, groupId, ...vehicleData } =
      createVehicleDto;

    // A validação de que a placa é única no sistema para o veículo físico ainda é essencial.
    const existingVehicle = await this.prisma.vehicle.findUnique({
      where: { plate: plate.toUpperCase() },
    });
    if (existingVehicle) {
      throw new ConflictException(
        `Veículo com a placa ${plate} já existe no sistema.`,
      );
    }

    return this.prisma.$transaction(async (prisma) => {
      const newVehicle = await prisma.vehicle.create({
        data: {
          plate: plate.toUpperCase(), // Armazena placas em maiúsculas para consistência
          ...vehicleData,
        },
      });

      // Validação extra se groupId foi fornecido
      if (groupId) {
        const groupExists = await prisma.vehicleGroup.findUnique({
          where: { id: groupId, accountId: accountId }, // Certifica que o grupo pertence à conta
        });
        if (!groupExists) {
          throw new NotFoundException(
            `Grupo com ID ${groupId} não encontrado ou não pertence à sua conta.`,
          );
        }
      }

      // Se o tipo de associação for FROTA, a DB constraint `uix_one_frota_per_vehicle` vai garantir a unicidade global.
      // Se já existir um FROTA para este veículo, a transação falhará aqui.
      await prisma.vehicleAccountAssociation.create({
        data: {
          vehicleId: newVehicle.id,
          accountId: accountId,
          associationType: associationType, // Agora permite qualquer tipo
          isActiveForAccount: true,
          groupId: groupId,
        },
      });

      return newVehicle; // Retorna o veículo criado
    });
  }

  /**
   * Associa um veículo físico existente a uma conta com um tipo de vínculo específico.
   * Usado para AGREGADO/TERCEIRO ou para uma nova associação FROTA (que falhará se já houver uma).
   */
  async createVehicleAssociation(
    createAssociationDto: CreateVehicleAssociationDto,
    accountId: string,
  ) {
    const { vehicleId, associationType, groupId } = createAssociationDto;

    // 1. Verifica se o veículo físico existe
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException(
        `Veículo com ID ${vehicleId} não encontrado.`,
      );
    }

    // 2. Verifica se já existe uma associação deste veículo com esta conta
    const existingAssociation =
      await this.prisma.vehicleAccountAssociation.findUnique({
        where: {
          vehicleId_accountId: {
            vehicleId: vehicleId,
            accountId: accountId,
          },
        },
      });

    if (existingAssociation) {
      throw new ConflictException(
        `Veículo com ID ${vehicleId} já está associado à sua conta como ${existingAssociation.associationType}. Use a rota de atualização.`,
      );
    }

    // 3. Validações específicas para associationType
    if (associationType === AssociationType.FROTA) {
      // Se tentar adicionar um novo vínculo FROTA, a DB constraint `uix_one_frota_per_vehicle` já vai pegar
      // Mas podemos dar uma mensagem mais amigável
      const existingFrota =
        await this.prisma.vehicleAccountAssociation.findFirst({
          where: {
            vehicleId: vehicleId,
            associationType: AssociationType.FROTA,
          },
        });
      if (existingFrota) {
        throw new ConflictException(
          `Veículo com ID ${vehicleId} já possui um vínculo FROTA (FIXO) com a conta ${existingFrota.accountId}.`,
        );
      }
    }

    // 4. Validação extra se groupId foi fornecido
    if (groupId) {
      const groupExists = await this.prisma.vehicleGroup.findUnique({
        where: { id: groupId, accountId: accountId },
      });
      if (!groupExists) {
        throw new NotFoundException(
          `Grupo com ID ${groupId} não encontrado ou não pertence à sua conta.`,
        );
      }
    }

    // 5. Cria a nova associação
    return this.prisma.vehicleAccountAssociation.create({
      data: {
        vehicleId: vehicleId,
        accountId: accountId,
        associationType: associationType,
        isActiveForAccount: true, // Por padrão, ativa
        groupId: groupId,
      },
      include: { vehicle: true }, // Inclui os dados do veículo associado
    });
  }

  /**
   * Lista todos os veículos (e suas associações) ativos para uma conta específica.
   */
  async findAllByAccount(accountId: string) {
    return this.prisma.vehicleAccountAssociation.findMany({
      where: {
        accountId: accountId,
        isActiveForAccount: true, // Apenas veículos ativos para esta conta
      },
      include: {
        vehicle: true, // Inclui os dados físicos do veículo
        group: true, // Inclui os dados do grupo, se houver
      },
    });
  }

  /**
   * Busca um veículo específico e sua associação para uma conta.
   * Retorna null se não encontrado ou inativo para esta conta.
   */
  async findOneByAccount(vehicleId: string, accountId: string) {
    const association = await this.prisma.vehicleAccountAssociation.findUnique({
      where: {
        vehicleId_accountId: {
          vehicleId: vehicleId,
          accountId: accountId,
        },
        isActiveForAccount: true, // Apenas se estiver ativo para esta conta
      },
      include: {
        vehicle: true,
        group: true,
      },
    });

    if (!association) {
      throw new NotFoundException(
        `Veículo com ID ${vehicleId} não encontrado ou não ativo para sua conta.`,
      );
    }
    return association;
  }

  /**
   * Atualiza os dados físicos de um veículo. Apenas o proprietário FROTA pode fazer isso.
   */
  async updateVehicleData(
    vehicleId: string,
    accountId: string,
    updateVehicleDto: UpdateVehicleDto,
  ) {
    // 1. Verificar se o veículo existe
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException(
        `Veículo com ID ${vehicleId} não encontrado.`,
      );
    }

    // 2. Verificar se existe uma associação FROTA para este veículo (de qualquer conta)
    const frotaAssociation =
      await this.prisma.vehicleAccountAssociation.findFirst({
        where: {
          vehicleId: vehicleId,
          associationType: AssociationType.FROTA,
        },
      });

    // 3. Obter a associação do veículo com a conta logada
    const userAccountAssociation =
      await this.prisma.vehicleAccountAssociation.findUnique({
        where: {
          vehicleId_accountId: {
            vehicleId: vehicleId,
            accountId: accountId,
          },
        },
      });

    // Se a conta do usuário logado não tem NENHUMA associação com este veículo, não pode editar.
    if (!userAccountAssociation) {
      throw new ForbiddenException(
        'Você não possui nenhum vínculo com este veículo para editá-lo.',
      );
    }

    // 4. Lógica de permissão de edição
    if (frotaAssociation) {
      // Se existe um proprietário FROTA, apenas ele pode editar os dados físicos.
      if (frotaAssociation.accountId !== accountId) {
        throw new ForbiddenException(
          'Apenas o proprietário FROTA deste veículo pode editar seus dados físicos.',
        );
      }
    } else {
      // Se NÃO existe um proprietário FROTA, qualquer conta com uma associação pode editar.
      // ATENÇÃO: Esta regra pode levar a inconsistências se múltiplas contas (AGREGADO/TERCEIRO)
      // tentarem editar os mesmos dados (especialmente a placa) simultaneamente.
      // Considere adicionar um mecanismo de bloqueio otimista ou notificação em um ambiente de produção.
      console.warn(
        `AVISO: Veículo ${vehicleId} está sendo editado por uma conta não-FROTA (${accountId}). Sem proprietário FROTA, a edição é compartilhada, o que pode gerar inconsistências de dados se não for gerenciado externamente.`,
      );
    }

    // 5. Permite a atualização dos dados físicos do veículo
    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        plate: updateVehicleDto.plate?.toUpperCase(), // Garante maiúsculas para a placa
        ...updateVehicleDto,
      },
    });
  }

  /**
   * Atualiza os dados de uma associação de veículo-conta específica.
   */
  async updateVehicleAccountAssociation(
    vehicleId: string,
    accountId: string,
    updateAssociationDto: UpdateVehicleAssociationDto,
  ) {
    // 1. Verifica se a associação existe
    const association = await this.prisma.vehicleAccountAssociation.findUnique({
      where: {
        vehicleId_accountId: {
          vehicleId: vehicleId,
          accountId: accountId,
        },
      },
    });

    if (!association) {
      throw new NotFoundException(
        `Associação do veículo ${vehicleId} com sua conta não encontrada.`,
      );
    }

    // 2. Validações para mudança de associationType para FROTA
    if (
      updateAssociationDto.associationType === AssociationType.FROTA &&
      association.associationType !== AssociationType.FROTA
    ) {
      // Se está tentando mudar para FROTA e não era FROTA antes
      const existingFrota =
        await this.prisma.vehicleAccountAssociation.findFirst({
          where: {
            vehicleId: vehicleId,
            associationType: AssociationType.FROTA,
          },
        });
      if (existingFrota) {
        throw new ConflictException(
          `Veículo com ID ${vehicleId} já possui um vínculo FROTA (FIXO) com a conta ${existingFrota.accountId}. Não é possível ter dois FROTA.`,
        );
      }
    }

    // 3. Validação extra se groupId foi fornecido (ou removido)
    if (updateAssociationDto.groupId !== undefined) {
      // Check if groupId is explicitly provided
      if (updateAssociationDto.groupId !== null) {
        // If it's not null (meaning user wants to assign a group)
        const groupExists = await this.prisma.vehicleGroup.findUnique({
          where: { id: updateAssociationDto.groupId, accountId: accountId },
        });
        if (!groupExists) {
          throw new NotFoundException(
            `Grupo com ID ${updateAssociationDto.groupId} não encontrado ou não pertence à sua conta.`,
          );
        }
      }
      // If groupId is null, it means the user wants to remove the vehicle from any group
    }

    // 4. Atualiza a associação
    return this.prisma.vehicleAccountAssociation.update({
      where: {
        vehicleId_accountId: {
          vehicleId: vehicleId,
          accountId: accountId,
        },
      },
      data: updateAssociationDto,
      include: { vehicle: true, group: true },
    });
  }

  /**
   * Deleta o veículo físico e todas as suas associações.
   * Apenas o proprietário FROTA pode fazer isso.
   */
  async deleteVehicle(vehicleId: string, accountId: string) {
    // 1. Verificar se a conta logada é a proprietária 'FROTA' (FIXO)
    const frotaAssociation =
      await this.prisma.vehicleAccountAssociation.findUnique({
        where: {
          vehicleId_accountId: {
            vehicleId: vehicleId,
            accountId: accountId,
          },
          associationType: AssociationType.FROTA,
        },
      });

    if (!frotaAssociation) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir este veículo. Apenas o proprietário FROTA pode.',
      );
    }

    // 2. Verificar se o veículo ainda está ativo para OUTRAS contas (AGREGADO/TERCEIRO)
    const otherActiveAssociations =
      await this.prisma.vehicleAccountAssociation.findMany({
        where: {
          vehicleId: vehicleId,
          accountId: { not: accountId }, // Excluir a própria conta FROTA
          isActiveForAccount: true,
        },
      });

    if (otherActiveAssociations.length > 0) {
      throw new ForbiddenException(
        'Este veículo não pode ser excluído, pois ainda está em uso ativo por outras empresas. Desative-o para todas as outras associações primeiro.',
      );
    }

    // 3. Se não houver outras associações ativas, permite a exclusão física do veículo.
    // As associações na tabela 'vehicle_account_associations' serão deletadas em cascata
    // devido à foreign key ON DELETE CASCADE que já configuramos no SQL do DB.
    return this.prisma.vehicle.delete({
      where: { id: vehicleId },
    });
  }

  /**
   * Deleta uma associação específica de um veículo com uma conta.
   * Isso não deleta o veículo físico, apenas o desvincula da conta.
   * Qualquer usuário da conta pode fazer isso.
   */
  async deleteVehicleAccountAssociation(vehicleId: string, accountId: string) {
    const association = await this.prisma.vehicleAccountAssociation.findUnique({
      where: {
        vehicleId_accountId: {
          vehicleId: vehicleId,
          accountId: accountId,
        },
      },
    });

    if (!association) {
      throw new NotFoundException(
        `Associação do veículo ${vehicleId} com sua conta não encontrada.`,
      );
    }

    // Não permite que o vínculo FROTA seja apenas "desassociado" se não for o único
    // O FROTA deve ser tratado via deleteVehicle para o veículo físico
    if (association.associationType === AssociationType.FROTA) {
      const totalAssociations =
        await this.prisma.vehicleAccountAssociation.count({
          where: { vehicleId: vehicleId },
        });
      if (totalAssociations > 1) {
        // Se houver outras associações (AGREGADO/TERCEIRO)
        throw new ForbiddenException(
          'Não é possível desassociar um vínculo FROTA (FIXO) se o veículo ainda estiver associado a outras contas. Considere a exclusão total do veículo se ele não será mais usado por ninguém.',
        );
      }
      // Se for a única associação e FROTA, a exclusão da associação implica na exclusão do veículo físico
      // Para isso, chame deleteVehicle.
      throw new BadRequestException(
        'Para remover o veículo FROTA, utilize a rota de exclusão de veículo físico.',
      );
    }

    return this.prisma.vehicleAccountAssociation.delete({
      where: {
        vehicleId_accountId: {
          vehicleId: vehicleId,
          accountId: accountId,
        },
      },
    });
  }

  // Helper para buscar grupos por accountId
  async getVehicleGroupById(groupId: string, accountId: string) {
    return this.prisma.vehicleGroup.findUnique({
      where: { id: groupId, accountId: accountId },
    });
  }
}
