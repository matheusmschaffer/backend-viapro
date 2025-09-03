import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException, // Adicionado para P2000
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'; // Importe do Prisma

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  async create(accountId: string, createClientDto: CreateClientDto) {
    try {
      const newClient = await this.prisma.client.create({
        data: {
          ...createClientDto,
          accountId: accountId, // Associa o cliente à conta do usuário autenticado
        },
      });
      return newClient;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Erro de violação de unicidade (unique constraint)
          const target = error.meta?.target as string | string[];

          if (Array.isArray(target)) {
            // Caso da chave composta: @@unique([accountId, name])
            if (target.includes('accountId') && target.includes('name')) {
              throw new ConflictException(
                `Já existe um cliente com o nome '${createClientDto.name}' para a sua conta.`,
              );
            }
          } else if (typeof target === 'string') {
            // Caso da chave única global: @unique email
            if (target === 'email') {
              throw new ConflictException(
                `O email '${createClientDto.email}' já está em uso por outro cliente (globalmente único).`,
              );
            }
          }
          // Fallback genérico para P2002 se nenhum caso específico foi tratado
          throw new ConflictException(
            'Um conflito de dados foi detectado (valor duplicado). Por favor, verifique os dados de entrada.',
          );
        } else if (error.code === 'P2000') {
          // Exemplo: Dados muito longos para uma coluna VARCHAR ou formato inválido
          throw new BadRequestException(
            'O valor fornecido é muito longo ou possui formato inválido para um dos campos.',
          );
        }
      }
      // Se não for um erro do Prisma que tratamos especificamente, relance o erro original.
      throw error;
    }
  }

  async findAll(accountId: string) {
    return this.prisma.client.findMany({
      where: { accountId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, accountId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id, accountId }, // Garante que o cliente pertence à conta
    });
    if (!client) {
      throw new NotFoundException(
        `Cliente com ID "${id}" não encontrado ou não pertence à sua conta.`,
      );
    }
    return client;
  }

  async update(
    id: string,
    accountId: string,
    updateClientDto: UpdateClientDto,
  ) {
    try {
      const updatedClient = await this.prisma.client.update({
        where: { id, accountId }, // Garante que o cliente pertence à conta
        data: updateClientDto,
      });
      return updatedClient;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Registro não encontrado para update (cliente não existe ou não pertence à conta)
          throw new NotFoundException(
            `Cliente com ID "${id}" não encontrado ou não pertence à sua conta.`,
          );
        }
        if (error.code === 'P2002') {
          // Erro de violação de unicidade (unique constraint)
          const target = error.meta?.target as string | string[];

          if (Array.isArray(target)) {
            // Caso da chave composta: @@unique([accountId, name])
            if (target.includes('accountId') && target.includes('name')) {
              throw new ConflictException(
                `Já existe outro cliente com o nome '${updateClientDto.name}' para a sua conta.`,
              );
            }
          } else if (typeof target === 'string') {
            // Caso da chave única global: @unique email
            if (target === 'email') {
              throw new ConflictException(
                `O email '${updateClientDto.email}' já está em uso por outro cliente (globalmente único).`,
              );
            }
          }
          // Fallback genérico para P2002 se nenhum caso específico foi tratado
          throw new ConflictException(
            'Um conflito de dados foi detectado (valor duplicado). Por favor, verifique os dados de entrada.',
          );
        } else if (error.code === 'P2000') {
          // Exemplo: Dados muito longos para uma coluna VARCHAR ou formato inválido
          throw new BadRequestException(
            'O valor fornecido é muito longo ou possui formato inválido para um dos campos.',
          );
        }
      }
      throw error;
    }
  }

  async remove(id: string, accountId: string) {
    try {
      await this.prisma.client.delete({
        where: { id, accountId }, // Garante que o cliente pertence à conta
      });
      
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Registro não encontrado para delete (cliente não existe ou não pertence à conta)
          throw new NotFoundException(
            `Cliente com ID "${id}" não encontrado ou não pertence à sua conta.`,
          );
        }
      }
      throw error;
    }
    return {message: 'Excluído'}
  }
}
