import { Injectable } from '@nestjs/common';
import { Auth, AuthType } from './entities/auth.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthsService {
  constructor(
    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
  ) {}

  hashPassword(password: string): Promise<string> {
    const saltOfRounds = 10;
    return bcrypt.hash(password, saltOfRounds);
  }

  async login(userId: string, password: string): Promise<boolean> {
    const passwordAuth = await this.authRepository.findOne({
      where: {
        userId,
        type: AuthType.PASSWORD,
      },
    });
    if (!passwordAuth) {
      throw new Error('User or password not match');
    }
    const isPasswordMatch = await bcrypt.compare(password, passwordAuth.value);
    if (!isPasswordMatch) {
      throw new Error('User or password not match');
    }
    return true;
  }

  async createUserPassword(
    userId: string,
    password: string,
    txManager: EntityManager,
  ): Promise<Auth> {
    const passwordHash = await this.hashPassword(password);
    const authModel = txManager.create(Auth, {
      user: { id: userId },
      type: AuthType.PASSWORD,
      value: passwordHash,
    });
    return await txManager.save(authModel);
  }

  async changePassword(userId: string, password: string): Promise<Auth> {
    const passwordAuth = await this.authRepository.findOne({
      where: {
        userId,
        type: AuthType.PASSWORD,
      },
    });
    if (!passwordAuth) {
      throw new Error('Auth not found');
    }
    passwordAuth.value = await this.hashPassword(password);
    return await this.authRepository.save(passwordAuth);
  }
}
