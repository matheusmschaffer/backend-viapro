import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleAssociationDto } from './dto/create-vehicle-association.dto';
import { UpdateVehicleAssociationDto } from './dto/update-vehicle-association.dto';
import { VehicleAssociationQueryDto } from './dto/vehicle-association-query.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
// Certifique-se de que esses imports estão corretos, com os nomes dos enums em PT
import {
  AssociationType,
  VehicleAccountAssociation,
  Vehicle,
  Account,
  VehicleGroup,
  Prisma,
} from '@prisma/client';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type VehicleAssociationWithRelations =
  Prisma.VehicleAccountAssociationGetPayload<{
    include: { vehicle: true; group: true; account: true };
  }>;

@Injectable()
export class VehicleAccountAssociationService {
  constructor(private prisma: PrismaService) {}

  // Centraliza a validação da regra FROTA
  private async validateFleetAssociation(
    vehicleId: string,
    accountId: string,
    currentAssociationId?: string,
  ): Promise<void> {
    const existingFleetAssociation =
      await this.prisma.vehicleAccountAssociation.findFirst({
        where: {
          vehicleId: vehicleId,
          associationType: AssociationType.FROTA, // Usando o enum corrigido
          isActiveForAccount: true, // Apenas associações FROTA ativas
          NOT: currentAssociationId ? { id: currentAssociationId } : undefined, // Exclui a associação que está sendo atualizada
        },
        include: { account: true }, // <--- CORRIGIDO: Incluindo a relação 'account'
      });

    if (existingFleetAssociation) {
      // Agora existingFleetAssociation.account existe e pode ser acessado
      throw new ConflictException(
        `Veículo (ID: ${vehicleId}) já é do tipo FROTA da conta '${existingFleetAssociation.account.companyName}'. Desative esta associação antes de atribuir a outra frota.`,
      );
    }
  }

  /**
   * Adiciona uma nova associação Vehicle-Account.
   * Aplica a regra: um veículo só pode ser FROTA para UMA conta por vez.
   * Se já existe uma associação ativa para esta conta/veículo, atualiza-a.
   */
  async addOrUpdateAssociation(
    accountId: string,
    dto: CreateVehicleAssociationDto,
  ): Promise<VehicleAssociationWithRelations> {
    // <--- CORRIGIDO: Tipo de retorno atualizado
    const { vehicleId, associationType, groupId, isActiveForAccount } = dto;

    // 1. Verificar se Vehicle existe
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException(
        `Veículo com ID "${vehicleId}" não encontrado.`,
      );
    }

    // 2. Verificar se o grupo existe e pertence à conta
    if (groupId) {
      const groupExists = await this.prisma.vehicleGroup.findUnique({
        where: { id: groupId, accountId: accountId },
      });
      if (!groupExists) {
        throw new NotFoundException(
          `Grupo com ID "${groupId}" não encontrado ou não pertence à sua conta.`,
        );
      }
    }

    // 3. Aplicar a regra de negócio para FROTA
    if (associationType === AssociationType.FROTA && isActiveForAccount) {
      await this.validateFleetAssociation(vehicleId, accountId);
    }

    // 4. Tentar encontrar uma associação ATIVA ou INATIVA existente para o mesmo vehicleId e accountId
    const existingAssociation =
      await this.prisma.vehicleAccountAssociation.findUnique({
        where: {
          // A sintaxe da where clause para @@unique é ligeiramente diferente se não for PK
          // Mas como agora 'id' é a PK, a busca por vehicleId_accountId é via @@unique
          vehicleId_accountId: {
            // Este é o nome do 'field reference' para a restrição @@unique
            vehicleId: vehicleId,
            accountId: accountId,
          },
        },
        include: { vehicle: true, group: true, account: true }, // <--- CORRIGIDO: Incluindo as relações
      });

