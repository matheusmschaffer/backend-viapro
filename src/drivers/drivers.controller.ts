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
import { DriverService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverQueryDto } from './dto/driver-query.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

// Definição de tipo para o Request com informações do usuário
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    accountId: string;
    username: string;
    role: 'ADMIN' | 'GERENTE' | 'OPERADOR';
  };
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('drivers')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  /**
   * POST /drivers
   * Cria um novo motorista (entidade global).
   * Requer role ADMIN.
   */
  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createDriverDto: CreateDriverDto) {
    return this.driverService.create(createDriverDto);
  }

  /**
   * GET /drivers
   * Lista todos os motoristas com opções de filtro e paginação.
   * Pode ser filtrado por accountId e associationType via query params.
   * Requer roles ADMIN, GERENTE, OPERADOR.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.OPERADOR)
  async findAll(@Query() query: DriverQueryDto) {
    return this.driverService.findAll(query);
  }

  /**
   * GET /drivers/:id
   * Busca um motorista específico pelo seu ID (UUID).
   * Requer roles ADMIN, GERENTE, OPERADOR.
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.OPERADOR)
  async findOne(@Param('id') id: string) {
    return this.driverService.findOne(id);
  }

  /**
   * PUT /drivers/:id
   * Atualiza os dados de um motorista específico pelo seu ID (UUID).
   * Requer role ADMIN, GERENTE.
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  async update(
    @Param('id') id: string,
    @Body() updateDriverDto: UpdateDriverDto,
  ) {
    return this.driverService.update(id, updateDriverDto);
  }

  /**
   * DELETE /drivers/:id
   * Exclui um motorista pelo seu ID (UUID).
   * Se houver associações ou referências em outras tabelas (Trips, Vehicles),
   * será necessário desvinculá-las ou definir onDelete no schema.prisma.
   * Requer role ADMIN.
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.driverService.remove(id);
  }
}
