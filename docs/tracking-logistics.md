# Kendronics Tracking And Logistics

Kendronics tracks orders as an ordering and logistics platform connected to trusted external manufacturing partners. Status labels must not imply Kendronics owns PCB manufacturing facilities.

## Status Flow

The normal fulfilled journey is:

1. `paid`
2. `supplier_order_pending`
3. `supplier_ordered`
4. `supplier_in_production`
5. `received_at_france_hub`
6. `shipped_to_africa`
7. `customs_processing`
8. `out_for_delivery`
9. `delivered`

Terminal exception states:

- `cancelled`
- `refunded`

Admin status updates cannot move backward through the normal journey. Payment code, not admin UI, should mark an order `paid` after verified provider confirmation.

## API Endpoints

Customer-authenticated timeline:

```txt
GET /api/tracking/:orderId
Authorization: Bearer <access_token>
```

Public lookup by order and email:

```txt
POST /api/tracking/lookup
{
  "orderId": "order_uuid_or_id",
  "email": "customer@example.com"
}
```

Logistics:

```txt
GET /api/logistics/zones
GET /api/logistics/delivery-estimate?countryIso2=SN&shippingMode=standard
GET /api/countries/africa
```

Admin:

```txt
PATCH /api/admin/orders/:orderId/status
POST  /api/admin/orders/:orderId/supplier-reference
PATCH /api/admin/orders/:orderId/shipment
POST  /api/admin/orders/:orderId/tracking-events
```

## Frontend Data Contract

Tracking lookup response:

```ts
interface TrackingTimeline {
  orderId: string;
  orderNumber: string;
  status:
    | 'paid'
    | 'supplier_order_pending'
    | 'supplier_ordered'
    | 'supplier_in_production'
    | 'received_at_france_hub'
    | 'shipped_to_africa'
    | 'customs_processing'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled'
    | 'refunded';
  carrierName?: string;
  trackingNumber?: string;
  estimatedDeliveryAt?: string;
  events: TrackingEvent[];
}

interface TrackingEvent {
  id: string;
  orderId: string;
  status: string;
  title: string;
  description?: string;
  location?: string;
  occurredAt: string;
}
```

Delivery estimate response:

```ts
interface DeliveryEstimate {
  countryIso2: string;
  logisticsZoneCode:
    | 'AFRICA_NORTH'
    | 'AFRICA_WEST'
    | 'AFRICA_CENTRAL'
    | 'AFRICA_EAST'
    | 'AFRICA_SOUTHERN'
    | 'AFRICA_ISLANDS';
  shippingMode: 'economy' | 'standard' | 'express';
  minDays: number;
  maxDays: number;
  estimatedDeliveryAt: string;
}
```

## Carrier Adapter Boundary

Carrier integrations should implement `CarrierAdapter` in `modules/logistics/integrations`. The current service uses deterministic zone rules; future adapters can replace or enrich delivery estimates without changing controllers.
