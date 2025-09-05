import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config'; // Importe ConfigModule
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ClientModule } from './clients/client.module';
import { DriversModule } from './drivers/drivers.module';
import { DriverAccountAssociationService } from './driver-associations/driver-associations.service';
import { DriverAccountAssociationController } from './driver-associations/driver-associations.controller';
import { DriverAssociationsModule } from './driver-associations/driver-associations.module';
import { VehicleAssociationsModule } from './vehicle-associations/vehicle-association.module'; // Importe o VehicleAssociationsModule

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    PrismaModule,
    UserModule,
    VehiclesModule,
    ClientModule,
    DriversModule,
    DriverAssociationsModule,
    VehicleAssociationsModule,
  ],
  controllers: [AppController, DriverAccountAssociationController],
  providers: [AppService, DriverAccountAssociationService],
})
export class AppModule {}
