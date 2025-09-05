import { Module } from '@nestjs/common';
import { DriverAccountAssociationService } from './driver-associations.service';
import { DriverAccountAssociationController } from './driver-associations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DriverAccountAssociationController],
  providers: [DriverAccountAssociationService],
  exports: [DriverAccountAssociationService], // Exportar se outros módulos precisarem injetar
})
export class DriverAssociationsModule {}
