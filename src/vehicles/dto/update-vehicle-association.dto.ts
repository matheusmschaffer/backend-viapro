// backend/src/vehicles/dto/update-vehicle-association.dto.ts
import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { VehicleClassification } from '@prisma/client';

export class UpdateVehicleAssociationDto {
  @IsEnum(VehicleClassification, {
    message: 'Tipo de vínculo inválido. Use FROTA, AGREGADO ou TERCEIRO.',
  })
  @IsOptional()
  associationType?: VehicleClassification;

  @IsBoolean()
  @IsOptional()
  isActiveForAccount?: boolean;

  @IsString()
  @IsOptional()
  groupId?: string | null; // Permite null para desassociar de um grupo
}
