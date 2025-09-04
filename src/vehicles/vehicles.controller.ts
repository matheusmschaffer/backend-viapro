// backend/src/vehicles/vehicles.controller.ts
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
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CreateVehicleAssociationDto } from './dto/create-vehicle-association.dto';
import { UpdateVehicleAssociationDto } from './dto/update-vehicle-association.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

// Definição de tipo para o Request com informações do usuário
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    accountId: string;
    username: string;
    role: 'ADMIN' | 'GERENTE' | 'OPERADOR';
  };
}

@UseGuards(AuthGuard('jwt')) // Protege todas as rotas deste controlador
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  // === Criação ===

  /**
   * POST /vehicles/create-new-vehicle
   * Cria um novo veículo físico e sua primeira associação com a conta do usuário logado.
   * A placa deve ser única no sistema.
   * Role: ADMIN (exemplo)
   */
  @Post('create-new-vehicle')
  async createVehicleAndAssociation(
    @Body() createVehicleDto: CreateVehicleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Implementar RolesGuard aqui futuramente
    // if (req.user.role !== 'ADMIN') throw new ForbiddenException('Apenas ADMINs podem criar novos veículos.');
    return this.vehiclesService.createVehicleAndAssociation(
      createVehicleDto,
      req.user.accountId,
    );
  }

  /**
   * POST /vehicles/associate-existing
   * Associa um veículo físico existente a uma conta com um tipo de vínculo específico.
   * Usado para AGREGADO/TERCEIRO, ou para tentar adicionar um novo FROTA (que será validado).
   * Role: ADMIN, GERENTE
   */
  @Post('associate-existing')
  async createVehicleAssociation(
    @Body() createAssociationDto: CreateVehicleAssociationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Implementar RolesGuard aqui futuramente
    // if (req.user.role !== 'ADMIN' && req.user.role !== 'GERENTE') throw new ForbiddenException('Você não tem permissão para associar veículos.');
    return this.vehiclesService.createVehicleAssociation(
      createAssociationDto,
      req.user.accountId,
    );
  }

  // === Leitura ===

  /**
   * GET /vehicles
   * Lista todos os veículos (e suas associações) ativos para a conta do usuário logado.
   * Role: Todos
   */
  @Get()
  async findAllByAccount(@Req() req: AuthenticatedRequest) {
    return this.vehiclesService.findAllByAccount(req.user.accountId);
  }

  /**
   * GET /vehicles/:id
   * Busca um veículo específico e sua associação para a conta do usuário logado.
   * Retorna NotFound se não encontrado ou inativo para esta conta.
   * Role: Todos
   */
  @Get(':id')
  async findOneByAccount(
    @Param('id') vehicleId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.vehiclesService.findOneByAccount(vehicleId, req.user.accountId);
  }

  // === Atualização ===

  /**
   * PATCH /vehicles/:id/data
   * Atualiza os dados físicos de um veículo. Apenas o proprietário FROTA pode fazer isso.
   * Role: ADMIN (e proprietário FROTA)
   */
  @Patch(':id/data')
  async updateVehicleData(
    @Param('id') vehicleId: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Implementar RolesGuard aqui futuramente
    // if (req.user.role !== 'ADMIN') throw new ForbiddenException('Apenas ADMINs podem atualizar dados físicos de veículos.');
    return this.vehiclesService.updateVehicleData(
      vehicleId,
      req.user.accountId,
      updateVehicleDto,
    );
  }

  /**
   * PATCH /vehicles/:id/association
   * Atualiza os dados de uma associação de veículo-conta específica (tipo de vínculo, status de ativação, grupo).
   * Role: ADMIN, GERENTE
   */
  @Patch(':id/association')
  async updateVehicleAccountAssociation(
    @Param('id') vehicleId: string,
    @Body() updateAssociationDto: UpdateVehicleAssociationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Implementar RolesGuard aqui futuramente
    // if (req.user.role !== 'ADMIN' && req.user.role !== 'GERENTE') throw new ForbiddenException('Você não tem permissão para atualizar associações de veículos.');
    return this.vehiclesService.updateVehicleAccountAssociation(
      vehicleId,
      req.user.accountId,
      updateAssociationDto,
    );
  }

  // === Exclusão ===

  /**
   * DELETE /vehicles/:id/physical
   * Deleta o veículo físico e todas as suas associações. Apenas o proprietário FROTA pode fazer isso.
   * Role: ADMIN (e proprietário FROTA)
   */
  @Delete(':id/physical')
  @HttpCode(HttpStatus.NO_CONTENT) // Retorna 204 No Content para exclusão bem-sucedida
  async deleteVehicle(
    @Param('id') vehicleId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    // Implementar RolesGuard aqui futuramente
    // if (req.user.role !== 'ADMIN') throw new ForbiddenException('Apenas ADMINs podem excluir veículos fisicamente.');
    await this.vehiclesService.deleteVehicle(vehicleId, req.user.accountId);
  }

  /**
   * DELETE /vehicles/:id/association
   * Deleta uma associação específica de um veículo com uma conta.
   * Isso não deleta o veículo físico, apenas o desvincula da conta.
   * Role: ADMIN, GERENTE
   */
  @Delete(':id/association')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVehicleAccountAssociation(
    @Param('id') vehicleId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    // Implementar RolesGuard aqui futuramente
    // if (req.user.role !== 'ADMIN' && req.user.role !== 'GERENTE') throw new ForbiddenException('Você não tem permissão para desassociar veículos.');
    await this.vehiclesService.deleteVehicleAccountAssociation(
      vehicleId,
      req.user.accountId,
    );
  }
}
