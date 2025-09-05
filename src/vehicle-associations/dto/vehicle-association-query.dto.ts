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

export class VehicleAssociationQueryDto {
  @IsOptional()
  @IsString()
  vehicleId?: string; // Filtrar associações por um ID de veículo específico

  @IsOptional()
  @IsString()
  groupId?: string; // Filtrar por grupo de veículo

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActiveForAccount?: boolean;

  @IsOptional()
  @IsEnum(AssociationType)
  associationType?: AssociationType;

  @IsOptional()
  @IsString()
  search?: string; // Para buscar por placa, marca ou modelo do veículo, via relacionamento

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
  sortBy?: string; // Ex: 'createdAt', 'vehicle.plate'

  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'Sort order deve ser "asc" ou "desc".' })
  sortOrder?: 'asc' | 'desc';
}
