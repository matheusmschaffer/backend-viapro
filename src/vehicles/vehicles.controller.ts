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
} from '@nestjs/common';
import { Request } from 'express';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
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
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  /**
   * POST /vehicles
   * Cria um novo veículo físico (entidade global).
   * Requer role ADMIN.
   */
  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  /**
   * GET /vehicles
   * Lista todos os veículos no sistema, com opções de filtro e paginação.
   * Requer roles ADMIN, GERENTE, OPERADOR.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.OPERADOR)
  async findAll(@Query() query: VehicleQueryDto) {
    return this.vehiclesService.findAll(query);
  }

  /**
   * GET /vehicles/:id
   * Busca um veículo específico pelo seu ID.
   * Requer roles ADMIN, GERENTE, OPERADOR.
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.OPERADOR)
  async findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  /**
   * PUT /vehicles/:id
   * Atualiza os dados físicos de um veículo.
   * Apenas o proprietário FROTA pode fazer isso.
   * Requer roles ADMIN, GERENTE.
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  async update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.vehiclesService.update(
      id,
      req.user.accountId,
      updateVehicleDto,
    );
  }

  /**
   * DELETE /vehicles/:id
   * Exclui um veículo físico.
   * Apenas o proprietário FROTA pode fazer isso, e se não houver outras associações ativas.
   * Requer role ADMIN.
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.vehiclesService.remove(id, req.user.accountId);
  }
}
