import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn, Index
} from "typeorm";
import { User } from '../../users/entities/user.entity';

export enum AuthType {
  PASSWORD = 'password',
  TOTP = 'totp',
  RECOVERY_CODE = 'recover_code',
}

@Entity()
export class Auth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({
    type: 'enum',
    enum: AuthType,
    nullable: false,
  })
  type: AuthType;

  @Column({
    nullable: false,
  })
  value: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deletedAt: Date;
}
