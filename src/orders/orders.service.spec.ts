import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { EntityManager, Repository } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { Cart } from './entities/cart.entity';
import { Order, OrderStatus } from './entities/order.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('OrdersService', () => {
  let service: OrdersService;
  let entityManager: EntityManager;
  let cartRepository: Repository<Cart>;
  let orderRepository: Repository<Order>;
  let stockRepository: Repository<Stock>;

  const STOCK_REPOSITORY_TOKEN = getRepositoryToken(Stock);
  const CART_REPOSITORY_TOKEN = getRepositoryToken(Cart);
  const ORDER_REPOSITORY_TOKEN = getRepositoryToken(Order);

  beforeEach(async () => {
    const mockEntityManager = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    } as any as EntityManager;

    entityManager = {
      create: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      transaction: jest.fn().mockImplementation((cb) => cb(mockEntityManager)),
    } as any as EntityManager;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: EntityManager,
          useValue: entityManager,
        },
        {
          provide: CART_REPOSITORY_TOKEN,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findBy: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: ORDER_REPOSITORY_TOKEN,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: STOCK_REPOSITORY_TOKEN,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    cartRepository = module.get<Repository<Cart>>(CART_REPOSITORY_TOKEN);
    orderRepository = module.get<Repository<Order>>(ORDER_REPOSITORY_TOKEN);
    stockRepository = module.get<Repository<Stock>>(STOCK_REPOSITORY_TOKEN);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('repos should be defined', () => {
    expect(cartRepository).toBeDefined();
    expect(orderRepository).toBeDefined();
    expect(stockRepository).toBeDefined();
  });

  describe('setCart', () => {
    it('should create a new cart', async () => {
      const bookId = 1;
      const userId = 'user1';
      const quantity = 1;
      const cart = { bookId, userId, quantity };
      const cartModel = { ...cart, id: 1 };
      cartRepository.findOne = jest.fn().mockResolvedValue(undefined);
      cartRepository.create = jest.fn().mockReturnValue(cartModel);
      cartRepository.save = jest.fn().mockResolvedValue(cartModel);
      const result = await service.setCart(bookId, userId, quantity);
      expect(result).toEqual(cartModel);
      expect(cartRepository.create).toHaveBeenCalledWith(cart);
    });

    it('should update the cart', async () => {
      const bookId = 1;
      const userId = 'user1';
      const quantity = 1;
      const cart = { bookId, userId, quantity };
      const cartModel = { ...cart, id: 1 };
      cartRepository.findOne = jest.fn().mockResolvedValue({
        ...cartModel,
        quantity: 2,
      });
      cartRepository.save = jest.fn().mockResolvedValue(cartModel);
      const result = await service.setCart(bookId, userId, quantity);
      expect(result).toEqual(cartModel);
    });

    it('should remove the cart', async () => {
      const bookId = 1;
      const userId = 'user1';
      const quantity = 0;
      const cart = { bookId, userId, quantity };
      const cartModel = { ...cart, id: 1 };
      cartRepository.findOne = jest.fn().mockResolvedValue(cartModel);
      cartRepository.remove = jest.fn();
      await service.setCart(bookId, userId, quantity);
      expect(cartRepository.remove).toHaveBeenCalledWith(cartModel);
    });
  });

  describe('getCart', () => {
    it('should get cart', async () => {
      const userId = 'user1';
      const carts = [{ userId: '1' }, { userId: '1' }];
      cartRepository.findBy = jest.fn().mockResolvedValue(carts);
      const result = await service.getCart(userId);
      expect(result).toEqual(carts);
    });
  });

  describe('createStock', () => {
    it('should create stock', async () => {
      const bookId = 1;
      const quantity = 10;
      const stock = { bookId, availableQuantity: quantity };
      entityManager.create = jest.fn().mockReturnValue(stock);
      await service.createStock(bookId, quantity, entityManager);
      expect(entityManager.create).toHaveBeenCalledWith(Stock, stock);
      expect(entityManager.save).toHaveBeenCalledWith(stock);
    });
  });

  describe('updateStock', () => {
    it('should update stock', async () => {
      const bookId = 1;
      const quantity = 10;
      stockRepository.update = jest.fn();
      await service.updateStock(bookId, quantity);
      expect(stockRepository.update).toHaveBeenCalledWith(
        { bookId },
        { availableQuantity: quantity },
      );
    });
  });

  describe('createOrder', () => {
    it('should create order', async () => {
      const userId = 'user1';
      const carts = [{ bookId: 1, quantity: 1 }];
      const stock = { book: { id: 1, price: 10 } };
      const order = { id: 1, userId, totalPrice: 10 };
      cartRepository.findBy = jest.fn().mockResolvedValue(carts);
      entityManager.transaction = jest.fn().mockImplementation((cb) =>
        cb({
          create: jest.fn().mockReturnValue(order),
          remove: jest.fn(),
          save: jest.fn().mockResolvedValue({ ...order, id: 1 }),
          findOne: jest.fn().mockResolvedValue(stock),
        }),
      );
      const result = await service.createOrder(userId);
      expect(result.userId).toEqual(order.userId);
    });

    it('should throw error if cart is empty', async () => {
      const userId = 'user1';
      cartRepository.findBy = jest.fn().mockResolvedValue([]);
      await expect(service.createOrder(userId)).rejects.toThrowError(
        'Cart is empty',
      );
    });

    it('should throw error if stock not found', async () => {
      const userId = 'user1';
      const carts = [{ bookId: 1, quantity: 1 }];
      cartRepository.findBy = jest.fn().mockResolvedValue(carts);
      entityManager.findOne = jest.fn().mockResolvedValue(null);
      await expect(service.createOrder(userId)).rejects.toThrowError(
        'Stock not found',
      );
    });

    it('should throw error if book not found', async () => {
      const userId = 'user1';
      const carts = [{ bookId: 1, quantity: 1 }];
      const stock = { book: null };
      cartRepository.findBy = jest.fn().mockResolvedValue(carts);
      entityManager.transaction = jest.fn().mockImplementation((cb) =>
        cb({
          save: jest.fn(),
          findOne: jest.fn().mockResolvedValue(stock),
        }),
      );
      await expect(service.createOrder(userId)).rejects.toThrowError(
        'Book not found',
      );
    });
  });

  describe('findOrders', () => {
    it('should find orders', async () => {
      const orders = [{}, {}];
      orderRepository.find = jest.fn().mockResolvedValue(orders);
      const result = await service.findAllOrders();
      expect(result).toEqual(orders);
    });
  });

  describe('findOrders', () => {
    it('should find orders by user id', async () => {
      const userId = 'user1';
      const orders = [{ userId }, { userId }];
      orderRepository.find = jest.fn().mockResolvedValue(orders);
      const result = await service.findOrders(userId);
      expect(result).toEqual(orders);
    });
  });

  describe('findOrderByUserAndId', () => {
    it('should find order by user id and order id', async () => {
      const userId = 'user1';
      const orderId = '1';
      const order = { id: orderId, userId };
      orderRepository.findOne = jest.fn().mockResolvedValue(order);
      const result = await service.findOrderByUserAndId(orderId, userId);
      expect(result).toEqual(order);
    });
  });

  describe('updateOrder', () => {
    it('should update order status to SUCCESS', async () => {
      const orderId = '1';
      const userId = 'user1';
      const order = { id: orderId, userId, status: OrderStatus.DELIVERING };
      orderRepository.findOne = jest.fn().mockResolvedValue(order);
      service.handleSuccessOrder = jest
        .fn()
        .mockResolvedValue({ ...order, status: OrderStatus.SUCCESS });
      const result = await service.updateOrder(
        orderId,
        OrderStatus.SUCCESS,
        userId,
      );
      expect(result.status).toEqual(OrderStatus.SUCCESS);
    });

    it('should update order status to DELIVERING', async () => {
      const orderId = '1';
      const userId = 'user1';
      const order = { id: orderId, userId, status: OrderStatus.PENDING };
      orderRepository.findOne = jest.fn().mockResolvedValue(order);
      service.handleDeliveringOrder = jest
        .fn()
        .mockResolvedValue({ ...order, status: OrderStatus.DELIVERING });
      const result = await service.updateOrder(
        orderId,
        OrderStatus.DELIVERING,
        userId,
      );
      expect(result.status).toEqual(OrderStatus.DELIVERING);
    });

    it('should update order status to CANCELLED', async () => {
      const orderId = '1';
      const userId = 'user1';
      const order = { id: orderId, userId, status: OrderStatus.PENDING };
      orderRepository.findOne = jest.fn().mockResolvedValue(order);
      service.handleCancelledOrder = jest
        .fn()
        .mockResolvedValue({ ...order, status: OrderStatus.CANCELLED });
      const result = await service.updateOrder(
        orderId,
        OrderStatus.CANCELLED,
        userId,
      );
      expect(result.status).toEqual(OrderStatus.CANCELLED);
    });

    it('should throw error if status is PENDING', async () => {
      const orderId = '1';
      const userId = 'user1';

      await expect(
        service.updateOrder(orderId, OrderStatus.PENDING, userId),
      ).rejects.toThrowError('Invalid status');
    });

    it('should throw error if order not found', async () => {
      const orderId = '1';
      const userId = 'user1';
      orderRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        service.updateOrder(orderId, OrderStatus.SUCCESS, userId),
      ).rejects.toThrowError('Order not found');
    });
  });

  describe('handleCancelledOrder', () => {
    it('should handle cancelled order', async () => {
      const order = {
        id: 1,
        status: 'pending',
      } as any as Order;
      orderRepository.save = jest
        .fn()
        .mockResolvedValue({ ...order, status: 'cancelled' });
      const result = await service.handleCancelledOrder(order);
      expect(result.status).toEqual('cancelled');
    });
  });

  describe('handleSuccessOrder', () => {
    it('should handle success order', async () => {
      const order: Order = {
        id: 1,
        status: 'delivering',
        orderItems: [
          {
            availableQuantity: 1,
            frozenQuantity: 1,
          },
        ],
      } as any as Order;
      orderRepository.save = jest
        .fn()
        .mockResolvedValue({ ...order, status: 'success' });
      entityManager.transaction = jest.fn().mockImplementation((cb) =>
        cb({
          save: jest.fn(),
          findOne: jest
            .fn()
            .mockResolvedValue({ availableQuantity: 1, frozenQuantity: 1 }),
        }),
      );
      const result = await service.handleSuccessOrder(order);
      expect(result.status).toEqual('success');
    });

    it('should throw error if order status is not delivering', async () => {
      const order: Order = { id: 1, status: 'pending' } as any as Order;
      await expect(service.handleSuccessOrder(order)).rejects.toThrowError(
        'Order still not confirmed',
      );
    });
  });

  describe('handleDeliveringOrder', () => {
    it('should handle delivering order', async () => {
      const order: Order = {
        id: 1,
        status: 'pending',
        orderItems: [
          {
            availableQuantity: 1,
            frozenQuantity: 1,
          },
        ],
      } as any as Order;
      entityManager.transaction = jest.fn().mockImplementation((cb) =>
        cb({
          save: jest.fn(),
          findOne: jest
            .fn()
            .mockResolvedValue({ availableQuantity: 1, frozenQuantity: 1 }),
        }),
      );
      orderRepository.save = jest
        .fn()
        .mockResolvedValue({ ...order, status: 'delivering' });
      const result = await service.handleDeliveringOrder(order);
      expect(result.status).toEqual('delivering');
    });
  });
});
