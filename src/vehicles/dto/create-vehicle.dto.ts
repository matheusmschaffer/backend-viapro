// backend/src/vehicles/dto/create-vehicle.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { AssociationType } from '@prisma/client'; // Importe o ENUM do Prisma

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/, {
    message: 'Formato de placa inválido. Use AAA1234 ou AAA1A23.',
  })
  plate: string; // Ex: ABC1234 (Mercosul) ou ABC-1234 (Antiga)

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsInt()
  @IsOptional()
  @Min(1900) // Ano mínimo razoável
  @Max(new Date().getFullYear() + 1) // Ano máximo (considerando modelos futuros)
  year?: number;

  @IsString()
  @IsOptional()
  trackerDeviceId?: string;

  @IsString()
  @IsOptional()
  trackerType?: string;

  // Para a associação inicial, geralmente será 'FROTA'
  @IsEnum(AssociationType, {
    message: 'Tipo de vínculo inválido. Use FROTA, AGREGADO ou TERCEIRO.',
  })
  @IsNotEmpty()
  associationType: AssociationType;

  @IsString()
  @IsOptional()
  groupId?: string; // Opcional: para associar a um VehicleGroup no momento da criação
}
