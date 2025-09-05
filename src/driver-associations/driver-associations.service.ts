import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverAssociationDto } from './dto/create-driver-association.dto';
import { UpdateDriverAssociationDto } from './dto/update-driver-association.dto';
import { DriverAssociationQueryDto } from './dto/driver-association-query.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  AssociationType,
  DriverAccountAssociation,
  Driver,
  Prisma,
} from '@prisma/client';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type DriverAssociationWithDriver = Prisma.DriverAccountAssociationGetPayload<{
  include: { driver: true }; // <<<< Este 'include' DEVE ser EXATAMENTE o mesmo que você usa no findMany
}>;

@Injectable()
export class DriverAccountAssociationService {
  constructor(private prisma: PrismaService) {}

  // Centraliza a validação da regra FROTA
  private async validateFleetAssociation(
    driverId: string,
    accountId: string,
  ): Promise<void> {
    const existingFleetAssociation =
      await this.prisma.driverAccountAssociation.findFirst({
        where: {
          driverId: driverId,
          associationType: AssociationType.FROTA,
          isActive: true, // Apenas associações FROTA ativas
          NOT: {
            accountId: accountId, // Exclui a própria conta se estiver atualizando
          },
        },
        include: { account: true }, // Inclui a conta para mensagem de erro
      });

    if (existingFleetAssociation) {
      throw new ConflictException(
        `Motorista (ID: ${driverId}) já é do tipo FROTA da conta '${existingFleetAssociation.account.companyName}'. Desative esta associação antes de atribuir a outra frota.`,
      );
    }
  }

