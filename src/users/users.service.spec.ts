import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { AuthsService } from '../auths/auths.service';

describe('UsersService', () => {
  let service: UsersService;
  let authsService: AuthsService;
  let userRepository: Repository<User>;
  let entityManager: EntityManager;

  const USER_REPOSITORY_TOKEN = getRepositoryToken(User);

  beforeEach(async () => {
    const mockEntityManager = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    } as any as EntityManager;

    entityManager = {
      transaction: jest.fn().mockImplementation((cb) => cb(mockEntityManager)),
    } as any as EntityManager;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: AuthsService,
          useValue: {
            createUserPassword: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: EntityManager,
          useValue: entityManager,
        },
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    authsService = module.get<AuthsService>(AuthsService);
    userRepository = module.get<Repository<User>>(USER_REPOSITORY_TOKEN);
  });

  it('Services should be defined', () => {
    expect(service).toBeDefined();
    expect(authsService).toBeDefined();
  });

  it('repos should be defined', () => {
    expect(userRepository).toBeDefined();
  });

  describe('findOneById', () => {
    it('should find user by id', async () => {
      const user = { id: '1' };
      userRepository.findOneBy = jest.fn().mockResolvedValue(user);
      const result = await service.findOneById('1');
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      userRepository.findOneBy = jest.fn().mockResolvedValue(null);
      const result = await service.findOneById('1');
      expect(result).toBeNull();
    });
  });

  describe('getUserByUsername', () => {
    it('should find user by username', async () => {
      const user = { username: 'user' };
      userRepository.findOneBy = jest.fn().mockResolvedValue(user);
      const result = await service.getUserByUsername('user');
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      userRepository.findOneBy = jest.fn().mockResolvedValue(null);
      const result = await service.getUserByUsername('user');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [{}, {}];
      userRepository.find = jest.fn().mockResolvedValue(users);
      const result = await service.findAll();
      expect(result).toEqual(users);
    });
  });

  describe('create', () => {
    it('should create user', async () => {
      const data = { username: 'user', email: 'email', password: 'password' };
      const user = { id: '1', ...data };
      const mockEntityManager = {
        create: jest.fn().mockReturnValue(user),
        save: jest.fn().mockResolvedValue(user),
        findOne: jest.fn(),
      } as any as EntityManager;
      entityManager.transaction = jest
        .fn()
        .mockImplementation((cb) => cb(mockEntityManager));
      const result = await service.create(data);
      expect(result).toEqual(user);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const user = { id: '1', displayName: 'user' };
      const updateValue = { displayName: 'new user' };
      userRepository.findOneBy = jest.fn().mockResolvedValue(user);
      userRepository.save = jest
        .fn()
        .mockResolvedValue({ ...user, ...updateValue });
      const result = await service.update('1', updateValue);
      expect(result.displayName).toEqual('new user');
    });

    it('should throw error if user not found', async () => {
      userRepository.findOneBy = jest.fn().mockResolvedValue(null);
      await expect(
        service.update('1', { displayName: 'new user' }),
      ).rejects.toThrow('User not found.');
    });

    it('should throw error if no data to update', async () => {
      const user = { id: '1', displayName: 'user' };
      userRepository.findOneBy = jest.fn().mockResolvedValue(user);
      await expect(service.update('1', {})).rejects.toThrow(
        'No data to update.',
      );
    });
  });

  describe('remove', () => {
    it('should remove user', async () => {
      userRepository.softDelete = jest.fn().mockResolvedValue({ affected: 1 });
      const result = await service.remove('1');
      expect(result).toEqual({ affected: 1 });
    });
  });
});
