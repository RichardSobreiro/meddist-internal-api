import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  price: number;

  @IsNumber()
  quantity: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images: ProductImageDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => String)
  categories: string[];
}