  /**
   * Adiciona ou atualiza uma associação Driver-Account.
   * Enforça a regra: um motorista só pode ser FROTA para UMA conta por vez.
   */
  async addOrUpdateAssociation(
    accountId: string,
    dto: CreateDriverAssociationDto,
  ): Promise<DriverAccountAssociation> {
    const { driverId, associationType, startDate, endDate, isActive } = dto;

    // 1. Verificar se Driver e Account existem
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
    });
    if (!driver) {
      throw new NotFoundException(
        `Motorista com ID "${driverId}" não encontrado.`,
      );
    }
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException(
        `Conta com ID "${accountId}" não encontrada.`,
      );
    }

    // 2. Aplicar a regra de negócio para FROTA
    if (associationType === AssociationType.FROTA && isActive) {
      await this.validateFleetAssociation(driverId, accountId);
    }

    // 3. Tentar encontrar uma associação ATIVA existente para o mesmo driverId e accountId
    const existingActiveAssociation =
      await this.prisma.driverAccountAssociation.findFirst({
        where: {
          driverId: driverId,
          accountId: accountId,
          isActive: true, // Busca uma associação ativa
        },
      });

    try {
      if (existingActiveAssociation) {
        // Se uma associação ATIVA já existe:
        // Caso 1: A associação existente é do mesmo tipo e ativa -> idempotente, retorna ela.
        if (
          existingActiveAssociation.associationType === associationType &&
          existingActiveAssociation.isActive === isActive
        ) {
          return existingActiveAssociation; // Não há mudança a ser feita.
        }
        // Caso 2: Se o tipo de associação ou o status 'isActive' mudaram.
        // Se a nova associação for ativa, desativa a anterior primeiro.
        // Se a anterior era FROTA e agora não é mais, essa desativação "libera" o motorista.
        if (isActive) {
          await this.prisma.driverAccountAssociation.update({
            where: { id: existingActiveAssociation.id },
            data: {
              isActive: false,
              endDate: new Date(),
              updatedAt: new Date(),
            },
          });
        }
        // Cria uma nova associação ativa.
        const newAssociation =
          await this.prisma.driverAccountAssociation.create({
            data: {
              driverId,
              accountId,
              associationType,
              startDate: new Date(startDate),
              endDate: endDate ? new Date(endDate) : null,
              isActive: isActive,
            },
          });
        return newAssociation;
      } else {
        // Se NÃO EXISTE uma associação ativa para este driver/account:
        // Cria uma nova associação
        const newAssociation =
          await this.prisma.driverAccountAssociation.create({
            data: {
              driverId,
              accountId,
              associationType,
              startDate: new Date(startDate),
              endDate: endDate ? new Date(endDate) : null,
              isActive: isActive,
            },
          });
        return newAssociation;
      }
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Se houver alguma unicidade não tratada pela lógica acima
          throw new ConflictException(
            `Já existe uma associação para este motorista e conta com o mesmo status ativo.`,
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
   * Lista as associações de motoristas para uma conta específica.
   */
  async findAllAssociationsForAccount(
    accountId: string,
    query: DriverAssociationQueryDto,
  ): Promise<PaginatedResult<DriverAssociationWithDriver>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'startDate',
      sortOrder = 'desc',
      isActive,
      associationType,
      search,
      driverId,
    } = query;
    const offset = (page - 1) * limit;

    const where: any = { accountId: accountId };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (associationType) {
      where.associationType = associationType;
    }
    if (driverId) {
      where.driverId = driverId;
    }

    if (search) {
      where.driver = {
        // Filtra por campos do motorista relacionado
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { cpf: { contains: search, mode: 'insensitive' } },
          { cnhNumber: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const associations = await this.prisma.driverAccountAssociation.findMany({
      where,
      include: { driver: true },
      take: limit,
      skip: offset,
      orderBy: {
        [sortBy.split('.')[0]]: sortOrder, // Simples, se sortBy for "startDate"
        ...(sortBy.includes('.') && {
          [sortBy.split('.')[0]]: { [sortBy.split('.')[1]]: sortOrder },
        }), // Se for "driver.fullName"
      },
    });

    const total = await this.prisma.driverAccountAssociation.count({ where });
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
  ): Promise<DriverAccountAssociation & { driver: Driver }> {
    const association = await this.prisma.driverAccountAssociation.findUnique({
      where: { id, accountId },
      include: { driver: true },
    });
    if (!association) {
      throw new NotFoundException(
        `Associação com ID "${id}" não encontrada ou não pertence à sua conta.`,
      );
    }
    return association;
  }

  /**
   * Atualiza uma associação Driver-Account específica.
   * Aplica a regra FROTA se o tipo for alterado para FROTA.
   */
  async updateAssociation(
    id: string,
    accountId: string,
    updateDto: UpdateDriverAssociationDto,
  ): Promise<DriverAccountAssociation> {
    const existingAssociation =
      await this.prisma.driverAccountAssociation.findUnique({
        where: { id, accountId },
      });

    if (!existingAssociation) {
      throw new NotFoundException(
        `Associação com ID "${id}" não encontrada ou não pertence à sua conta.`,
      );
    }

    // Se o tipo de associação está sendo alterado para FROTA ou isActive para true (e o tipo é FROTA)
    if (
      (updateDto.associationType &&
        updateDto.associationType === AssociationType.FROTA) ||
      (updateDto.isActive !== undefined &&
        updateDto.isActive === true &&
        existingAssociation.associationType === AssociationType.FROTA) ||
      (updateDto.associationType === AssociationType.FROTA &&
        updateDto.isActive === true)
    ) {
      await this.validateFleetAssociation(
        existingAssociation.driverId,
        accountId,
      );
    }

    try {
      // Se estava ativo e está sendo desativado, preencher endDate
      if (
        existingAssociation.isActive &&
        updateDto.isActive === false &&
        !updateDto.endDate
      ) {
        updateDto.endDate = new Date();
      }

      const updatedAssociation =
        await this.prisma.driverAccountAssociation.update({
          where: { id, accountId },
          data: {
            associationType: updateDto.associationType,
            startDate: updateDto.startDate
              ? new Date(updateDto.startDate)
              : undefined,
            endDate: updateDto.endDate
              ? new Date(updateDto.endDate)
              : updateDto.endDate === null
                ? null
                : undefined, // Permite limpar endDate
            isActive: updateDto.isActive,
            updatedAt: new Date(),
          },
        });
      return updatedAssociation;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Associação com ID "${id}" não encontrada ou não pertence à sua conta.`,
          );
        }
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Conflito de unicidade. Já existe uma associação ativa para este motorista e conta.`,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Inativa uma associação Driver-Account específica. Não exclui o registro, apenas desativa.
   */
  async deactivateAssociation(
    id: string,
    accountId: string,
  ): Promise<DriverAccountAssociation> {
    try {
      const association = await this.prisma.driverAccountAssociation.update({
        where: { id, accountId, isActive: true }, // Garante que a associação exista e esteja ativa
        data: { isActive: false, endDate: new Date(), updatedAt: new Date() },
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
}
