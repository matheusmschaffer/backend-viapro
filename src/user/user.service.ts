// backend/src/user/user.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '@prisma/client';

import { UserOutput } from './dto/user-output.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  private mapUserToOutput(user: User): UserOutput {
    // A desestruturação usa `passwordHash` para excluí-lo do objeto `rest`.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = user;
    return rest;
  }

  /**
   * Cria um novo usuário para uma conta específica.
   * O usuário que faz a requisição (requestingUser) deve ter permissão para criar o 'role' especificado.
   */
  async createUser(
    accountId: string,
    requestingUserRole: UserRole,
    createUserDto: CreateUserDto,
  ): Promise<UserOutput> {
    const { name, username, email, password, role } = createUserDto;

    const lowerCaseUsername = username.toLowerCase();
    const lowerCaseEmail = email.toLowerCase();

    // Validação de Permissão do RequestingUser (RBAC) usando requestingUserRole
    if (requestingUserRole === UserRole.MANAGER && role !== UserRole.OPERATOR) {
      throw new ForbiddenException(
        'Gerentes só podem criar usuários com o papel OPERATOR.',
      );
    }
    if (requestingUserRole === UserRole.OPERATOR) {
      throw new ForbiddenException(
        'Operadores não podem criar novos usuários.',
      );
    }

    // Verifica unicidade do username E email dentro daquela accountId
    // Usamos OR porque queremos que username E email sejam únicos *independentemente*.
    const existingUser = await this.prisma.user.findFirst({
      where: {
        accountId: accountId,
        OR: [{ username: lowerCaseUsername }, { email: lowerCaseEmail }],
      },
    });

    if (existingUser) {
      if (existingUser.username === lowerCaseUsername) {
        throw new ConflictException(
          `O nome de usuário "${username}" já existe nesta empresa.`,
        );
      }
      if (existingUser.email === lowerCaseEmail) {
        throw new ConflictException(
          `O e-mail "${email}" já está em uso nesta empresa.`,
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        accountId: accountId,
        name,
        username: lowerCaseUsername,
        email: lowerCaseEmail,
        passwordHash: hashedPassword,
        role: role,
        active: true,
      },
    });

    return this.mapUserToOutput(newUser);
  }

  /**
   * Lista todos os usuários para uma conta específica.
   */
  async findAllByAccount(accountId: string): Promise<UserOutput[]> {
    const users = await this.prisma.user.findMany({
      where: { accountId: accountId },
    });
    return users.map((user) => this.mapUserToOutput(user));
  }

  /**
   * Busca um usuário específico dentro de uma conta.
   */
  async findOneByAccount(
    accountId: string,
    userId: string,
  ): Promise<UserOutput> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
        accountId: accountId,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `Usuário com ID ${userId} não encontrado ou não pertence à sua conta.`,
      );
    }
    return this.mapUserToOutput(user);
  }

  /**
   * Atualiza os dados de um usuário específico dentro de uma conta.
   * Considera as permissões de quem está fazendo a atualização.
   */
  async updateUser(
    accountId: string,
    userIdToUpdate: string,
    requestingUserId: string, // ID do usuário que está fazendo a requisição (usado para prevenir auto-edição)
    requestingUserRole: UserRole, // Role do usuário que está fazendo a requisição (usado para RBAC)
    updateUserDto: UpdateUserDto,
  ): Promise<UserOutput> {
    // 1. Não permitir que o usuário desative a si mesmo.
    if (userIdToUpdate === requestingUserId && updateUserDto.active === false) {
      throw new ForbiddenException(
        'Você não pode desativar sua própria conta.',
      );
    }

    // 2. Não permitir que o usuário atualize sua própria role se não for ADMIN.
    // Ou, mais genericamente, um usuário não pode aumentar seu próprio nível de privilégio.
    if (
      userIdToUpdate === requestingUserId &&
      updateUserDto.role &&
      updateUserDto.role !== requestingUserRole
    ) {
      throw new ForbiddenException(
        'Você não pode alterar seu próprio papel (role).',
      );
    }

    // 3. Obter o usuário alvo para ver sua role atual
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userIdToUpdate, accountId: accountId },
    });

    if (!targetUser) {
      throw new NotFoundException(
        `Usuário com ID ${userIdToUpdate} não encontrado ou não pertence à sua conta.`,
      );
    }

    // 4. Validação de Permissão para alterar role:
    if (updateUserDto.role) {
      // Se a role está sendo atualizada
      if (
        requestingUserRole === UserRole.MANAGER &&
        (updateUserDto.role === UserRole.ADMIN ||
          targetUser.role === UserRole.ADMIN ||
          updateUserDto.role === UserRole.MANAGER)
      ) {
        throw new ForbiddenException(
          'Gerentes só podem alterar o papel para OPERATOR, e não podem alterar usuários com papel ADMIN ou MANAGER.',
        );
      }
      if (requestingUserRole === UserRole.OPERATOR) {
        throw new ForbiddenException(
          'Operadores não podem alterar o papel de usuários.',
        );
      }
    }

    // 5. Validação de unicidade para username/email se estiverem sendo atualizados
    if (updateUserDto.username) {
      const lowerCaseUsername = updateUserDto.username.toLowerCase();
      const existingUserWithUsername = await this.prisma.user.findFirst({
        where: {
          accountId: accountId,
          username: lowerCaseUsername,
          id: { not: userIdToUpdate }, // Exclui o próprio usuário
        },
      });
      if (existingUserWithUsername) {
        throw new ConflictException(
          `O nome de usuário "${updateUserDto.username}" já existe nesta empresa.`,
        );
      }
    }

    if (updateUserDto.email) {
      const lowerCaseEmail = updateUserDto.email.toLowerCase();
      const existingUserWithEmail = await this.prisma.user.findFirst({
        where: {
          accountId: accountId,
          email: lowerCaseEmail,
          id: { not: userIdToUpdate }, // Exclui o próprio usuário
        },
      });
      if (existingUserWithEmail) {
        throw new ConflictException(
          `O e-mail "${updateUserDto.email}" já está em uso nesta empresa.`,
        );
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userIdToUpdate, accountId: accountId },
      data: {
        name: updateUserDto.name,
        username: updateUserDto.username?.toLowerCase(),
        email: updateUserDto.email?.toLowerCase(),
        role: updateUserDto.role,
        active: updateUserDto.active,
      },
    });

    return this.mapUserToOutput(updatedUser);
  }

  /**
   * Deleta um usuário específico dentro de uma conta.
   * Considera as permissões de quem está fazendo a requisição.
   */
  async deleteUser(
    accountId: string,
    userIdToDelete: string,
    requestingUserId: string, // ID do usuário que está fazendo a requisição (usado para prevenir auto-exclusão)
    requestingUserRole: UserRole, // Role do usuário que está fazendo a requisição (usado para RBAC)
  ): Promise<void> {
    // 1. Não permitir que o usuário delete a si mesmo
    if (userIdToDelete === requestingUserId) {
      throw new ForbiddenException('Você não pode excluir sua própria conta.');
    }

    // 2. Obter o usuário alvo para ver sua role
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userIdToDelete, accountId: accountId },
    });

    if (!targetUser) {
      throw new NotFoundException(
        `Usuário com ID ${userIdToDelete} não encontrado ou não pertence à sua conta.`,
      );
    }

    // 3. Validação de Permissão para deletar:
    if (
      requestingUserRole === UserRole.MANAGER &&
      (targetUser.role === UserRole.ADMIN ||
        targetUser.role === UserRole.MANAGER)
    ) {
      throw new ForbiddenException(
        'Gerentes não podem excluir usuários com papel ADMIN ou MANAGER.',
      );
    }
    if (requestingUserRole === UserRole.OPERATOR) {
      throw new ForbiddenException('Operadores não podem excluir usuários.');
    }

    // 4. Realiza a exclusão
    await this.prisma.user.delete({
      where: { id: userIdToDelete, accountId: accountId },
    });
  }
}
