import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { AssociationType } from '@prisma/client';

export class CreateVehicleAssociationDto {
  @IsString({ message: 'Vehicle ID deve ser uma string.' })
  vehicleId: string; // O ID do veículo a ser associado

  @IsEnum(AssociationType, { message: 'Tipo de associação inválido.' })
  associationType: AssociationType;

  @IsOptional()
  @IsString({ message: 'Group ID deve ser uma string.' })
  groupId?: string; // ID do grupo do veículo para esta associação

  @IsOptional()
  @IsBoolean({ message: 'isActiveForAccount deve ser um booleano.' })
  isActiveForAccount?: boolean = true; // Por padrão, a nova associação é ativa
}
