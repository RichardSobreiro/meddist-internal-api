import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/user.entity';
import { Channel } from '../../channels/entities/channel.entity';

@Entity('inventory_log')
export class InventoryLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { eager: true })
  product: Product;

  @Column()
  changeType: 'STOCK_IN' | 'STOCK_OUT' | 'RESERVE' | 'RELEASE';

  @Column({ type: 'int' })
  quantity: number;

  @Column({ nullable: true })
  reason?: string;

  @CreateDateColumn()
  timestamp: Date;

  @ManyToOne(() => User, { nullable: true, eager: true })
  user?: User;

  @ManyToOne(() => Channel, { nullable: true, eager: true })
  channel?: Channel;
}
