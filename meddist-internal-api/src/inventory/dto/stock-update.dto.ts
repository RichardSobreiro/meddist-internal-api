import { IsString, IsInt } from 'class-validator';

export class StockUpdateDto {
  @IsString()
  productId: string;

  @IsString()
  locationId: string;

  @IsString()
  channelId: string;

  @IsInt()
  quantity: number;

  @IsString()
  changeType: 'STOCK_IN' | 'STOCK_OUT';

  @IsString()
  reason?: string;
}
