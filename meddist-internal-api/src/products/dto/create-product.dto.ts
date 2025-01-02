import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

class ProductImageDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  url: string;

  @IsOptional()
  isPrimary?: boolean;

  @IsOptional()
  isListImage?: boolean;

  @IsOptional()
  @IsNumber()
  position?: number;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  brand: string;

  @IsNumber()
  @IsNotEmpty({ message: 'O preço é obrigatório' })
  @Transform(({ value }) => parseFloat(value.replace(',', '.')))
  @Min(0, { message: 'O preço deve ser maior ou igual a 0' })
  price: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  imagesMetadata: ProductImageDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => String)
  categories: string[];
}
