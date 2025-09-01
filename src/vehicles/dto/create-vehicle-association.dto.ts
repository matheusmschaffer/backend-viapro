// backend/src/vehicles/dto/create-vehicle-association.dto.ts
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { VehicleClassification } from '@prisma/client';

export class CreateVehicleAssociationDto {
  @IsString()
  @IsNotEmpty()
  vehicleId: string; // ID do veículo físico já existente

  @IsEnum(VehicleClassification, {
    message: 'Tipo de vínculo inválido. Use FROTA, AGREGADO ou TERCEIRO.',
  })
  @IsNotEmpty()
  associationType: VehicleClassification;

  @IsString()
  @IsOptional()
  groupId?: string; // Opcional: para associar a um VehicleGroup
}
