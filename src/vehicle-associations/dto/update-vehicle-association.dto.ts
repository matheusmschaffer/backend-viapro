import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleAssociationDto } from './create-vehicle-association.dto';

export class UpdateVehicleAssociationDto extends PartialType(
  CreateVehicleAssociationDto,
) {
  vehicleId?: never; // vehicleId não deve ser alterado aqui
}
