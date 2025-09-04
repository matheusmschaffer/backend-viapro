import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AssociationType, DriverStatus } from '@prisma/client';

export class DriverQueryDto {
  @IsOptional()
  @IsString()
  search?: string; // Para buscar por nome, CPF, CNH, email

  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @IsOptional()
  @IsEnum(AssociationType)
  associationType?: AssociationType; // Para filtrar motoristas por tipo de associação (PROPRIETARIO, TERCEIRIZADO, LOCADO)

  @IsOptional()
  @IsString()
  associatedAccountId?: string; // Para filtrar motoristas associados a uma conta específica

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string; // Ex: 'fullName', 'cpf', 'createdAt'

  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'Sort order deve ser "asc" ou "desc".' })
  sortOrder?: 'asc' | 'desc';
}
