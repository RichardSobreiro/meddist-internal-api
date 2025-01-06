import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './invetory.service';
import { InventoryController } from './inventory.controller';
import { ProductInventory } from './entities/product-invetory.entity';
import { InventoryLog } from './entities/invetory-log.entity';
import { Product } from '../products/entities/product.entity';
import { Channel } from '../channels/entities/channel.entity';
import { Location } from '../locations/entities/location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductInventory,
      InventoryLog,
      Product,
      Channel,
      Location,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
