import { PartialType } from '@nestjs/mapped-types';
import { CreateDriverDto } from './create-driver.dto';
import { IsOptional, IsBoolean } from 'class-validator';

// Usamos PartialType, mas excluímos 'cpf' porque ele não deve ser alterado (é o identificador único)
export class UpdateDriverDto extends PartialType(CreateDriverDto) {
  // O CPF não deve ser atualizado.
  cpf?: never; // Torna o CPF inválido para atualização, se tentarem passar no body

  @IsOptional()
  @IsBoolean({ message: 'O campo active deve ser um booleano.' })
  active?: boolean; // Se você quiser uma flag de ativo/inativo para o driver global
}
