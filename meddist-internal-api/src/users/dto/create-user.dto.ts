import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsString,
  ValidateNested,
  ArrayMinSize,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAddressInternalDto } from '@/addresses/dto/create-address-internal-dto';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Senha deve conter ao menos 8 caracteres, uma letra maiúscula, uma letra minúscula, e um caractere especial.',
    },
  )
  password: string;

  @IsNotEmpty({ message: 'Nome de usuário é obrigatório' })
  @MinLength(3, { message: 'Nome de usuário deve ter no mínimo 3 caracteres' })
  username: string;

  @IsNotEmpty({ message: 'Nome completo é obrigatório' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  telephone: string;

  @IsString()
  @IsNotEmpty({ message: 'CPF é obrigatório' })
  cpf: string;

  @ValidateNested({ each: true })
  @Type(() => CreateAddressInternalDto)
  @ArrayMinSize(1, { message: 'Pelo menos um endereço é obrigatório' })
  addresses: CreateAddressInternalDto[];
}
