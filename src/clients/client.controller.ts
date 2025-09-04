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
  HttpCode, // Importe HttpCode e HttpStatus
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express'; // Importe Request do Express
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AuthGuard } from '@nestjs/passport'; // Ajuste o caminho
import { RolesGuard } from '../auth/roles.guard'; // Ajuste o caminho
import { Roles } from '../auth/roles.decorator'; // Ajuste o caminho
import { UserRole } from '@prisma/client'; // Importa o enum UserRole do Prisma Client

// Definição de tipo para o Request com informações do usuário, replicando a do seu VehiclesController
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    accountId: string;
    username: string;
    role: 'ADMIN' | 'GERENTE' | 'OPERADOR';
  };
}

@UseGuards(AuthGuard('jwt'), RolesGuard) // Protege todas as rotas deste controller
@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.OPERADOR) // Exemplo: ADMIN, GERENTE e OPERADOR podem criar
  async create(
    @Body() createClientDto: CreateClientDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const accountId = req.user.accountId; // Obtém o accountId do token JWT
    return this.clientService.create(accountId, createClientDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.OPERADOR) // Exemplo: ADMIN, GERENTE e OPERADOR podem listar
  async findAll(@Req() req: AuthenticatedRequest) {
    const accountId = req.user.accountId;
    return this.clientService.findAll(accountId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.OPERADOR) // Exemplo: ADMIN, GERENTE e OPERADOR podem ver detalhes
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const accountId = req.user.accountId;
    return this.clientService.findOne(id, accountId);
  }

  @Put(':id') // PUT para atualização completa ou PATCH para parcial, aqui usei PUT para simplicidade
  @Roles(UserRole.ADMIN, UserRole.GERENTE) // Exemplo: Apenas ADMIN e GERENTE podem atualizar
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const accountId = req.user.accountId;
    return this.clientService.update(id, accountId, updateClientDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN) // Exemplo: Apenas ADMIN pode deletar
  @HttpCode(HttpStatus.NO_CONTENT) // Retorna 204 No Content para exclusão bem-sucedida
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const accountId = req.user.accountId;
    await this.clientService.remove(id, accountId);
  }
}
