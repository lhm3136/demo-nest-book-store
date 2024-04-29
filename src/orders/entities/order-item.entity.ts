import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Book } from '../../books/entities/book.entity';
import { Order } from './order.entity';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order)
  @JoinColumn({
    name: 'orderId',
  })
  order: Order;

  @Column('uuid', {
    nullable: false,
  })
  orderId: string;

  @ManyToOne(() => Book)
  @JoinColumn({
    name: 'bookId',
  })
  book: Book;

  @Column({
    nullable: false,
  })
  bookId: number;

  @Column('int', {
    nullable: false,
  })
  quantity: number;

  @Column('decimal', {
    nullable: false,
  })
  price: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deletedAt: Date;
}
