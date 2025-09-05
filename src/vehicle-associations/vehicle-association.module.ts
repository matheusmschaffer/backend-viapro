import { Module } from '@nestjs/common';
import { VehicleAccountAssociationService } from './vehicle-association.service';
import { VehicleAccountAssociationController } from './vehicle-association.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VehicleAccountAssociationController],
  providers: [VehicleAccountAssociationService],
  exports: [VehicleAccountAssociationService], // Exportar se outros módulos precisarem injetar
})
export class VehicleAssociationsModule {}
