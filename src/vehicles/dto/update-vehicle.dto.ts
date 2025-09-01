// backend/src/vehicles/dto/update-vehicle.dto.ts
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  @Matches(/^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/, {
    message: 'Formato de placa inválido. Use AAA1234 ou AAA1A23.',
  })
  plate?: string;

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
}
