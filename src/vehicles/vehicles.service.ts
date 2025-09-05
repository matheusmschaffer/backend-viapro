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
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  Vehicle,
  Driver,
  VehicleAccountAssociation,
  Account,
} from '@prisma/client'; // Importe os tipos necessários

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cria um novo veículo físico (globalmente).
   * A placa deve ser única no sistema.
   */
  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    try {
      const newVehicle = await this.prisma.vehicle.create({
        data: {
          plate: createVehicleDto.plate.toUpperCase(),
          brand: createVehicleDto.brand,
          model: createVehicleDto.model,
          year: createVehicleDto.year,
          trackerDeviceId: createVehicleDto.trackerDeviceId,
          trackerType: createVehicleDto.trackerType,
          active: createVehicleDto.active,
          driverId: createVehicleDto.driverId,
          operationalStatus: createVehicleDto.operationalStatus,
          logisticStatus: createVehicleDto.logisticStatus,
          efficiencyKmH: createVehicleDto.efficiencyKmH,
          idleTimeMinutes: createVehicleDto.idleTimeMinutes,
          distanceToDestinationKm: createVehicleDto.distanceToDestinationKm,
          currentLocationLat: createVehicleDto.currentLocationLat,
          currentLocationLon: createVehicleDto.currentLocationLon,
          currentLocationAddress: createVehicleDto.currentLocationAddress,
          kmToday: createVehicleDto.kmToday,
          inMaintenance: createVehicleDto.inMaintenance,
        },
      });
      return newVehicle;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Unique constraint violation
          const target = error.meta?.target as string | string[];
          if (target === 'plate') {
            throw new ConflictException(
              `Veículo com a placa '${createVehicleDto.plate}' já existe no sistema.`,
            );
          }
          throw new ConflictException(
            'Um conflito de dados foi detectado (valor duplicado). Por favor, verifique os dados de entrada.',
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
   * Lista todos os veículos no sistema, com opções de filtro e paginação.
   * Pode incluir associações para filtragem avançada.
   */
  async findAll(query: VehicleQueryDto): Promise<
    PaginatedResult<
      Vehicle & {
        accountAssociations?: (VehicleAccountAssociation & {
          account: Account;
        })[];
        driver?: Driver;
      }
    >
  > {
    const {
      page = 1,
      limit = 10,
      sortBy = 'plate',
      sortOrder = 'asc',
      search,
      operationalStatus,
      logisticStatus,
      driverId,
      inMaintenance,
      associationType,
      isActiveForAccount,
      associatedAccountId,
    } = query;
    const offset = (page - 1) * limit;

    const where: any = {};
    const include: any = {
      driver: true, // Inclui os dados do motorista principal
      accountAssociations: {
        include: {
          account: true,
        },
        // Onde para associations
        where: {
          ...(isActiveForAccount !== undefined && {
            isActiveForAccount: isActiveForAccount,
          }),
          ...(associationType && { associationType: associationType }),
          ...(associatedAccountId && { accountId: associatedAccountId }),
        },
      },
    };

    if (search) {
      where.OR = [
        { plate: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (operationalStatus) {
      where.operationalStatus = operationalStatus;
    }
    if (logisticStatus) {
      where.logisticStatus = logisticStatus;
    }
    if (driverId) {
      where.driverId = driverId;
    }
    if (inMaintenance !== undefined) {
      where.inMaintenance = inMaintenance;
    }

    // Se houver filtros específicos de associação que não são cobertos pelo `include.accountAssociations.where` acima
    // (Ex: Se quiser buscar veículos que *não* tenham um certo tipo de associação)
    // Isso pode se tornar complexo e talvez seja melhor no serviço de associações.
    // Por enquanto, o include.where filtra o que é retornado, mas o `where` principal filtra o veículo raiz.
    if (
      (associationType ||
        isActiveForAccount !== undefined ||
        associatedAccountId) &&
      !where.accountAssociations
    ) {
      // Se a query pede um filtro na associação mas não na inclusão principal
      // Aqui, garantimos que o filtro de associação influencie o veículo raiz
      where.accountAssociations = {
        some: {
          // 'some' porque o veículo pode ter múltiplas associações
          ...(isActiveForAccount !== undefined && {
            isActiveForAccount: isActiveForAccount,
          }),
          ...(associationType && { associationType: associationType }),
          ...(associatedAccountId && { accountId: associatedAccountId }),
        },
      };
    }

    const vehicles = await this.prisma.vehicle.findMany({
      where,
      include,
      take: limit,
      skip: offset,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    const total = await this.prisma.vehicle.count({ where });
    const totalPages = Math.ceil(total / limit);

    return {
      data: vehicles,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Busca um veículo específico pelo seu ID.
   */
  async findOne(id: string): Promise<
    Vehicle & {
      accountAssociations?: (VehicleAccountAssociation & {
        account: Account;
      })[];
      driver?: Driver;
    }
  > {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        driver: true,
        accountAssociations: {
          include: { account: true },
        },
      },
    });
    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID "${id}" não encontrado.`);
    }
    return vehicle;
  }

  /**
   * Atualiza os dados físicos de um veículo.
   * Apenas o proprietário FROTA pode fazer isso (lógica transferida para cá do antigo service).
   */
  async update(
    vehicleId: string,
    accountId: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    // 1. Verificar se o veículo existe
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException(
        `Veículo com ID "${vehicleId}" não encontrado.`,
      );
    }

    // 2. Verificar permissão baseada na associação FROTA
    const frotaAssociation =
      await this.prisma.vehicleAccountAssociation.findFirst({
        where: {
          vehicleId: vehicleId,
          associationType: 'FROTA',
          isActiveForAccount: true,
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
      // Se NÃO existe um proprietário FROTA ativo, qualquer conta com uma associação ativa pode editar.
      // ATENÇÃO: Esta regra pode levar a inconsistências se múltiplas contas (AGREGADO/TERCEIRO)
      // tentarem editar os mesmos dados (especialmente a placa) simultaneamente.
      // Em produção, considere um mecanismo de bloqueio otimista ou notificação.
      console.warn(
        `AVISO: Veículo ${vehicleId} está sendo editado por uma conta não-FROTA (${accountId}). Sem proprietário FROTA, a edição é compartilhada, o que pode gerar inconsistências de dados se não for gerenciado externamente.`,
      );
    }

    // 5. Permite a atualização dos dados físicos do veículo
    try {
      const updatedVehicle = await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          plate: updateVehicleDto.plate?.toUpperCase(),
          brand: updateVehicleDto.brand,
          model: updateVehicleDto.model,
          year: updateVehicleDto.year,
          trackerDeviceId: updateVehicleDto.trackerDeviceId,
          trackerType: updateVehicleDto.trackerType,
          active: updateVehicleDto.active,
          driverId: updateVehicleDto.driverId,
          operationalStatus: updateVehicleDto.operationalStatus,
          logisticStatus: updateVehicleDto.logisticStatus,
          efficiencyKmH: updateVehicleDto.efficiencyKmH,
          idleTimeMinutes: updateVehicleDto.idleTimeMinutes,
          distanceToDestinationKm: updateVehicleDto.distanceToDestinationKm,
          currentLocationLat: updateVehicleDto.currentLocationLat,
          currentLocationLon: updateVehicleDto.currentLocationLon,
          currentLocationAddress: updateVehicleDto.currentLocationAddress,
          kmToday: updateVehicleDto.kmToday,
          inMaintenance: updateVehicleDto.inMaintenance,
          updatedAt: new Date(),
        },
      });
      return updatedVehicle;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Veículo com ID "${vehicleId}" não encontrado.`,
          );
        }
        if (error.code === 'P2002') {
          throw new ConflictException(
            `A placa '${updateVehicleDto.plate}' já está em uso por outro veículo.`,
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
   * Deleta o veículo físico e todas as suas associações.
   * Apenas o proprietário FROTA pode fazer isso, e se não houver outras associações ativas.
   */
  async remove(vehicleId: string, accountId: string): Promise<void> {
    // 1. Verificar se a conta logada é a proprietária 'FROTA' (FIXO)
    const frotaAssociation =
      await this.prisma.vehicleAccountAssociation.findUnique({
        where: {
          vehicleId_accountId: {
            vehicleId: vehicleId,
            accountId: accountId,
          },
          associationType: 'FROTA',
          isActiveForAccount: true, // Apenas se a associação FROTA está ativa
        },
      });

    if (!frotaAssociation) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir este veículo. Apenas o proprietário FROTA ativo pode.',
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
    try {
      await this.prisma.vehicle.delete({
        where: { id: vehicleId },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Veículo com ID "${vehicleId}" não encontrado.`,
          );
        }
        if (error.code === 'P2003') {
          // Foreign key constraint failed (e.g., if there are current trips or positions)
          throw new BadRequestException(
            `Não é possível excluir o veículo com ID "${vehicleId}" porque ele possui dados vinculados (ex: viagens, posições). Desvincule-o primeiro.`,
          );
        }
      }
      throw error;
    }
  }
}
