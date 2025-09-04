// backend/src/user/dto/update-user.dto.ts
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { UserRole } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types'; // Para facilitar a criação de um DTO parcial
import { CreateUserDto } from './create-user.dto';

// Herda de CreateUserDto, mas torna todos os campos opcionais.
// Removemos a validação de password aqui, pois a mudança de senha será um DTO separado.
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(3, {
    message: 'O nome de usuário deve ter pelo menos 3 caracteres.',
  })
  @MaxLength(50, {
    message: 'O nome de usuário deve ter no máximo 50 caracteres.',
  })
  username?: string;

  @IsEmail({}, { message: 'O e-mail deve ser um endereço de e-mail válido.' })
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @IsEnum(UserRole, {
    message: 'O papel (role) é inválido. Use ADMIN, GERENTE ou OPERADOR.',
  })
  @IsOptional()
  role?: UserRole;

  @IsBoolean()
  @IsOptional()
  active?: boolean; // Para ativar/desativar o usuário

  // Removemos a validação de password, pois ela não deve ser atualizada aqui
  password?: undefined;
}
