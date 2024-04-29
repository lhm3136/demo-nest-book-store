import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LocalAuthGuard } from './guards/local.auth.guard';
import { SessionGuard } from './guards/session.guard';
import { IRequest } from '../common/types/type';
import { SessionAdminGuard } from './guards/session.admin.guard';

@Controller('auth')
export class AuthsController {
  constructor() {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async signIn() {
    return true;
  }

  //Just a testing endpoint
  @UseGuards(SessionGuard)
  @Get('profile')
  getProfile(@Request() req: IRequest) {
    return req.user;
  }

  //Just another testing endpoint
  @UseGuards(SessionAdminGuard)
  @Get('profile/admin')
  getProfileAdmin(@Request() req: IRequest) {
    return req.user;
  }

  @UseGuards(SessionGuard)
  @Post('logout')
  async logout(@Request() req: IRequest) {
    req.session.destroy();
    return { message: 'Logout success' };
  }
}
