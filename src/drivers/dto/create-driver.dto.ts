import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsEnum,
  IsEmail,
  IsDateString,
} from 'class-validator';
import { DriverStatus } from '@prisma/client';

export class CreateDriverDto {
  @IsString({ message: 'CPF deve ser uma string.' })
  @MinLength(11, { message: 'CPF deve ter 11 caracteres.' })
  @MaxLength(11, { message: 'CPF deve ter 11 caracteres.' })
  // Você pode adicionar um regex para validação de formato de CPF aqui
  cpf: string;

  @IsString({ message: 'Nome completo deve ser uma string.' })
  @MinLength(3, { message: 'Nome completo deve ter pelo menos 3 caracteres.' })
  @MaxLength(255, {
    message: 'Nome completo não pode ter mais de 255 caracteres.',
  })
  fullName: string;

  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'Data de nascimento deve ser uma data válida no formato YYYY-MM-DD.',
    },
  )
  dateOfBirth?: Date; // Ou string se você preferir formatar no service/controller

  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string.' })
  @MaxLength(20, { message: 'Telefone não pode ter mais de 20 caracteres.' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido.' })
  @MaxLength(255, { message: 'Email não pode ter mais de 255 caracteres.' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Número da CNH deve ser uma string.' })
  @MaxLength(11, {
    message: 'Número da CNH não pode ter mais de 11 caracteres.',
  })
  cnhNumber?: string;

  @IsOptional()
  @IsString({ message: 'Categoria da CNH deve ser uma string.' })
  @MaxLength(5, {
    message: 'Categoria da CNH não pode ter mais de 5 caracteres.',
  })
  cnhCategory?: string;

  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'Validade da CNH deve ser uma data válida no formato YYYY-MM-DD.',
    },
  )
  cnhExpiration?: Date; // Ou string

  @IsOptional()
  @IsEnum(DriverStatus, {
    message: 'Status inválido. Use ATIVO, INATIVO, LICENCA ou FERIAS.',
  })
  status?: DriverStatus;
}
