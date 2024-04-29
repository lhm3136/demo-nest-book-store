import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Auth } from '../auths/entities/auth.entity';
import { AuthsService } from '../auths/auths.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Auth])],
  controllers: [UsersController],
  providers: [UsersService, AuthsService],
  exports: [UsersService],
})
export class UsersModule {}
