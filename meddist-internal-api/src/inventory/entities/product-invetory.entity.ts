import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { Location } from '../../locations/entities/location.entity';
import { Product } from '../../products/entities/product.entity';
import { Channel } from '../../channels/entities/channel.entity';

@Entity('product_inventory')
export class ProductInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { eager: true })
  product: Product;

  @ManyToOne(() => Location, { eager: true })
  location: Location;

  @ManyToOne(() => Channel, { eager: true })
  channel: Channel;

  @Column({ type: 'int', default: 0 })
  availableStock: number;

  @Column({ type: 'int', default: 0 })
  reservedStock: number;

  @UpdateDateColumn()
  lastUpdated: Date;

  @VersionColumn()
  version: number;
}
