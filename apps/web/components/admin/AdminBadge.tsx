import { adminStatusLabels, type AdminOrderStatus } from '../../lib/admin-contract';
import type { PaymentStatus } from '../../lib/order-detail-contract';

const statusClasses: Record<string, string> = {
  awaiting_payment: 'bg-amber-50 text-amber-700 ring-amber-100',
  paid: 'bg-sky-50 text-deepblue ring-sky-100',
  supplier_order_pending: 'bg-slate-100 text-slate-700 ring-slate-200',
  supplier_ordered: 'bg-sky-50 text-deepblue ring-sky-100',
  supplier_in_production: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  received_at_france_hub: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
  shipped_to_africa: 'bg-blue-50 text-blue-700 ring-blue-100',
  customs_processing: 'bg-purple-50 text-purple-700 ring-purple-100',
  out_for_delivery: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  cancelled: 'bg-red-50 text-red-700 ring-red-100',
  refunded: 'bg-slate-100 text-slate-700 ring-slate-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-100',
  failed: 'bg-red-50 text-red-700 ring-red-100',
};

export function AdminStatusBadge({ status }: { status: AdminOrderStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClasses[status]}`}>
      {adminStatusLabels[status]}
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClasses[status] ?? statusClasses.pending}`}>
      {label}
    </span>
  );
}
