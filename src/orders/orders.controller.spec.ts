import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { getConnection, Repository } from "typeorm";
import { Stock } from './entities/stock.entity';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { IRequest } from '../common/types/type';
import { User } from '../users/entities/user.entity';
import { Book } from '../books/entities/book.entity';
import { Category } from '../books/entities/category.entity';

describe('OrdersController', () => {
  let controller: OrdersController;
  let module: TestingModule;
  let cartRepo: Repository<Cart>;
  let orderRepo: Repository<Order>;
  let stockRepo: Repository<Stock>;
  let orderItemRepo: Repository<OrderItem>;
  let userRepo: Repository<User>;
  let bookRepo: Repository<Book>;
  let categoryRepo: Repository<Category>;

  const testUser = {
    id: 'testUser',
    email: '1@1.com',
    username: 'test1',
    displayName: 'test1',
    password: 'test1',
  };

  const testBook = {
    id: 1,
    title: 'test',
    price: 10,
    categoryId: 1,
    author: 'test',
    rating: 5,
    description: 'test',
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
        TypeOrmModule.forFeature([
          Cart,
          Order,
          Stock,
          OrderItem,
          User,
          Book,
          Category,
        ]),
      ],
      controllers: [OrdersController],
      providers: [OrdersService],
    }).compile();
    controller = module.get<OrdersController>(OrdersController);
    cartRepo = module.get<Repository<Cart>>(getRepositoryToken(Cart));
    orderRepo = module.get<Repository<Order>>(getRepositoryToken(Order));
    stockRepo = module.get<Repository<Stock>>(getRepositoryToken(Stock));
    orderItemRepo = module.get<Repository<OrderItem>>(
      getRepositoryToken(OrderItem),
    );
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    bookRepo = module.get<Repository<Book>>(getRepositoryToken(Book));
    categoryRepo = module.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
  });

  beforeEach(async () => {
    await orderItemRepo.delete({});
    await stockRepo.delete({});
    await cartRepo.delete({});
    await orderRepo.delete({});
    await userRepo.delete({});
    await bookRepo.delete({});
    await categoryRepo.delete({});
    await userRepo.save(testUser);
    await categoryRepo.save({ id: 1, name: 'test' });
    await bookRepo.save(testBook);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('setCart', () => {
    it('should set cart', async () => {
      const userId = testUser.id;
      const bookId = 1;
      const quantity = 10;
      await controller.setCart({ bookId, quantity }, {
        user: { id: userId },
      } as IRequest);
      const cart = await cartRepo.findOne({ where: { userId, bookId } });
      expect(cart).toBeDefined();
      expect(cart?.quantity).toBe(quantity);
    });
  });

  describe('updateStock', () => {
    it('should update stock', async () => {
      const bookId = 1;
      const quantity = 10;
      await stockRepo.save({ bookId, availableQuantity: 0 });
      await controller.updateStock({ bookId, quantity });
      const stock = await stockRepo.findOne({ where: { bookId } });
      expect(stock).toBeDefined();
      expect(stock?.availableQuantity).toBe(quantity);
    });
  });

  describe('createOrder', () => {
    it('should create order', async () => {
      const userId = testUser.id;
      const bookId = 1;
      const quantity = 10;
      await stockRepo.save({ bookId, availableQuantity: 100 });
      await controller.setCart({ bookId, quantity }, {
        user: { id: userId },
      } as IRequest);
      await controller.createOrder({ user: { id: userId } } as IRequest);
      const order = await orderRepo.findOne({ where: { userId } });
      expect(order).toBeDefined();
      expect(order?.status).toBe('pending');
      expect(+order?.totalPrice).toBeCloseTo(quantity * testBook.price);
      const orderItems = await orderItemRepo.find({
        where: { orderId: order?.id },
      });
      expect(orderItems).toHaveLength(1);
    });

    it('should throw error if cart is empty', async () => {
      const userId = testUser.id;
      await expect(
        controller.createOrder({ user: { id: userId } } as IRequest),
      ).rejects.toThrow('Cart is empty');
    });

    it('should throw error if stock not enough', async () => {
      const userId = testUser.id;
      const bookId = 1;
      const quantity = 10;
      await stockRepo.save({ bookId, availableQuantity: 0 });
      await controller.setCart({ bookId, quantity }, {
        user: { id: userId },
      } as IRequest);
      await expect(
        controller.createOrder({ user: { id: userId } } as IRequest),
      ).rejects.toThrow('Not enough stock');
    });
  });

  describe('findOrders', () => {
    it('should find orders', async () => {
      const userId = testUser.id;
      const bookId = 1;
      const quantity = 10;
      await stockRepo.save({ bookId, availableQuantity: 100 });
      await controller.setCart({ bookId, quantity }, {
        user: { id: userId },
      } as IRequest);
      await controller.createOrder({ user: { id: userId } } as IRequest);
      const orders = await controller.findOrders();
      expect(orders).toHaveLength(1);
      expect(orders[0].status).toBe('pending');
    });
  });

  describe('findUserOrders', () => {
    it('should find user orders', async () => {
      const userId = testUser.id;
      const bookId = 1;
      const quantity = 10;
      await stockRepo.save({ bookId, availableQuantity: 100 });
      await controller.setCart({ bookId, quantity }, {
        user: { id: userId },
      } as IRequest);
      await controller.createOrder({ user: { id: userId } } as IRequest);
      const orders = await controller.findUserOrders({
        user: { id: userId },
      } as IRequest);
      expect(orders).toHaveLength(1);
      expect(orders[0].status).toBe('pending');
    });
  });

  describe('findOneUserOrder', () => {
    it('should find one user order', async () => {
      const userId = testUser.id;
      const bookId = 1;
      const quantity = 10;
      await stockRepo.save({ bookId, availableQuantity: 100 });
      await controller.setCart({ bookId, quantity }, {
        user: { id: userId },
      } as IRequest);
      const res = await controller.createOrder({
        user: { id: userId },
      } as IRequest);
      const order = await controller.findOneUserOrder(res.id, {
        user: { id: userId },
      } as IRequest);
      expect(order).toBeDefined();
      expect(order.status).toBe('pending');
    });
  });

  describe('update', () => {
    it('should update order', async () => {
      const userId = testUser.id;
      const bookId = 1;
      const quantity = 10;
      await stockRepo.save({ bookId, availableQuantity: 100 });
      await controller.setCart({ bookId, quantity }, {
        user: { id: userId },
      } as IRequest);
      await controller.createOrder({ user: { id: userId } } as IRequest);
      const order = await orderRepo.findOne({ where: { userId } });
      expect(order).toBeDefined();
      expect(order?.status).toBe('pending');
      await controller.update(order.id, { status: OrderStatus.DELIVERING }, {
        user: { id: userId },
      } as IRequest);
      const updatedOrder = await orderRepo.findOne({ where: { id: order.id } });
      expect(updatedOrder).toBeDefined();
      expect(updatedOrder?.status).toBe(OrderStatus.DELIVERING);
    });

    it('should throw error if order not found', async () => {
      const userId = testUser.id;
      await expect(
        controller.update('1', { status: OrderStatus.DELIVERING }, {
          user: { id: userId },
        } as IRequest),
      ).rejects.toThrow('Order not found');
    });

    it('should throw error if status is invalid', async () => {
      const userId = testUser.id;
      const bookId = 1;
      const quantity = 10;
      await stockRepo.save({ bookId, availableQuantity: 100 });
      await controller.setCart({ bookId, quantity }, {
        user: { id: userId },
      } as IRequest);
      const order = await controller.createOrder({
        user: { id: userId },
      } as IRequest);
      await expect(
        controller.update(order.id, { status: OrderStatus.PENDING }, {
          user: { id: userId },
        } as IRequest),
      ).rejects.toThrow('Invalid status');
    });

    it('should throw error if order is not confirmed and try to change to completed', async () => {
      const userId = testUser.id;
      const bookId = 1;
      const quantity = 10;
      await stockRepo.save({ bookId, availableQuantity: 100 });
      await controller.setCart({ bookId, quantity }, {
        user: { id: userId },
      } as IRequest);
      const order = await controller.createOrder({
        user: { id: userId },
      } as IRequest);
      await expect(
        controller.update(order.id, { status: OrderStatus.SUCCESS }, {
          user: { id: userId },
        } as IRequest),
      ).rejects.toThrow('Order still not confirmed');
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
