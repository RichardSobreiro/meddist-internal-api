import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductInventory } from './entities/product-invetory.entity';
import { InventoryLog } from './entities/invetory-log.entity';
import { StockUpdateDto } from './dto/stock-update.dto';
import { ReservationDto } from './dto/reservation.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(ProductInventory)
    private readonly inventoryRepo: Repository<ProductInventory>,
    @InjectRepository(InventoryLog)
    private readonly logRepo: Repository<InventoryLog>,
  ) {}

  async findInventory(
    productId: string,
    locationId: string,
    channelId: string,
  ): Promise<ProductInventory> {
    const inventory = await this.inventoryRepo.findOne({
      where: {
        product: { id: productId },
        location: { id: locationId },
        channel: { id: channelId },
      },
    });
    if (!inventory) {
      throw new NotFoundException('Inventory record not found');
    }
    return inventory;
  }

  async listInventories({
    page = 1,
    limit = 10,
    productName,
    locationId,
    channelId,
  }: {
    page: number;
    limit: number;
    productName?: string;
    locationId?: string;
    channelId?: string;
  }): Promise<{ data: ProductInventory[]; total: number }> {
    const queryBuilder = this.inventoryRepo
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .leftJoinAndSelect('inventory.location', 'location')
      .leftJoinAndSelect('inventory.channel', 'channel')
      .skip((page - 1) * limit)
      .take(limit);

    if (productName) {
      queryBuilder.andWhere('product.name ILIKE :productName', {
        productName: `%${productName}%`,
      });
    }

    if (locationId) {
      queryBuilder.andWhere('location.id = :locationId', { locationId });
    }

    if (channelId) {
      queryBuilder.andWhere('channel.id = :channelId', { channelId });
    }

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async listInventoryLogs({
    page = 1,
    limit = 10,
    productId,
    changeType,
    userId,
    channelId,
  }: {
    page: number;
    limit: number;
    productId?: string;
    changeType?: 'STOCK_IN' | 'STOCK_OUT' | 'RESERVE' | 'RELEASE';
    userId?: string;
    channelId?: string;
  }): Promise<{ data: InventoryLog[]; total: number }> {
    const queryBuilder = this.logRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.product', 'product')
      .leftJoinAndSelect('log.user', 'user')
      .leftJoinAndSelect('log.channel', 'channel')
      .skip((page - 1) * limit)
      .take(limit);

    if (productId) {
      queryBuilder.andWhere('product.id = :productId', { productId });
    }

    if (changeType) {
      queryBuilder.andWhere('log.changeType = :changeType', { changeType });
    }

    if (userId) {
      queryBuilder.andWhere('user.id = :userId', { userId });
    }

    if (channelId) {
      queryBuilder.andWhere('channel.id = :channelId', { channelId });
    }

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async updateStock(
    dto: StockUpdateDto,
    userId: string, // Include user information
  ): Promise<ProductInventory> {
    const inventory = await this.findInventory(
      dto.productId,
      dto.locationId,
      dto.channelId,
    );

    // Update stock for the specific channel
    if (dto.changeType === 'STOCK_IN') {
      inventory.availableStock += dto.quantity;
    } else if (dto.changeType === 'STOCK_OUT') {
      if (inventory.availableStock < dto.quantity) {
        throw new ConflictException('Insufficient stock for the operation');
      }
      inventory.availableStock -= dto.quantity;
    }

    const savedInventory = await this.inventoryRepo.save(inventory);

    // Log the operation
    await this.logRepo.save({
      product: savedInventory.product,
      channel: savedInventory.channel,
      changeType: dto.changeType,
      quantity: dto.quantity,
      reason: dto.reason,
      user: { id: userId }, // Add user reference
    });

    return savedInventory;
  }

  async reserveStock(
    dto: ReservationDto,
    userId: string, // Include user information
  ): Promise<void> {
    const inventory = await this.findInventory(
      dto.productId,
      dto.locationId,
      dto.channelId,
    );

    // Ensure enough stock is available for reservation
    if (inventory.availableStock < dto.quantity) {
      throw new ConflictException('Insufficient stock to reserve');
    }

    // Reserve stock in the specific channel
    inventory.availableStock -= dto.quantity;
    inventory.reservedStock += dto.quantity;

    await this.inventoryRepo.save(inventory);

    // Log the reservation
    await this.logRepo.save({
      product: inventory.product,
      channel: inventory.channel,
      changeType: 'RESERVE',
      quantity: dto.quantity,
      reason: `Transaction: ${dto.transactionId}`,
      user: { id: userId }, // Add user reference
    });
  }

  async releaseStock(
    dto: ReservationDto,
    userId: string, // Include user information
  ): Promise<void> {
    const inventory = await this.findInventory(
      dto.productId,
      dto.locationId,
      dto.channelId,
    );

    // Ensure there is enough reserved stock to release
    if (inventory.reservedStock < dto.quantity) {
      throw new ConflictException('Insufficient reserved stock to release');
    }

    // Release stock in the specific channel
    inventory.reservedStock -= dto.quantity;
    inventory.availableStock += dto.quantity;

    await this.inventoryRepo.save(inventory);

    // Log the release
    await this.logRepo.save({
      product: inventory.product,
      channel: inventory.channel,
      changeType: 'RELEASE',
      quantity: dto.quantity,
      reason: `Transaction: ${dto.transactionId}`,
      user: { id: userId }, // Add user reference
    });
  }
}
