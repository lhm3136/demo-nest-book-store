import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { AuthsService } from '../auths/auths.service';
import { Auth } from '../auths/entities/auth.entity';
import { User } from './entities/user.entity';
import { IRequest } from '../common/types/type';
import { getConnection, Repository } from "typeorm";

describe('UsersController', () => {
  let controller: UsersController;
  let module: TestingModule;
  let userRepo: Repository<User>;
  let authRepo: Repository<Auth>;
  const testUser = {
    email: '123@123.com',
    password: '123',
    username: 'test',
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          username: 'test12345',
          password: 'test12345',
          database: 'test12345',
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([User, Auth]),
      ],
      controllers: [UsersController],
      providers: [UsersService, AuthsService],
    }).compile();
    controller = module.get<UsersController>(UsersController);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    authRepo = module.get<Repository<Auth>>(getRepositoryToken(Auth));
  });

  beforeEach(async () => {
    controller = module.get<UsersController>(UsersController);
    await authRepo.delete({});
    await userRepo.delete({});
  });

  it('controller should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('services should be defined', () => {
    expect(controller['usersService']).toBeDefined();
  });

  describe('create', () => {
    it('should return a user', async () => {
      const user = await controller.create(testUser);
      expect(user).toMatchObject({
        email: '123@123.com',
        username: 'test',
      });
      expect(user).toHaveProperty('displayName');
    });

    it('Should throw if user exists', async () => {
      await controller.create(testUser);
      await expect(
        async () =>
          await controller.create({
            email: '124@124.com',
            password: '124',
            username: 'test',
          }),
      ).rejects.toThrow('Username or email Exists');
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      await controller.create(testUser);
      await controller.create({
        email: '124@124.com',
        password: '124',
        username: 'test2',
      });
      const users = await controller.findAll();
      expect(users).toBeInstanceOf(Array);
      expect(users).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const user = await controller.create(testUser);
      const foundUser = await controller.findOne(user.id);
      expect(foundUser).toMatchObject(user);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const user = await controller.create(testUser);
      const updatedUser = await controller.update(user.id, {
        displayName: 'test2',
      });
      expect(updatedUser.displayName).toBe('test2');
    });
  });

  describe('updateProfile', () => {
    it('should update a user', async () => {
      const user = await controller.create(testUser);
      const updatedUser = await controller.updateProfile(
        {
          user: { id: user.id },
        } as any as IRequest,
        {
          displayName: 'test2',
        },
      );
      expect(updatedUser.displayName).toBe('test2');
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const user = await controller.create(testUser);
      const removedUser = await controller.remove(user.id);
      expect(removedUser).toHaveProperty('affected', 1);
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
