import { PartialType } from '@nestjs/mapped-types'; // Importe isso
import { CreateClientDto } from './create-client.dto';

// PartialType torna todas as propriedades de CreateClientDto opcionais
// e herda todas as validações (mas como opcionais)
export class UpdateClientDto extends PartialType(CreateClientDto) {}
