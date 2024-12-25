// src/categories/entities/category.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Tree,
  TreeChildren,
  TreeParent,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity()
@Tree('closure-table')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @TreeChildren()
  children: Category[];

  @TreeParent()
  parent: Category;

  @ManyToMany(() => Product, (product) => product.categories)
  @JoinTable()
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
