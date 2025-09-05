import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssociationType } from '@prisma/client';

export class DriverAssociationQueryDto {
  @IsOptional()
  @IsString()
  driverId?: string; // Filtrar associações por um ID de motorista específico

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean) // Para converter 'true'/'false' de string para boolean
  isActive?: boolean;

  @IsOptional()
  @IsEnum(AssociationType)
  associationType?: AssociationType;

  @IsOptional()
  @IsString()
  search?: string; // Para buscar por nome do motorista ou da conta, via relacionamento

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
  sortBy?: string; // Ex: 'startDate', 'driver.fullName'

  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'Sort order deve ser "asc" ou "desc".' })
  sortOrder?: 'asc' | 'desc';
}
