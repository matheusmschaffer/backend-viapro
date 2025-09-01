// backend/src/prisma/prisma.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Opcional, mas útil para serviços globais como o Prisma. Faz com que você não precise importar o PrismaModule em todo lugar.
@Module({
  providers: [PrismaService], // Fornece o PrismaService
  exports: [PrismaService],   // Exporta o PrismaService para outros módulos que o importarem
})
export class PrismaModule {}