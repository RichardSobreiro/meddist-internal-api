import { IsString, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Address } from '../../addresses/entities/address.entity';

export class CreateLocationDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  capacity: number;

  @ValidateNested()
  @Type(() => Address)
  address: Address;
}
