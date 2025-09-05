import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Query,
  Patch,
} from '@nestjs/common';
import { Request } from 'express';
import { VehicleAccountAssociationService } from './vehicle-association.service';
import { CreateVehicleAssociationDto } from './dto/create-vehicle-association.dto';
import { UpdateVehicleAssociationDto } from './dto/update-vehicle-association.dto';
import { VehicleAssociationQueryDto } from './dto/vehicle-association-query.dto';
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
@Controller('vehicle-associations')
export class VehicleAccountAssociationController {
  constructor(private readonly service: VehicleAccountAssociationService) {}

  /**
   * POST /vehicle-associations
   * Adiciona ou atualiza uma associação de veículo para a conta logada.
   * Aplica a regra de negócio para o tipo FROTA.
   * Requer roles ADMIN, GERENTE.
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  async addOrUpdateAssociation(
    @Body() dto: CreateVehicleAssociationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.addOrUpdateAssociation(req.user.accountId, dto);
  }

  /**
   * GET /vehicle-associations
   * Lista as associações de veículos para a conta logada.
   * Requer roles ADMIN, GERENTE, OPERADOR.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.OPERADOR)
  async findAllAssociationsForAccount(
    @Query() query: VehicleAssociationQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.findAllAssociationsForAccount(
      req.user.accountId,
      query,
    );
  }

  /**
   * GET /vehicle-associations/:id
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
   * PUT /vehicle-associations/:id
   * Atualiza uma associação Vehicle-Account específica pelo seu ID.
   * Aplica a regra FROTA se o tipo for alterado para FROTA.
   * Requer roles ADMIN, GERENTE.
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  async updateAssociation(
    @Param('id') id: string,
    @Body() updateDto: UpdateVehicleAssociationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.updateAssociation(id, req.user.accountId, updateDto);
  }

  /**
   * PATCH /vehicle-associations/:id/deactivate
   * Inativa uma associação Vehicle-Account específica pelo seu ID.
   * Não a exclui, apenas a marca como inativa.
   * Requer roles ADMIN, GERENTE.
   */
  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  @HttpCode(HttpStatus.OK)
  async deactivateAssociation(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.deactivateAssociation(id, req.user.accountId);
  }

  /**
   * DELETE /vehicle-associations/:id
   * Deleta uma associação específica de um veículo com uma conta.
   * Não permite deletar uma associação FROTA se houver outras associações.
   * Requer role ADMIN.
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAssociation(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.service.removeAssociation(id, req.user.accountId);
  }
}