    try {
      if (existingAssociation) {
        // Se a associação já existe, atualiza-a
        // Note que o `id` da associação existente é usado aqui,
        // que é a PK após a correção do schema
        return this.prisma.vehicleAccountAssociation.update({
          where: { id: existingAssociation.id },
          data: {
            associationType: associationType,
            groupId: groupId,
            isActiveForAccount: isActiveForAccount,
            updatedAt: new Date(),
          },
          include: { vehicle: true, group: true, account: true }, // <--- CORRIGIDO: Incluindo as relações
        });
      } else {
        // Se a associação não existe, cria-a
        return this.prisma.vehicleAccountAssociation.create({
          data: {
            vehicleId: vehicleId,
            accountId: accountId,
            associationType: associationType,
            groupId: groupId,
            isActiveForAccount: isActiveForAccount,
          },
          include: { vehicle: true, group: true, account: true }, // <--- CORRIGIDO: Incluindo as relações
        });
      }
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Unique constraint violation (ex: se vehicleId_accountId for duplicado)
          throw new ConflictException(
            `Já existe uma associação ativa para este veículo e conta.`,
          );
        } else if (error.code === 'P2000') {
          throw new BadRequestException(
            'O valor fornecido é muito longo ou possui formato inválido para um dos campos.',
          );
        }
      }
      throw error;
    }
  }

  /**
   * Lista as associações de veículos para uma conta específica.
   */
  async findAllAssociationsForAccount(
    accountId: string,
    query: VehicleAssociationQueryDto,
  ): Promise<PaginatedResult<VehicleAssociationWithRelations>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActiveForAccount,
      associationType,
      groupId,
      search,
      vehicleId,
    } = query;
    const offset = (page - 1) * limit;

    const where: any = { accountId: accountId };
    //const include: any = { vehicle: true, group: true, account: true }; // <--- CORRIGIDO: `account: true` incluído aqui

    if (isActiveForAccount !== undefined) {
      where.isActiveForAccount = isActiveForAccount;
    }
    if (associationType) {
      where.associationType = associationType;
    }
    if (groupId) {
      where.groupId = groupId;
    }
    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (search) {
      where.vehicle = {
        // Filtra por campos do veículo relacionado
        OR: [
          { plate: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const associations = await this.prisma.vehicleAccountAssociation.findMany({
      where,
      include: { vehicle: true, group: true, account: true },
      take: limit,
      skip: offset,
      orderBy: {
        [sortBy.split('.')[0]]: sortOrder,
        ...(sortBy.includes('.') && {
          [sortBy.split('.')[0]]: { [sortBy.split('.')[1]]: sortOrder },
        }),
      },
    });

    const total = await this.prisma.vehicleAccountAssociation.count({ where });
    const totalPages = Math.ceil(total / limit);

    return {
      data: associations,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Busca uma associação específica pelo seu ID para uma dada conta.
   */
  async findAssociationByIdForAccount(
    id: string,
    accountId: string,
  ): Promise<
    VehicleAccountAssociation & {
      vehicle: Vehicle;
      group: VehicleGroup;
      account: Account;
    }
  > {
    const association = await this.prisma.vehicleAccountAssociation.findUnique({
      where: { id, accountId }, // Agora 'id' é a PK, e 'accountId' filtra pela segurança
      include: { vehicle: true, group: true, account: true }, // <--- CORRIGIDO: `account: true` incluído aqui
    });
    if (!association) {
      throw new NotFoundException(
        `Associação com ID "${id}" não encontrada ou não pertence à sua conta.`,
      );
    }
    return association;
  }

  /**
   * Atualiza uma associação Vehicle-Account específica.
   * Aplica a regra FROTA se o tipo for alterado para FROTA.
   */
  async updateAssociation(
    id: string,
    accountId: string,
    updateDto: UpdateVehicleAssociationDto,
  ): Promise<
    VehicleAccountAssociation & {
      vehicle: Vehicle;
      group: VehicleGroup;
      account: Account;
    }
  > {
    // <--- CORRIGIDO: Tipo de retorno atualizado
    const existingAssociation =
      await this.prisma.vehicleAccountAssociation.findUnique({
        where: { id, accountId },
        include: { vehicle: true, group: true, account: true }, // <--- CORRIGIDO: Incluindo as relações
      });

    if (!existingAssociation) {
      throw new NotFoundException(
        `Associação com ID "${id}" não encontrada ou não pertence à sua conta.`,
      );
    }

    // Verificar se o grupo existe e pertence à conta, se groupId for fornecido
    if (updateDto.groupId !== undefined && updateDto.groupId !== null) {
      const groupExists = await this.prisma.vehicleGroup.findUnique({
        where: { id: updateDto.groupId, accountId: accountId },
      });
      if (!groupExists) {
        throw new NotFoundException(
          `Grupo com ID "${updateDto.groupId}" não encontrado ou não pertence à sua conta.`,
        );
      }
    }

    // Se o tipo de associação está sendo alterado para FROTA ou isActive para true (e o tipo é FROTA)
    if (
      (updateDto.associationType &&
        updateDto.associationType === AssociationType.FROTA) ||
      (updateDto.isActiveForAccount !== undefined &&
        updateDto.isActiveForAccount === true &&
        existingAssociation.associationType === AssociationType.FROTA)
    ) {
      await this.validateFleetAssociation(
        existingAssociation.vehicleId,
        accountId,
        existingAssociation.id,
      );
    }

    try {
      const updatedAssociation =
        await this.prisma.vehicleAccountAssociation.update({
          where: { id, accountId },
          data: {
            associationType: updateDto.associationType,
            groupId: updateDto.groupId,
            isActiveForAccount: updateDto.isActiveForAccount,
            updatedAt: new Date(),
          },
          include: { vehicle: true, group: true, account: true }, // <--- CORRIGIDO: Incluindo as relações
        });
      return updatedAssociation;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Associação com ID "${id}" não encontrada ou não pertence à sua conta.`,
          );
        }
        // O erro P2002 aqui pode ocorrer se a lógica de validação de FROTA não for suficiente e a unique constraint do DB for violada.
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Conflito de unicidade. Já existe uma associação ativa do tipo FROTA para este veículo em outra conta.`,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Inativa uma associação Vehicle-Account específica.
   * Não exclui o registro, apenas desativa e marca como inativa.
   */
  async deactivateAssociation(
    id: string,
    accountId: string,
  ): Promise<
    VehicleAccountAssociation & {
      vehicle: Vehicle;
      group: VehicleGroup;
      account: Account;
    }
  > {
    // <--- CORRIGIDO: Tipo de retorno atualizado
    try {
      const association = await this.prisma.vehicleAccountAssociation.update({
        where: { id, accountId, isActiveForAccount: true }, // Garante que a associação exista e esteja ativa
        data: { isActiveForAccount: false, updatedAt: new Date() },
        include: { vehicle: true, group: true, account: true }, // <--- CORRIGIDO: Incluindo as relações
      });
      return association;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // No record found for update
          throw new NotFoundException(
            `Associação ativa com ID "${id}" não encontrada ou não pertence à sua conta.`,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Deleta uma associação específica de um veículo com uma conta.
   * NÃO permite deletar uma associação FROTA se houver outras associações.
   * Requer role ADMIN.
   */
  async removeAssociation(id: string, accountId: string): Promise<void> {
    const association = await this.prisma.vehicleAccountAssociation.findUnique({
      where: { id, accountId },
    });

    if (!association) {
      throw new NotFoundException(
        `Associação com ID "${id}" não encontrada ou não pertence à sua conta.`,
      );
    }

    // Não permite que o vínculo FROTA seja apenas "desassociado" se não for o único
    // O FROTA deve ser tratado via deleteVehicle na entidade Vehicle
    if (association.associationType === AssociationType.FROTA) {
      // Usando o enum
      const totalAssociations =
        await this.prisma.vehicleAccountAssociation.count({
          where: { vehicleId: association.vehicleId },
        });
      if (totalAssociations > 1) {
        // Se houver outras associações (AGREGADO/TERCEIRO)
        throw new ForbiddenException(
          'Não é possível desassociar um vínculo FROTA se o veículo ainda estiver associado a outras contas. Considere a exclusão total do veículo na rota /vehicles/:id se ele não será mais usado por ninguém.',
        );
      }
      // Se for a única associação e FROTA, a exclusão da associação implica na exclusão do veículo físico
      throw new BadRequestException(
        'Para remover o veículo FROTA, utilize a rota de exclusão de veículo físico (/vehicles/:id).',
      );
    }

    try {
      await this.prisma.vehicleAccountAssociation.delete({
        where: { id, accountId },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Associação com ID "${id}" não encontrada ou não pertence à sua conta.`,
          );
        }
      }
      throw error;
    }
  }
}
