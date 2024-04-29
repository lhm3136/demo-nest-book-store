import { Test, TestingModule } from '@nestjs/testing';
import { AuthsService } from './auths.service';
import { AuthsController } from './auths.controller';
import { IRequest } from '../common/types/type';
import { getConnection } from "typeorm";

describe('AuthsController', () => {
  let controller: AuthsController;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [AuthsController],
      providers: [
        {
          provide: AuthsService,
          useValue: {},
        },
      ],
    }).compile();
    controller = module.get<AuthsController>(AuthsController);
  });

  beforeEach(async () => {});

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return true', async () => {
      expect(await controller.signIn()).toBe(true);
    });
  });

  describe('logout', () => {
    it('should return object with message', async () => {
      const request = { session: { destroy: jest.fn() } } as any as IRequest;
      expect(await controller.logout(request)).toEqual({
        message: 'Logout success',
      });
      expect(request.session.destroy).toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
