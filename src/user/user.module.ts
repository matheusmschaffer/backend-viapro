// backend/src/user/user.module.ts
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Importe o PrismaModule

@Module({
  imports: [PrismaModule], // Adicione PrismaModule aqui
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // Exporte o UserService caso precise injetá-lo em outros módulos
})
export class UserModule {}
