import {
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
//import { Transform } from 'class-transformer';

export class CreateClientDto {
  @IsString()
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres.' })
  @MaxLength(255, { message: 'Nome não pode ter mais de 255 caracteres.' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Endereço não pode ter mais de 500 caracteres.' })
  // @Transform(({ value }) => value === '' ? undefined : value) // Transforma string vazia em undefined se quiser que seja totalmente omitido para optional
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'Pessoa de contato não pode ter mais de 255 caracteres.',
  })
  contactPerson?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido.' })
  @MaxLength(255, { message: 'Email não pode ter mais de 255 caracteres.' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Telefone não pode ter mais de 20 caracteres.' })
  phone?: string;
}
