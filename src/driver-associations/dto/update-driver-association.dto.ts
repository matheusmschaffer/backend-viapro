import { PartialType } from '@nestjs/mapped-types';
import { CreateDriverAssociationDto } from './create-driver-association.dto';
//import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateDriverAssociationDto extends PartialType(
  CreateDriverAssociationDto,
) {
  // DriverId e accountId não devem ser alterados via update de associação
  driverId?: never;
  // associationType pode ser alterado, mas com a validação da regra FROTA
  // startDate, endDate, isActive podem ser alterados
}
