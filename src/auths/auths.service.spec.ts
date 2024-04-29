import { Test, TestingModule } from '@nestjs/testing';
import { AuthsService } from './auths.service';
import { EntityManager, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Auth } from './entities/auth.entity';
import * as bcrypt from 'bcrypt';

describe('AuthsService', () => {
  let service: AuthsService;
  let authRepository: Repository<Auth>;
  let mockEntityManager: EntityManager;

  const AUTH_REPOSITORY_TOKEN = getRepositoryToken(Auth);

  beforeEach(async () => {
    mockEntityManager = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    } as any as EntityManager;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthsService,
        {
          provide: 'EntityManager',
          useValue: mockEntityManager,
        },
        {
          provide: AUTH_REPOSITORY_TOKEN,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthsService>(AuthsService);
    authRepository = module.get<Repository<Auth>>(AUTH_REPOSITORY_TOKEN);
  });

  it('Service should be defined', () => {
    expect(service).toBeDefined();
  });

  it('authRepo should be defined', () => {
    expect(authRepository).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash password', async () => {
      const password = 'password';
      const hashedPassword = await service.hashPassword(password);
      expect(hashedPassword).not.toEqual(password);
      await expect(bcrypt.compare(password, hashedPassword)).resolves.toBe(
        true,
      );
    });
  });

  describe('login', () => {
    it('should throw error if user not found', async () => {
      authRepository.findOne = jest.fn().mockResolvedValue(null);
      await expect(service.login('userId', 'password')).rejects.toThrow(
        'User or password not match',
      );
    });

    it('should throw error if password not match', async () => {
      authRepository.findOne = jest
        .fn()
        .mockResolvedValue({ value: 'hashedPassword' });
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));
      await expect(service.login('userId', 'password')).rejects.toThrow(
        'User or password not match',
      );
    });

    it('should return true if password match', async () => {
      authRepository.findOne = jest
        .fn()
        .mockResolvedValue({ value: 'hashedPassword' });
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      await expect(service.login('userId', 'password')).resolves.toBe(true);
    });
  });

  describe('createUserPassword', () => {
    it('should create user password', async () => {
      const userId = 'userId';
      const password = 'password';
      const authModel = { id: 'authId' };
      authRepository.create = jest.fn().mockReturnValue(authModel);
      mockEntityManager.create = jest.fn().mockReturnValue(authModel);
      await service.createUserPassword(userId, password, mockEntityManager);
      expect(mockEntityManager.create).toHaveBeenCalled();
      expect(mockEntityManager.save).toHaveBeenCalledWith(authModel);
    });
  });

  describe('changePassword', () => {
    it('should throw error if user not found', async () => {
      authRepository.findOne = jest.fn().mockResolvedValue(null);
      await expect(
        service.changePassword('userId', 'password'),
      ).rejects.toThrow('Auth not found');
    });

    it('should change password', async () => {
      const password = 'password';
      const authModel = { id: 'authId', value: 'hashedPassword' };
      authRepository.findOne = jest.fn().mockResolvedValue(authModel);
      await service.changePassword('userId', password);
      expect(authModel.value).not.toEqual('hashedPassword');
      expect(authRepository.save).toBeCalledWith(authModel);
    });
  });
});
