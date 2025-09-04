// backend/src/vehicles/dto/update-vehicle-association.dto.ts
import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { AssociationType } from '@prisma/client';

export class UpdateVehicleAssociationDto {
  @IsEnum(AssociationType, {
    message: 'Tipo de vínculo inválido. Use FROTA, AGREGADO ou TERCEIRO.',
  })
  @IsOptional()
  associationType?: AssociationType;

  @IsBoolean()
  @IsOptional()
  isActiveForAccount?: boolean;

  @IsString()
  @IsOptional()
  groupId?: string | null; // Permite null para desassociar de um grupo
}
