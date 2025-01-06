import { IsString, IsInt } from 'class-validator';

export class ReservationDto {
  @IsString()
  productId: string;

  @IsString()
  locationId: string;

  @IsString()
  channelId: string;

  @IsInt()
  quantity: number;

  @IsString()
  transactionId: string;
}
