import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { AssociationType } from '@prisma/client';

export class CreateDriverAssociationDto {
  @IsString({ message: 'Driver ID deve ser uma string (UUID).' })
  driverId: string; // O ID (UUID) do motorista a ser associado

  @IsEnum(AssociationType, { message: 'Tipo de associação inválido.' })
  associationType: AssociationType;

  @IsDateString({}, { message: 'Data de início deve ser uma data válida.' })
  startDate: Date; // Usar Date diretamente ou String e converter no service

  @IsOptional()
  @IsDateString({}, { message: 'Data de fim deve ser uma data válida.' })
  endDate?: Date;

  @IsOptional()
  @IsBoolean({ message: 'isActive deve ser um booleano.' })
  isActive?: boolean = true; // Por padrão, a nova associação é ativa
}
