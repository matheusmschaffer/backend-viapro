// backend/src/auth/dto/login.dto.ts
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  // Regex para garantir o formato "usuario@empresa"
  @Matches(/^.+@.+$/, {
    message: 'As credenciais devem estar no formato "usuario@empresa"',
  })
  credentials: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
