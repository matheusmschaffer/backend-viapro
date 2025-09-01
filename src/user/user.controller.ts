// backend/src/user/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

// Definição de tipo para o Request com informações do usuário autenticado
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    accountId: string;
    username: string;
    role: UserRole; // Use o ENUM importado
  };
}

@UseGuards(AuthGuard('jwt'), RolesGuard) // Protege todas as rotas deste controlador com JWT e RBAC
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * POST /users
   * Cria um novo usuário para a conta do usuário logado.
   * Apenas ADMINs e MANAGERs (para OPERATOR) podem criar usuários.
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER) // Apenas ADMINs e MANAGERs podem acessar este endpoint
  async create(
    @Body() createUserDto: CreateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.userService.createUser(
      req.user.accountId,
      req.user.role,
      createUserDto,
    );
  }

  /**
   * GET /users
   * Lista todos os usuários da conta do usuário logado.
   * Apenas ADMINs e MANAGERs podem listar todos os usuários.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findAll(@Req() req: AuthenticatedRequest) {
    return this.userService.findAllByAccount(req.user.accountId);
  }

  /**
   * GET /users/:id
   * Busca um usuário específico da conta do usuário logado.
   * ADMINs e MANAGERs podem ver qualquer usuário. OPERATORs podem ver apenas a si mesmos.
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR)
  async findOne(@Param('id') userId: string, @Req() req: AuthenticatedRequest) {
    // Se um OPERATOR tentar acessar outro usuário, nega.
    if (req.user.role === UserRole.OPERATOR && req.user.userId !== userId) {
      throw new ForbiddenException(
        'Operadores só podem visualizar seus próprios dados.',
      );
    }
    return this.userService.findOneByAccount(req.user.accountId, userId);
  }

  /**
   * PATCH /users/:id
   * Atualiza os dados de um usuário específico.
   * ADMINs podem atualizar qualquer usuário. MANAGERs podem atualizar OPERATORs. OPERATORs podem atualizar apenas a si mesmos (nome, email).
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR)
  async update(
    @Param('id') userIdToUpdate: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Se um OPERATOR tentar atualizar outro usuário, ou tentar alterar role/active.
    if (
      req.user.role === UserRole.OPERATOR &&
      req.user.userId !== userIdToUpdate
    ) {
      throw new ForbiddenException(
        'Operadores só podem atualizar seus próprios dados.',
      );
    }
    // Se o OPERATOR tentar alterar role ou active, mesmo que seja a si mesmo.
    if (
      req.user.role === UserRole.OPERATOR &&
      (updateUserDto.role !== undefined || updateUserDto.active !== undefined)
    ) {
      throw new ForbiddenException(
        'Operadores não podem alterar o papel ou status ativo de usuários (incluindo o seu próprio).',
      );
    }

    return this.userService.updateUser(
      req.user.accountId,
      userIdToUpdate,
      req.user.userId,
      req.user.role,
      updateUserDto,
    );
  }

  /**
   * DELETE /users/:id
   * Deleta um usuário específico.
   * Apenas ADMINs podem deletar ADMINs e MANAGERs. MANAGERs podem deletar apenas OPERATORs. OPERATORs não podem deletar.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async remove(
    @Param('id') userIdToDelete: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.userService.deleteUser(
      req.user.accountId,
      userIdToDelete,
      req.user.userId,
      req.user.role,
    );
  }
}
