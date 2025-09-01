// backend/src/user/dto/create-user.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { UserRole } from '@prisma/client'; // Importe o ENUM UserRole do Prisma

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'O nome de usuário é obrigatório.' })
  @MinLength(3, {
    message: 'O nome de usuário deve ter pelo menos 3 caracteres.',
  })
  @MaxLength(50, {
    message: 'O nome de usuário deve ter no máximo 50 caracteres.',
  })
  username: string;

  @IsEmail({}, { message: 'O e-mail deve ser um endereço de e-mail válido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres.' })
  @MaxLength(255)
  password: string;

  @IsEnum(UserRole, {
    message: 'O papel (role) é inválido. Use ADMIN, MANAGER ou OPERATOR.',
  })
  @IsNotEmpty({ message: 'O papel (role) é obrigatório.' })
  role: UserRole; // ADMIN, MANAGER, OPERATOR
}
