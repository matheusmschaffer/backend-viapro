import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsEnum,
  IsNumber,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OperationalStatus, LogisticStatus } from '@prisma/client';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  @MinLength(7)
  @Matches(/^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/, {
    message: 'Formato de placa inválido. Use AAA1234 ou AAA1A23.',
  })
  plate: string; // Ex: ABC1234 (Mercosul) ou ABC-1234 (Antiga)

  @IsOptional()
  @IsString({ message: 'A marca deve ser uma string.' })
  @MaxLength(50, { message: 'A marca não pode ter mais de 50 caracteres.' })
  brand?: string;

  @IsOptional()
  @IsString({ message: 'O modelo deve ser uma string.' })
  @MaxLength(100, { message: 'O modelo não pode ter mais de 100 caracteres.' })
  model?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O ano deve ser um número inteiro.' })
  @Min(1900, { message: 'O ano mínimo permitido é 1900.' })
  @Max(new Date().getFullYear() + 1, {
    message: 'O ano máximo permitido é o ano atual + 1.',
  })
  year?: number;

  @IsOptional()
  @IsString({ message: 'O ID do dispositivo rastreador deve ser uma string.' })
  @MaxLength(100, {
    message:
      'O ID do dispositivo rastreador não pode ter mais de 100 caracteres.',
  })
  trackerDeviceId?: string;

  @IsOptional()
  @IsString({ message: 'O tipo do rastreador deve ser uma string.' })
  @MaxLength(50, {
    message: 'O tipo do rastreador não pode ter mais de 50 caracteres.',
  })
  trackerType?: string;

  @IsOptional()
  @IsBoolean({ message: 'O status ativo deve ser um booleano.' })
  active?: boolean; // Se o veículo está ativo no sistema globalmente

  @IsOptional()
  @IsString({ message: 'O ID do motorista principal deve ser uma string.' })
  driverId?: string; // ID do motorista principal para este veículo

  @IsOptional()
  @IsEnum(OperationalStatus, { message: 'Status operacional inválido.' })
  operationalStatus?: OperationalStatus;

  @IsOptional()
  @IsEnum(LogisticStatus, { message: 'Status logístico inválido.' })
  logisticStatus?: LogisticStatus;

  @IsOptional()
  @IsNumber({}, { message: 'Eficiência Km/h deve ser um número.' })
  efficiencyKmH?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Tempo ocioso deve ser um número inteiro.' })
  @Min(0, { message: 'Tempo ocioso não pode ser negativo.' })
  idleTimeMinutes?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Distância até o destino deve ser um número.' })
  distanceToDestinationKm?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Latitude deve ser um número.' })
  currentLocationLat?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Longitude deve ser um número.' })
  currentLocationLon?: number;

  @IsOptional()
  @IsString({ message: 'Endereço da localização atual deve ser uma string.' })
  currentLocationAddress?: string;

  // lastLocationUpdateAt é gerado internamente ou atualizado por um webhook, não via DTO de criação
  // currentTripId e currentTrip são gerados/gerenciados internamente

  @IsOptional()
  @IsNumber({}, { message: 'Km hoje deve ser um número.' })
  @Min(0, { message: 'Km hoje não pode ser negativo.' })
  kmToday?: number;

  @IsOptional()
  @IsBoolean({ message: 'Em manutenção deve ser um booleano.' })
  inMaintenance?: boolean;
}
