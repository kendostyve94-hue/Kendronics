import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderQuantityDto } from './dto/update-order-quantity.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.listForUser(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.findOwnedOrder(user.id, id);
  }

  @Patch(':id/quantity')
  updateQuantity(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateOrderQuantityDto) {
    return this.ordersService.updateOwnedOrderQuantity(user.id, id, dto.quantity);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.deleteOwnedOrder(user.id, id);
  }
}
