import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class UpdateOrderStatusDto {
  @IsIn([
    'paid',
    'supplier_order_pending',
    'supplier_ordered',
    'supplier_in_production',
    'received_at_france_hub',
    'shipped_to_africa',
    'customs_processing',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'refunded',
  ])
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export class AddSupplierOrderReferenceDto {
  @IsString()
  externalManufacturingPartner!: string;

  @IsString()
  externalSupplierOrderId!: string;
}

export class UpdateShipmentDto {
  @IsOptional()
  @IsString()
  carrierName?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsDateString()
  estimatedDeliveryAt?: string;
}
