// backend/src/vehicles/dto/create-vehicle-association.dto.ts
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { AssociationType } from '@prisma/client';

export class CreateVehicleAssociationDto {
  @IsString()
  @IsNotEmpty()
  vehicleId: string; // ID do veículo físico já existente

  @IsEnum(AssociationType, {
    message: 'Tipo de vínculo inválido. Use FROTA, AGREGADO ou TERCEIRO.',
  })
  @IsNotEmpty()
  associationType: AssociationType;

  @IsString()
  @IsOptional()
  groupId?: string; // Opcional: para associar a um VehicleGroup
}
