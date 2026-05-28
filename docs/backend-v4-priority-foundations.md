# Kendronics Backend V4 - Priority Foundations

## 1. Order State Machine

PostgreSQL remains the source of truth. Order transitions must be explicit and monotonic, except for the controlled first rejection loop:

- `awaiting_payment -> payment_authorized`
- `payment_authorized -> supplier_review_pending`
- `supplier_review_pending -> supplier_files_rejected`
- `supplier_files_rejected -> supplier_review_pending`
- `payment_authorized | supplier_review_pending -> paid`
- `paid -> supplier_order_pending -> supplier_ordered -> supplier_in_production`
- terminal states: `cancelled`, `refunded`

Manual capture is only valid while the order is in `payment_authorized` or `supplier_review_pending`.

## 2. Stripe Authorization Expiration

Stripe card authorizations are time-limited. The backend must track `Payment.captureBefore` from Stripe webhooks and run a periodic monitor.

Rules:

- if `captureBefore` is within 24 hours, notify the customer and log an operational warning;
- if `captureBefore` is past, mark payment `expired`;
- never capture an expired authorization;
- expired authorizations must be re-authorized or the order must be cancelled by business rule.

## 3. Capture And Cancellation Guards

Capture:

- requires provider `stripe`;
- requires payment status `authorized`;
- requires a provider intent id;
- requires a non-expired `captureBefore` when Stripe provided one;
- requires order status `payment_authorized` or `supplier_review_pending`.

Cancellation:

- is allowed only before production payment capture;
- is valid for `awaiting_payment`, `payment_authorized`, `supplier_review_pending`, and `supplier_files_rejected`.

## 4. File Versioning

File replacement must be versioned, not overwritten.

Target V4 model:

- one order can have many files;
- each file has `fileType`, `fileVersion`, `isCurrentVersion`;
- reupload creates a new version and marks previous files as not current;
- each supplier review references a technical package version;
- maximum review attempts: 2.

## 5. Idempotency, Audit, And Async Mirrors

Critical events must be idempotent:

- Stripe webhook: `provider + providerEventId`;
- supplier review result: `orderId + attemptNumber + externalReviewId`;
- file reupload: `orderId + fileType + fileVersion`;
- Monday sync: `board + item + operation + sourceEventId`.

Monday, email, and supplier integrations must be async mirrors. They must not decide the real order state.
