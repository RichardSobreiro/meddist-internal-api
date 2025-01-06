import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ProductInventory } from '../../inventory/entities/product-invetory.entity';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // e.g., "E-commerce", "Call Center", "Shopee"

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => ProductInventory, (inventory) => inventory.channel)
  inventories: ProductInventory[];
}
