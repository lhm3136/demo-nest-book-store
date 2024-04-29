import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    length: 30,
    nullable: false,
    unique: true,
  })
  username: string;

  @Column({
    nullable: true,
  })
  email?: string;

  @Column({
    length: 30,
    nullable: false,
  })
  displayName: string;

  @Column({
    nullable: true,
  })
  iconUrl?: string;

  @Column({
    nullable: false,
    default: 0,
  })
  roleRank: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deletedAt?: Date;
}
