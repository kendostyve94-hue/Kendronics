import { Injectable } from '@nestjs/common';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OrdersService } from '../orders/orders.service';

export interface PublicProductionActivityItem {
  date: string;
  region: string;
  reference: string;
  service: string;
  leadTime: string;
  progress: number;
}

const statusProgress: Record<OrderStatus, number> = {
  draft: 0,
  quoted: 5,
  awaiting_payment: 10,
  payment_authorized: 18,
  supplier_review_pending: 28,
  supplier_files_rejected: 22,
  paid: 35,
  supplier_order_pending: 42,
  supplier_ordered: 50,
  supplier_in_production: 68,
  china_3pl_received: 76,
  shipped_to_africa: 84,
  customs_processing: 90,
  out_for_delivery: 96,
  delivered: 100,
  cancelled: 0,
  refunded: 0,
};

const serviceLabels: Record<string, string> = {
  standard_pcb: 'PCB standard',
  advanced_pcb: 'PCB avance',
  pcb_assembly: 'PCBA',
  fpc_rigid_flex: 'FPC/Rigid-Flex',
  smd_stencil: 'Stencil SMT',
  cnc_3d: 'CNC / 3D',
};

@Injectable()
export class HomeService {
  constructor(private readonly ordersService: OrdersService) {}

  async recentProduction(limit: number): Promise<{ items: PublicProductionActivityItem[] }> {
    const orders = await this.ordersService.listRecentPublicActivity(Number.isFinite(limit) ? limit : 6);
    return { items: orders.map((order) => this.toPublicActivity(order)) };
  }

  private toPublicActivity(order: Order): PublicProductionActivityItem {
    return {
      date: this.shortDate(order.createdAt),
      region: order.destinationCountryIso2,
      reference: this.publicReference(order.orderNumber),
      service: this.serviceLabel(order.quoteSnapshot?.productType),
      leadTime: this.leadTimeLabel(order),
      progress: statusProgress[order.status] ?? 0,
    };
  }

  private shortDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(new Date(date));
  }

  private publicReference(orderNumber: string): string {
    const tail = orderNumber.replace(/\D/g, '').slice(-3) || orderNumber.slice(-3);
    return `KEN-***${tail}`;
  }

  private serviceLabel(productType?: string): string {
    if (!productType) return 'Commande PCB';
    return serviceLabels[productType] ?? productType.replace(/_/g, ' ');
  }

  private leadTimeLabel(order: Order): string {
    const buildDays = Number(order.quoteSnapshot?.configSnapshot?.productionBuildDays);
    if (Number.isFinite(buildDays) && buildDays > 0) {
      return `${Math.round(buildDays)} j`;
    }

    if (order.status === 'delivered') return 'Livre';
    if (order.status === 'out_for_delivery') return 'En livraison';
    if (order.status === 'customs_processing') return 'Douane';
    if (order.status === 'shipped_to_africa') return 'Transit';
    return 'Selon revue';
  }
}
