import { Module } from '@nestjs/common';
import { DriverService } from './drivers.service';
import { DriverController } from './drivers.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService], // Exportar se outros módulos precisarem injetar DriverService
})
export class DriversModule {}
