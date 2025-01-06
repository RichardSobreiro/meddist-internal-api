import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { InventoryService } from './invetory.service';
import { StockUpdateDto } from './dto/stock-update.dto';
import { ReservationDto } from './dto/reservation.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get(':productId/:locationId/:channelId')
  async findInventory(
    @Param('productId') productId: string,
    @Param('locationId') locationId: string,
    @Param('channelId') channelId: string,
  ) {
    return this.inventoryService.findInventory(
      productId,
      locationId,
      channelId,
    );
  }

  @Get()
  async listInventories(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('productName') productName?: string,
    @Query('locationId') locationId?: string,
    @Query('channelId') channelId?: string,
  ) {
    return this.inventoryService.listInventories({
      page,
      limit,
      productName,
      locationId,
      channelId,
    });
  }

  @Get('logs')
  async listInventoryLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('productId') productId?: string,
    @Query('changeType')
    changeType?: 'STOCK_IN' | 'STOCK_OUT' | 'RESERVE' | 'RELEASE',
    @Query('userId') userId?: string,
    @Query('channelId') channelId?: string,
  ) {
    return this.inventoryService.listInventoryLogs({
      page,
      limit,
      productId,
      changeType,
      userId,
      channelId,
    });
  }

  @Post('update')
  async updateStock(
    @Body() stockUpdateDto: StockUpdateDto,
    @Headers('user-id') userId: string,
  ) {
    return this.inventoryService.updateStock(stockUpdateDto, userId);
  }

  @Post('reserve')
  async reserveStock(
    @Body() reservationDto: ReservationDto,
    @Headers('user-id') userId: string,
  ) {
    return this.inventoryService.reserveStock(reservationDto, userId);
  }

  @Post('release')
  async releaseStock(
    @Body() reservationDto: ReservationDto,
    @Headers('user-id') userId: string,
  ) {
    return this.inventoryService.releaseStock(reservationDto, userId);
  }
}
