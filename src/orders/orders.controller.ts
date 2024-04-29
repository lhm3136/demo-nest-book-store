import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { UpdateOrderDto } from './dto/update-order.dto';
import { SessionGuard } from '../auths/guards/session.guard';
import { SessionAdminGuard } from '../auths/guards/session.admin.guard';
import { SetCartDto } from './dto/set-cart.dto';
import { IRequest } from '../common/types/type';
import { UpdateStockDto } from './dto/update-stock-dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(SessionGuard)
  @Post('cart')
  async setCart(@Body() cart: SetCartDto, @Request() req: IRequest) {
    return await this.ordersService.setCart(
      cart.bookId,
      req.user.id,
      cart.quantity,
    );
  }

  @UseGuards(SessionAdminGuard)
  @Patch('stock')
  async updateStock(@Body() dto: UpdateStockDto) {
    return await this.ordersService.updateStock(dto.bookId, dto.quantity);
  }

  @UseGuards(SessionGuard)
  @Post('order')
  async createOrder(@Request() req: IRequest) {
    return await this.ordersService.createOrder(req.user.id);
  }

  @UseGuards(SessionAdminGuard)
  @Get('order/admin/query')
  async findOrders() {
    return await this.ordersService.findAllOrders();
  }

  @UseGuards(SessionGuard)
  @Get('order/query')
  async findUserOrders(@Request() req: IRequest) {
    return await this.ordersService.findOrders(req.user.id);
  }

  @UseGuards(SessionGuard)
  @Get('order/query/:id')
  async findOneUserOrder(@Param('id') id: string, @Request() req: IRequest) {
    return await this.ordersService.findOrderByUserAndId(id, req.user.id);
  }

  @UseGuards(SessionGuard)
  @Patch('order/:id')
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req: IRequest,
  ) {
    return await this.ordersService.updateOrder(
      id,
      updateOrderDto.status,
      req.user.id,
    );
  }
}
