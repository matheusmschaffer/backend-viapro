import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  OperationalStatus,
  LogisticStatus,
  AssociationType,
} from '@prisma/client';

export class VehicleQueryDto {
  @IsOptional()
  @IsString()
  search?: string; // Para buscar por placa, marca, modelo

  @IsOptional()
  @IsEnum(OperationalStatus)
  operationalStatus?: OperationalStatus;

  @IsOptional()
  @IsEnum(LogisticStatus)
  logisticStatus?: LogisticStatus;

  @IsOptional()
  @IsString()
  driverId?: string; // Filtrar por motorista principal do veículo

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  inMaintenance?: boolean;

  // Filtros baseados na associação (serão usados no VehicleService para incluir associações)
  @IsOptional()
  @IsEnum(AssociationType)
  associationType?: AssociationType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActiveForAccount?: boolean;

  @IsOptional()
  @IsString()
  associatedAccountId?: string; // Para filtrar veículos associados a uma conta específica

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
  sortBy?: string; // Ex: 'plate', 'brand', 'createdAt'

  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'Sort order deve ser "asc" ou "desc".' })
  sortOrder?: 'asc' | 'desc';
}
