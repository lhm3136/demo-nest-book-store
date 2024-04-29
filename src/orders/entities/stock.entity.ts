import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Book } from '../../books/entities/book.entity';

@Entity()
export class Stock {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @OneToOne(() => Book)
  @JoinColumn({
    name: 'bookId',
  })
  book: Book;

  @Column({
    nullable: false,
  })
  @Index()
  bookId: number;

  @Column('int', {
    nullable: false,
  })
  availableQuantity: number;

  @Column('int', {
    nullable: false,
    default: 0,
  })
  frozenQuantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deletedAt: Date;
}
