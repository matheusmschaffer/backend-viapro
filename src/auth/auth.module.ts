// backend/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PassportModule } from '@nestjs/passport'; // Importe PassportModule
import { JwtModule } from '@nestjs/jwt'; // Importe JwtModule
import { ConfigModule, ConfigService } from '@nestjs/config'; // Importe ConfigService
import { JwtStrategy } from './jwt.strategy'; // Importe JwtStrategy
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { APP_GUARD } from '@nestjs/core'; // Importe APP_GUARD
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { RolesGuard } from './roles.guard'; // Importe RolesGuard

@Module({
  imports: [
    PrismaModule,
    PassportModule, // Usado para estratégias de autenticação
    ConfigModule,
    JwtModule.registerAsync({
      // Configuração assíncrona para usar ConfigService
      imports: [ConfigModule], // Importa ConfigService para usá-lo aqui
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Pega o secret do .env
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d',
        }, // Tempo de expiração
      }),
      //nject: [ConfigService], // Injeta ConfigService
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  // Você pode querer exportar AuthService e JwtModule para outros módulos, se necessário.
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
