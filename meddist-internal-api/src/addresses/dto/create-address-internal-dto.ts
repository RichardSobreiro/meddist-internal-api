import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateAddressInternalDto {
  @IsString()
  @IsNotEmpty({ message: 'CEP é obrigatório' })
  cep: string;

  @IsString()
  @IsNotEmpty({ message: 'Endereço é obrigatório' })
  address: string;

  @IsString()
  @IsNotEmpty({ message: 'Número é obrigatório' })
  number: string;

  @IsString()
  @IsOptional()
  complement?: string;

  @IsString()
  @IsNotEmpty({ message: 'Bairro é obrigatório' })
  neighborhood: string;

  @IsString()
  @IsNotEmpty({ message: 'Cidade é obrigatória' })
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'Estado é obrigatório' })
  state: string;
}
