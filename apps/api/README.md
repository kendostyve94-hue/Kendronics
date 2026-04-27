# Kendronics API

NestJS backend skeleton for Kendronics, a PCB ordering and logistics platform connected to trusted external manufacturing partners.

Kendronics must not be represented as a PCB factory. Supplier/manufacturing fields should reference external partners.

## Core Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/pricing/quote`
- `POST /api/uploads/presign`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/payments/checkout`
- `POST /api/payments/mobile-money`
- `POST /api/payments/mobile-money/simulated-callback`
- `POST /api/payments/webhooks/stripe`
- `GET /api/tracking/:orderId`
- `POST /api/tracking/lookup`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:orderId/status`
- `POST /api/admin/orders/:orderId/supplier-reference`
- `PATCH /api/admin/orders/:orderId/shipment`
- `POST /api/admin/orders/:orderId/tracking-events`
- `GET /api/admin/pricing-rules`
- `POST /api/admin/pricing-rules`
- `GET /api/countries/africa`
- `GET /api/logistics/zones`
- `GET /api/logistics/delivery-estimate`
- `GET /api/support/tickets`
- `POST /api/support/tickets`

## Auth Contract

`POST /api/auth/login`

Request:

```json
{
  "email": "customer@example.com",
  "password": "string"
}
```

Success response:

```json
{
  "accessToken": "jwt-signed-access-token",
  "refreshToken": "refresh.random-token",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

Failure response: `401 Unauthorized` with a generic invalid-credentials message. Clients must not reveal whether the email address exists.

`POST /api/auth/refresh`

Request:

```json
{
  "refreshToken": "refresh.user-id.timestamp"
}
```

Success response matches the login token shape and rotates the refresh token by revoking the previous session.

`POST /api/auth/forgot-password`

Request:

```json
{
  "email": "customer@example.com"
}
```

Accepted response:

```json
{
  "ok": true,
  "message": "If an account can receive password reset email, we will send instructions shortly."
}
```

This route always uses a neutral accepted response so password recovery cannot be used for email enumeration.

## Customer Order Detail Contract

The customer order detail page consumes only customer-safe fields. Internal supplier names, external supplier order IDs, and partner operational notes must stay out of this response unless intentionally exposed through a customer-facing field.

`GET /api/orders/:orderId`

Expected customer-safe response shape:

```json
{
  "id": "order-uuid",
  "orderNumber": "KEN-123456",
  "status": "supplier_in_production",
  "paymentStatus": "paid",
  "destinationCountryIso2": "SN",
  "totalPrice": 184.4,
  "currency": "EUR",
  "estimatedDeliveryAt": "2026-05-08T00:00:00.000Z",
  "pcbSpecs": {
    "productType": "Standard PCB",
    "layers": 4,
    "dimensions": "80 x 60 mm",
    "quantity": 20,
    "baseMaterial": "FR4",
    "thickness": "1.6mm",
    "solderMaskColor": "Green",
    "surfaceFinish": "HASL lead-free",
    "assemblyRequired": false
  },
  "gerberFile": {
    "fileName": "board.zip",
    "fileSize": "3.8 MB",
    "uploadedAt": "2026-04-25T00:00:00.000Z",
    "validationStatus": "validated"
  },
  "pricingBreakdown": [
    { "label": "PCB production", "amount": 72 }
  ]
}
```

`GET /api/tracking/:orderId`

Customer tracking statuses:

```json
[
  "paid",
  "supplier_order_pending",
  "supplier_ordered",
  "supplier_in_production",
  "received_at_france_hub",
  "shipped_to_africa",
  "customs_processing",
  "out_for_delivery",
  "delivered"
]
```

Tracking event response:

```json
[
  {
    "id": "event-uuid",
    "orderId": "order-uuid",
    "status": "supplier_in_production",
    "title": "In production",
    "description": "The boards are being produced by an approved external partner.",
    "location": "France hub",
    "occurredAt": "2026-04-25T00:00:00.000Z"
  }
]
```
