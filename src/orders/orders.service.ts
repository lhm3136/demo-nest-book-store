import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { Stock } from './entities/stock.entity';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectEntityManager()
    private entityManager: EntityManager,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
  ) {}

  async setCart(bookId: number, userId: string, quantity: number) {
    const cart = await this.cartRepository.findOne({
      where: { bookId, userId },
    });
    if (cart) {
      if (quantity === 0) {
        return this.cartRepository.remove(cart);
      }
      cart.quantity = quantity;
      return this.cartRepository.save(cart);
    }
    const cartModel = this.cartRepository.create({
      bookId,
      userId,
      quantity,
    });
    return this.cartRepository.save(cartModel);
  }

  getCart(userId: string) {
    return this.cartRepository.findBy({ userId });
  }

  createStock(bookId: number, quantity: number, txManager: EntityManager) {
    const stock = txManager.create(Stock, {
      bookId,
      availableQuantity: quantity,
    });
    return txManager.save(stock);
  }

  updateStock(bookId: number, quantity: number) {
    return this.stockRepository.update(
      { bookId },
      { availableQuantity: quantity },
    );
  }

  async createOrder(userId: string) {
    const carts = await this.getCart(userId);
    if (!carts.length) {
      throw new Error('Cart is empty');
    }
    return await this.entityManager.transaction(async (txManager) => {
      let totalPrice = 0;
      const orderItemList: OrderItem[] = [];
      for (const cart of carts) {
        const stock = await txManager.findOne(Stock, {
          where: { bookId: cart.bookId },
          relations: ['book'],
        });
        if (!stock) {
          throw new Error('Stock not found');
        }
        if (!stock?.book) {
          throw new Error('Book not found');
        }
        if (stock.availableQuantity < cart.quantity) {
          throw new Error('Not enough stock');
        }
        totalPrice += stock.book.price * cart.quantity;
        await txManager.save(stock);
        const orderItemModel = txManager.create(OrderItem, {
          bookId: cart.bookId,
          quantity: cart.quantity,
          price: stock.book.price,
        });
        await txManager.remove(cart);
        orderItemList.push(orderItemModel);
      }
      const orderModel = txManager.create(Order, {
        totalPrice,
        userId,
        status: OrderStatus.PENDING,
      });
      const order = await txManager.save(orderModel);
      for (const orderItem of orderItemList) {
        orderItem.orderId = order.id;
      }
      await txManager.save(orderItemList);
      return order;
    });
  }

  findAllOrders() {
    return this.orderRepository.find();
  }

  // Don't need to filter status for now?
  findOrders(userId: string, status?: OrderStatus) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }
    return this.orderRepository.find({ where, relations: ['orderItems'] });
  }

  findOrderByUserAndId(id: string, userId: string) {
    return this.orderRepository.findOne({
      where: { id, userId },
      relations: ['orderItems'],
    });
  }

  async updateOrder(id: string, status: OrderStatus, userId: string) {
    if (status === OrderStatus.PENDING) {
      throw new Error('Invalid status');
    }
    const order = await this.findOrderByUserAndId(id, userId);
    if (!order) {
      throw new Error('Order not found');
    }
    if (status === OrderStatus.SUCCESS) {
      return this.handleSuccessOrder(order);
    }
    if (status === OrderStatus.DELIVERING) {
      return this.handleDeliveringOrder(order);
    }
    if (status === OrderStatus.CANCELLED) {
      return this.handleCancelledOrder(order);
    }
  }

  async handleSuccessOrder(order: Order) {
    if (order.status !== OrderStatus.DELIVERING) {
      throw new Error('Order still not confirmed');
    }
    return await this.entityManager.transaction(async (txManager) => {
      order.status = OrderStatus.SUCCESS;
      await txManager.save(order);
      for (const orderItem of order.orderItems) {
        const stock = await txManager.findOne(Stock, {
          where: { bookId: orderItem.bookId },
        });
        stock.frozenQuantity -= orderItem.quantity;
        await txManager.save(stock);
      }
      return order;
    });
  }

  async handleDeliveringOrder(order: Order) {
    if (order.status !== OrderStatus.PENDING) {
      throw new Error('Order cannot be delivered');
    }
    return await this.entityManager.transaction(async (txManager) => {
      order.status = OrderStatus.DELIVERING;
      await txManager.save(order);
      for (const orderItem of order.orderItems) {
        const stock = await txManager.findOne(Stock, {
          where: { bookId: orderItem.bookId },
        });
        stock.availableQuantity -= orderItem.quantity;
        stock.frozenQuantity += orderItem.quantity;
        await txManager.save(stock);
      }
      return order;
    });
  }

  async handleCancelledOrder(order: Order) {
    if (order.status !== OrderStatus.PENDING) {
      throw new Error('Order cannot be cancelled');
    }
    order.status = OrderStatus.CANCELLED;
    return await this.orderRepository.save(order);
  }
}
