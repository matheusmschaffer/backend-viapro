import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  //Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Query,
  Patch, // Usar PATCH para operações parciais como desativação
} from '@nestjs/common';
import { Request } from 'express';
import { DriverAccountAssociationService } from './driver-associations.service';
import { CreateDriverAssociationDto } from './dto/create-driver-association.dto';
import { UpdateDriverAssociationDto } from './dto/update-driver-association.dto';
import { DriverAssociationQueryDto } from './dto/driver-association-query.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    accountId: string;
    username: string;
    role: 'ADMIN' | 'GERENTE' | 'OPERADOR';
  };
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('driver-associations')
export class DriverAccountAssociationController {
  constructor(private readonly service: DriverAccountAssociationService) {}

  /**
   * POST /driver-associations
   * Adiciona ou atualiza uma associação de motorista para a conta logada.
   * Aplica a regra de negócio para o tipo FROTA.
   * Requer roles ADMIN, GERENTE.
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  async addOrUpdateAssociation(
    @Body() dto: CreateDriverAssociationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.addOrUpdateAssociation(req.user.accountId, dto);
  }

  /**
   * GET /driver-associations
   * Lista as associações de motoristas para a conta logada.
   * Requer roles ADMIN, GERENTE, OPERADOR.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.OPERADOR)
  async findAllAssociationsForAccount(
    @Query() query: DriverAssociationQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.findAllAssociationsForAccount(
      req.user.accountId,
      query,
    );
  }

  /**
   * GET /driver-associations/:id
   * Busca uma associação específica pelo seu ID para a conta logada.
   * Requer roles ADMIN, GERENTE, OPERADOR.
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.OPERADOR)
  async findAssociationByIdForAccount(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.findAssociationByIdForAccount(id, req.user.accountId);
  }

  /**
   * PUT /driver-associations/:id
   * Atualiza uma associação Driver-Account específica pelo seu ID.
   * Aplica a regra FROTA se o tipo for alterado para FROTA.
   * Requer roles ADMIN, GERENTE.
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  async updateAssociation(
    @Param('id') id: string,
    @Body() updateDto: UpdateDriverAssociationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.updateAssociation(id, req.user.accountId, updateDto);
  }

  /**
   * PATCH /driver-associations/:id/deactivate
   * Inativa uma associação Driver-Account específica pelo seu ID.
   * Não a exclui, apenas a marca como inativa e preenche a data de fim.
   * Requer roles ADMIN, GERENTE.
   */
  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  @HttpCode(HttpStatus.OK) // Não é 204 No Content porque retorna o objeto atualizado
  async deactivateAssociation(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.deactivateAssociation(id, req.user.accountId);
  }
}
