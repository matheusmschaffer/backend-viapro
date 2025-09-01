// backend/src/vehicles/vehicles.module.ts
import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Importe o PrismaModule

@Module({
  imports: [PrismaModule], // Adicione PrismaModule aqui
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService], // Se outros módulos precisarem usar VehiclesService
})
export class VehiclesModule {}
