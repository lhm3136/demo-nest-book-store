import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Category } from './category.entity';

@Entity()
export class Book {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    length: 255,
    nullable: false,
  })
  @Index()
  title: string;

  @ManyToOne(() => Category)
  @JoinColumn({
    name: 'categoryId',
  })
  category: Category;

  @Column({
    nullable: false,
  })
  @Index()
  categoryId: number;

  @Column('varchar', {
    length: 255,
    nullable: false,
    default: 'anonymous',
  })
  @Index()
  author: string;

  @Column('varchar', {
    nullable: true,
  })
  description?: string;

  @Column('decimal', {
    precision: 8,
    scale: 2,
    nullable: false,
    default: 0,
  })
  price: number;

  @Column('double', {
    nullable: false,
    default: 0,
  })
  rating: number;

  @Column({
    nullable: true,
  })
  iconUrl?: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deletedAt?: Date;
}
