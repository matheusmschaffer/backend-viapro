import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Importa o PrismaModule

@Module({
  imports: [PrismaModule], // Adicione o PrismaModule aqui para que o ClientService possa injetar o PrismaService
  controllers: [ClientController],
  providers: [ClientService],
  // Não precisa exportar o serviço se ele não for usado por outros módulos fora deste
})
export class ClientModule {}