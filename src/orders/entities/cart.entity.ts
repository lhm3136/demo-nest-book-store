import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { Book } from '../../books/entities/book.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Cart {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Book)
  @JoinColumn({
    name: 'bookId',
  })
  book: Book;

  @Column({
    nullable: false,
  })
  bookId: number;

  @ManyToOne(() => User)
  @JoinColumn({
    name: 'userId',
  })
  user: User;

  @Column('uuid', {
    nullable: false,
  })
  @Index()
  userId: string;

  @Column('int', {
    nullable: false,
  })
  quantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
