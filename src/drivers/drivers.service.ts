import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverQueryDto } from './dto/driver-query.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Driver, DriverAccountAssociation, Account } from '@prisma/client'; // Importe os tipos necessários

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class DriverService {
  constructor(private prisma: PrismaService) {}

  async create(createDriverDto: CreateDriverDto): Promise<Driver> {
    try {
      const newDriver = await this.prisma.driver.create({
        data: {
          cpf: createDriverDto.cpf,
          fullName: createDriverDto.fullName,
          dateOfBirth: createDriverDto.dateOfBirth
            ? new Date(createDriverDto.dateOfBirth)
            : undefined,
          phone: createDriverDto.phone,
          email: createDriverDto.email,
          cnhNumber: createDriverDto.cnhNumber,
          cnhCategory: createDriverDto.cnhCategory,
          cnhExpiration: createDriverDto.cnhExpiration
            ? new Date(createDriverDto.cnhExpiration)
            : undefined,
          status: createDriverDto.status,
        },
      });
      return newDriver;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string | string[];
          if (target === 'cpf') {
            throw new ConflictException(
              `O CPF '${createDriverDto.cpf}' já está cadastrado para outro motorista.`,
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

  async findAll(query: DriverQueryDto): Promise<
    PaginatedResult<
      Driver & {
        accountAssociations?: (DriverAccountAssociation & {
          account: Account;
        })[];
      }
    >
  > {
    const {
      page = 1,
      limit = 10,
      sortBy = 'fullName',
      sortOrder = 'asc',
      search,
      status,
      associationType,
      associatedAccountId,
    } = query;
    const offset = (page - 1) * limit;

    const where: any = {};
    const include: any = {
      accountAssociations: {
        include: {
          account: true,
        },
        where: { isActive: true }, // Apenas associações ativas
      },
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search, mode: 'insensitive' } },
        { cnhNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (associationType || associatedAccountId) {
      where.accountAssociations = {
        some: {
          isActive: true,
          ...(associationType && { associationType }),
          ...(associatedAccountId && { accountId: associatedAccountId }),
        },
      };
    }

    const drivers = await this.prisma.driver.findMany({
      where,
      include,
      take: limit,
      skip: offset,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    const total = await this.prisma.driver.count({ where });
    const totalPages = Math.ceil(total / limit);

    return {
      data: drivers,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<
    Driver & {
      accountAssociations?: (DriverAccountAssociation & { account: Account })[];
    }
  > {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        accountAssociations: {
          include: {
            account: true,
          },
          where: { isActive: true }, // Apenas associações ativas
        },
      },
    });
    if (!driver) {
      throw new NotFoundException(`Motorista com ID "${id}" não encontrado.`);
    }
    return driver;
  }

  async update(id: string, updateDriverDto: UpdateDriverDto): Promise<Driver> {
    try {
      const updatedDriver = await this.prisma.driver.update({
        where: { id },
        data: {
          fullName: updateDriverDto.fullName,
          dateOfBirth: updateDriverDto.dateOfBirth
            ? new Date(updateDriverDto.dateOfBirth)
            : undefined,
          phone: updateDriverDto.phone,
          email: updateDriverDto.email,
          cnhNumber: updateDriverDto.cnhNumber,
          cnhCategory: updateDriverDto.cnhCategory,
          cnhExpiration: updateDriverDto.cnhExpiration
            ? new Date(updateDriverDto.cnhExpiration)
            : undefined,
          status: updateDriverDto.status,
          updatedAt: new Date(),
        },
      });
      return updatedDriver;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Motorista com ID "${id}" não encontrado.`,
          );
        }
        if (error.code === 'P2002') {
          const target = error.meta?.target as string | string[];
          if (target === 'cpf') {
            // Embora o CPF não seja atualizável via DTO, é um erro se tentar por fora.
            throw new ConflictException(
              `O CPF '${(updateDriverDto as any).cpf}' já está cadastrado para outro motorista.`,
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

  async remove(id: string): Promise<void> {
    try {
      // Optamos por soft delete (desativar) se a funcionalidade 'active' for implementada no Driver.
      // Se não, o delete real é feito aqui.
      // Neste exemplo, faremos um soft delete ou delete, dependendo do que for mais adequado
      // Em muitos casos, é preferível desativar um motorista do que excluí-lo permanentemente,
      // especialmente se ele tiver histórico de viagens ou associações.
      const driver = await this.prisma.driver.findUnique({ where: { id } });
      if (!driver) {
        throw new NotFoundException(`Motorista com ID "${id}" não encontrado.`);
      }

      // Se Driver tivesse um campo 'isActive', faríamos:
      // await this.prisma.driver.update({ where: { id }, data: { active: false } });

      // Como não tem campo 'active' no Driver, mas tem no DriverAccountAssociation,
      // uma opção é inativar todas as associações ativas.
      await this.prisma.driverAccountAssociation.updateMany({
        where: { driverId: id, isActive: true },
        data: { isActive: false, endDate: new Date() },
      });

      // Se a intenção é DELETAR O REGISTRO DO MOTORISTA, cuidado com as FKs.
      // Para este cenário, dado o contexto, vamos permitir a exclusão direta (cascateamento nas relações).
      // Mas se houver Trips ou Vehicles referenciando, terá que definir onDelete no Prisma.
      await this.prisma.driver.delete({ where: { id } });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Motorista com ID "${id}" não encontrado.`,
          );
        }
        // P2003: Foreign key constraint failed (se houver trips ou vehicles associados)
        if (error.code === 'P2003') {
          throw new BadRequestException(
            `Não é possível excluir o motorista com ID "${id}" porque ele possui associações ativas ou viagens/veículos vinculados. Desative as associações e desvincule-o primeiro.`,
          );
        }
      }
      throw error;
    }
  }
}
