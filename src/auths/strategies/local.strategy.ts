import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthsService } from '../auths.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthsService,
    private usersService: UsersService,
  ) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.usersService.getUserByUsername(username);
    if (!user?.id) {
      throw new Error('User or password not match');
    }

    const auth = await this.authService.login(user.id, password);
    if (!auth) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
