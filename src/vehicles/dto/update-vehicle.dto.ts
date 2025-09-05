// backend/src/vehicles/dto/update-vehicle.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleDto } from './create-vehicle.dto';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  // A placa não deve ser atualizada como parte de um update parcial, mas caso fosse, seria aqui.
  // Já está no CreateVehicleDto e é validado lá.
  @IsOptional()
  @IsString()
  @MaxLength(8)
  plate?: string; // Permite atualizar a placa, se necessário
}
