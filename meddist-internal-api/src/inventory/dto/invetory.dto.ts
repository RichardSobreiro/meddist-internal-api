import { IsString, IsInt } from 'class-validator';

export class InventoryDto {
  @IsString()
  productId: string;

  @IsString()
  locationId: string;

  @IsString()
  channelId: string;

  @IsInt()
  availableStock: number;

  @IsInt()
  reservedStock: number;
}
