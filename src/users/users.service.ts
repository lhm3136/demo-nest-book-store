import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { AuthsService } from '../auths/auths.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectEntityManager()
    private entityManager: EntityManager,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private authsService: AuthsService,
  ) {}

  findOneById(id: string): Promise<User> {
    return this.userRepository.findOneBy({ id });
  }

  getUserByUsername(username: string): Promise<User> {
    return this.userRepository.findOneBy({ username });
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async create(data: CreateUserDto): Promise<User> {
    const existUser = await this.userRepository.findOneBy([
      { username: data.username },
      { email: data.email },
    ]);
    if (existUser?.id) {
      throw new Error('Username or email Exists');
    }
    return await this.entityManager.transaction(async (txManager) => {
      const userModel = txManager.create(User, data);
      if (!userModel.displayName) {
        userModel.displayName = userModel.username;
      }
      const user = await txManager.save(userModel);
      await this.authsService.createUserPassword(
        user.id,
        data.password,
        txManager,
      );
      return user;
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user?.id) {
      throw new Error('User not found.');
    }
    const { displayName, email } = dto;
    if (!displayName && !email) {
      throw new Error('No data to update.');
    }
    if (displayName) {
      user.displayName = displayName;
    }
    if (email) {
      user.email = email;
    }
    return this.userRepository.save(user);
  }

  async remove(id: string) {
    return this.userRepository.softDelete(id);
  }
}
