// backend/src/auth/dto/register.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  companyCode: string; // NOVO: O código único da empresa para registro

  @IsEmail() // O email do usuário que será o ADMIN inicial
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string;

  @IsString()
  @IsNotEmpty()
  username: string; // NOVO: O nome de usuário para o ADMIN inicial

  @IsString()
  @IsNotEmpty()
  name: string; // Nome completo do usuário
}
