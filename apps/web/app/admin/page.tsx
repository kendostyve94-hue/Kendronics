'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AdminShell } from '../../components/admin/AdminShell';
import { AdminStatusBadge, PaymentBadge } from '../../components/admin/AdminBadge';
import { Card } from '../../components/ui/Card';
import { readAuthSession } from '../../lib/auth-session';
import {
  adminApiContract,
  adminOrderStatuses,
  adminStatusLabels,
} from '../../lib/admin-contract';
import type {
  AddSupplierReferenceRequest,
  AdminAuditLog,
  AdminBufferBucket,
  AdminOrderRow,
  AdminOrderStatus,
  AdminPricingIntelligence,
  AdminPricingRule,
  AdminPricingSnapshot,
  AdminSupportTicket,
  UpdateAdminOrderStatusRequest,
  UpdateShipmentRequest,
} from '../../lib/admin-contract';
import type { PaymentStatus } from '../../lib/order-detail-contract';

type AdminLoadState = 'checking' | 'authorized' | 'forbidden' | 'error';
type AdminTab = 'orders' | 'pricing' | 'support' | 'audit';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export default function AdminPage() {
  const [loadState, setLoadState] = useState<AdminLoadState>('checking');
  const [tab, setTab] = useState<AdminTab>('orders');
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [pricingRules, setPricingRules] = useState<AdminPricingRule[]>([]);
  const [pricingIntelligence, setPricingIntelligence] = useState<AdminPricingIntelligence | null>(null);
  const [supportTickets, setSupportTickets] = useState<AdminSupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAdminData() {
      const session = readAuthSession();

      if (!session) {
        setLoadState('forbidden');
        return;
      }

      try {
        const [ordersResult, pricingResult, intelligenceResult, supportResult, auditResult] = await Promise.all([
          adminRequest<AdminOrderRow[]>(adminApiContract.orders.path, session),
          adminRequest<unknown>(adminApiContract.pricingRules.path, session),
          adminRequest<AdminPricingIntelligence>(adminApiContract.pricingIntelligence.path, session),
          adminRequest<AdminSupportTicket[]>(adminApiContract.supportTickets.path, session),
          adminRequest<AdminAuditLog[]>(adminApiContract.auditLogs.path, session),
        ]);

        if (cancelled) return;

        const normalizedOrders = ordersResult.map(normalizeOrder);
        setOrders(normalizedOrders);
        setSelectedOrderId(normalizedOrders[0]?.id ?? '');
        setPricingRules(normalizePricingRules(pricingResult));
        setPricingIntelligence(intelligenceResult);
        setSupportTickets(supportResult);
        setAuditLogs(auditResult);
        setLoadState('authorized');
      } catch (error) {
        if (cancelled) return;
        setLoadState(error instanceof AdminForbiddenError ? 'forbidden' : 'error');
      }
    }

    void loadAdminData();

    return () => {
      cancelled = true;
    };
  }, []);

  const countries = useMemo(() => uniqueValues(orders.map((order) => order.destinationCountryIso2)), [orders]);
  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const paymentStatus = getPaymentStatus(order);
        return (
          (statusFilter === 'all' || order.status === statusFilter) &&
          (countryFilter === 'all' || order.destinationCountryIso2 === countryFilter) &&
          (paymentFilter === 'all' || paymentStatus === paymentFilter)
        );
      }),
    [countryFilter, orders, paymentFilter, statusFilter],
  );
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? orders[0];

  async function mutateAdmin<TBody extends object>(path: string, method: string, body: TBody) {
    const session = readAuthSession();
    if (!session) {
      setLoadState('forbidden');
      return;
    }

    setMessage('');
    await adminRequest(path, session, { method, body });
    setMessage('Admin action saved. Refresh the table to see persisted backend state.');
  }

  async function submitStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: UpdateAdminOrderStatusRequest = {
      status: String(form.get('status')) as AdminOrderStatus,
      note: String(form.get('note') || ''),
    };

    await mutateAdmin(
      adminApiContract.updateOrderStatus.path.replace(':orderId', selectedOrderId),
      adminApiContract.updateOrderStatus.method,
      payload,
    );
  }

  async function submitSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: AddSupplierReferenceRequest = {
      externalManufacturingPartner: String(form.get('externalManufacturingPartner') || ''),
      externalSupplierOrderId: String(form.get('externalSupplierOrderId') || ''),
    };

    await mutateAdmin(
      adminApiContract.supplierReference.path.replace(':orderId', selectedOrderId),
      adminApiContract.supplierReference.method,
      payload,
    );
  }

  async function submitShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: UpdateShipmentRequest = {
      carrierName: String(form.get('carrierName') || ''),
      trackingNumber: String(form.get('trackingNumber') || ''),
      estimatedDeliveryAt: String(form.get('estimatedDeliveryAt') || ''),
    };

    await mutateAdmin(
      adminApiContract.shipment.path.replace(':orderId', selectedOrderId),
      adminApiContract.shipment.method,
      payload,
    );
  }

  async function submitPricingRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: AdminPricingRule = {
      code: String(form.get('code') || ''),
      name: String(form.get('name') || ''),
      conditions: { scope: String(form.get('scope') || 'global') },
      formula: { marginRate: Number(form.get('marginRate') || 0) / 100 },
      isActive: form.get('isActive') === 'on',
    };

    await mutateAdmin(adminApiContract.upsertPricingRule.path, adminApiContract.upsertPricingRule.method, payload);
  }

  if (loadState === 'checking') {
    return (
      <AdminShell>
        <Card className="p-8 text-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-signal">Checking access</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Verifying admin session...</h2>
        </Card>
      </AdminShell>
    );
  }

  if (loadState === 'forbidden') {
    return (
      <AdminShell>
        <Card className="p-8">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-red-600">Restricted</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Admin access required</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            This panel only renders after the admin API accepts the stored bearer token with the admin role. Normal user sessions cannot view operational data.
          </p>
        </Card>
      </AdminShell>
    );
  }

  if (loadState === 'error') {
    return (
      <AdminShell>
        <Card className="p-8">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-red-600">Unavailable</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Admin API unavailable</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Start the API server and make sure `NEXT_PUBLIC_API_BASE_URL` points to it when the web and API run on different ports.
          </p>
        </Card>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Orders" value={orders.length.toString()} />
          <Metric label="Open tickets" value={supportTickets.filter((ticket) => ticket.status !== 'closed').length.toString()} />
          <Metric label="Pricing rules" value={pricingRules.length.toString()} />
          <Metric label="Audit events" value={auditLogs.length.toString()} />
        </div>

        <Card className="p-2">
          <div className="flex flex-wrap gap-2">
            {(['orders', 'pricing', 'support', 'audit'] satisfies AdminTab[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`h-10 rounded-xl px-4 text-sm font-black capitalize transition ${
                  tab === item ? 'bg-deepblue text-white' : 'bg-white text-slate-600 hover:bg-sky-50 hover:text-deepblue'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </Card>

        {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

        {tab === 'orders' && (
          <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">All orders</p>
                    <h2 className="mt-2 text-2xl font-black text-ink">Fulfillment queue</h2>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={['all', ...adminOrderStatuses]} />
                    <FilterSelect label="Country" value={countryFilter} onChange={setCountryFilter} options={['all', ...countries]} />
                    <FilterSelect label="Payment" value={paymentFilter} onChange={setPaymentFilter} options={['all', 'pending', 'paid', 'failed', 'refunded']} />
                  </div>
                </div>
              </div>
              <OrdersTable orders={filteredOrders} selectedOrderId={selectedOrderId} onSelect={setSelectedOrderId} />
            </Card>

            {selectedOrder && (
              <AdminOrderActions
                order={selectedOrder}
                onSubmitStatus={submitStatus}
                onSubmitSupplier={submitSupplier}
                onSubmitShipment={submitShipment}
              />
            )}
          </div>
        )}

        {tab === 'pricing' && <PricingPanel rules={pricingRules} intelligence={pricingIntelligence} onSubmit={submitPricingRule} />}
        {tab === 'support' && <SupportTicketsPanel tickets={supportTickets} />}
        {tab === 'audit' && <AuditLogPanel logs={auditLogs} />}
      </div>
    </AdminShell>
  );
}

function OrdersTable({
  orders,
  selectedOrderId,
  onSelect,
}: {
  orders: AdminOrderRow[];
  selectedOrderId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
        <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
          <tr>
            <th className="px-5 py-4">Order</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Payment</th>
            <th className="px-5 py-4">Country</th>
            <th className="px-5 py-4">Carrier</th>
            <th className="px-5 py-4">Delivery</th>
            <th className="px-5 py-4">Detail</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {orders.map((order) => (
            <tr key={order.id} className={selectedOrderId === order.id ? 'bg-sky-50/60' : undefined}>
              <td className="px-5 py-4">
                <button type="button" onClick={() => onSelect(order.id)} className="font-black text-deepblue">
                  {order.orderNumber}
                </button>
                <p className="mt-1 max-w-[12rem] truncate text-xs font-bold text-slate-500">{order.id}</p>
              </td>
              <td className="px-5 py-4"><AdminStatusBadge status={order.status} /></td>
              <td className="px-5 py-4"><PaymentBadge status={getPaymentStatus(order)} /></td>
              <td className="px-5 py-4 font-bold text-slate-700">{order.destinationCountryIso2}</td>
              <td className="px-5 py-4 text-slate-600">{order.carrierName || 'Pending'}</td>
              <td className="px-5 py-4 text-slate-600">{order.estimatedDeliveryAt ? formatDate(order.estimatedDeliveryAt) : 'Pending'}</td>
              <td className="px-5 py-4">
                <a href={`/orders/${order.id}`} className="font-black text-deepblue hover:text-signal-dark">Open</a>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td className="px-5 py-8 text-center text-sm font-bold text-slate-500" colSpan={7}>No orders match these filters.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AdminOrderActions({
  order,
  onSubmitStatus,
  onSubmitSupplier,
  onSubmitShipment,
}: {
  order: AdminOrderRow;
  onSubmitStatus: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitSupplier: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitShipment: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Selected order</p>
        <h2 className="mt-2 text-xl font-black text-ink">{order.orderNumber}</h2>
        <p className="mt-1 text-sm text-slate-600">{order.id}</p>
      </Card>

      <AdminForm title="Update status" onSubmit={onSubmitStatus}>
        <select name="status" defaultValue={order.status} className={fieldClassName}>
          {adminOrderStatuses.map((status) => <option key={status} value={status}>{adminStatusLabels[status]}</option>)}
        </select>
        <input name="note" placeholder="Customer-safe tracking note" className={fieldClassName} />
      </AdminForm>

      <AdminForm title="Supplier reference" onSubmit={onSubmitSupplier}>
        <input name="externalManufacturingPartner" placeholder="External partner name" className={fieldClassName} />
        <input name="externalSupplierOrderId" placeholder="Supplier order ID" className={fieldClassName} />
        <p className="text-xs font-bold text-slate-500">Admin-only. These values are never shown on customer order detail pages.</p>
      </AdminForm>

      <AdminForm title="Shipment" onSubmit={onSubmitShipment}>
        <input name="carrierName" placeholder="Carrier" defaultValue={order.carrierName} className={fieldClassName} />
        <input name="trackingNumber" placeholder="Tracking number" defaultValue={order.trackingNumber} className={fieldClassName} />
        <input name="estimatedDeliveryAt" type="date" className={fieldClassName} />
      </AdminForm>
    </div>
  );
}

function PricingPanel({
  rules,
  intelligence,
  onSubmit,
}: {
  rules: AdminPricingRule[];
  intelligence: AdminPricingIntelligence | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="space-y-6">
      {intelligence ? <PricingIntelligencePanel intelligence={intelligence} /> : null}
      <PricingRulesPanel rules={rules} onSubmit={onSubmit} />
    </div>
  );
}

function PricingIntelligencePanel({ intelligence }: { intelligence: AdminPricingIntelligence }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Snapshots" value={String(intelligence.metrics.snapshotCount)} />
        <Metric label="Buckets" value={String(intelligence.metrics.bucketCount)} />
        <Metric label="Risk buckets" value={String(intelligence.metrics.flaggedBucketCount)} />
        <Metric label="Avg buffer" value={`x${intelligence.metrics.averageBuffer.toFixed(2)}`} />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Pricing intelligence</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Recent smart buffer decisions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Quote</th>
                <th className="px-5 py-4">Supplier</th>
                <th className="px-5 py-4">Supplier price</th>
                <th className="px-5 py-4">Buffer</th>
                <th className="px-5 py-4">Service</th>
                <th className="px-5 py-4">PCB client</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {intelligence.snapshots.map((snapshot) => (
                <PricingSnapshotRow key={snapshot.id} snapshot={snapshot} />
              ))}
              {intelligence.snapshots.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-center text-sm font-bold text-slate-500" colSpan={8}>No pricing snapshots yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Buffer buckets</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Learning state</h2>
        </div>
        <SimpleTable
          headers={['Bucket', 'Buffer', 'Samples', 'Avg error', 'Confidence', 'Risk']}
          rows={intelligence.buckets.map((bucket) => bucketRow(bucket))}
        />
      </Card>
    </div>
  );
}

function PricingSnapshotRow({ snapshot }: { snapshot: AdminPricingSnapshot }) {
  return (
    <tr>
      <td className="px-5 py-4">
        <p className="font-black text-deepblue">{snapshot.quoteId.slice(0, 8)}</p>
        <p className="mt-1 text-xs text-slate-500">{snapshot.quote?.layers ?? '-'} layers / {snapshot.quote?.quantity ?? '-'} pcs</p>
      </td>
      <td className="px-5 py-4 font-bold text-slate-700">{snapshot.supplier}</td>
      <td className="px-5 py-4 text-slate-600">{formatCurrency(snapshot.supplierEstimatedPrice)}</td>
      <td className="px-5 py-4 font-black text-slate-800">x{snapshot.bufferUsed.toFixed(2)}</td>
      <td className="px-5 py-4 text-slate-600">{formatCurrency(snapshot.serviceFee)}</td>
      <td className="px-5 py-4 text-slate-600">{formatCurrency(snapshot.pcbClientPrice)}</td>
      <td className="px-5 py-4 font-black text-[#ff7a00]">{formatCurrency(snapshot.totalClientPrice)}</td>
      <td className="px-5 py-4 text-slate-600">{snapshot.confidence}</td>
    </tr>
  );
}

function bucketRow(bucket: AdminBufferBucket): string[] {
  return [
    bucket.bucketKey,
    `x${bucket.currentBuffer.toFixed(2)}`,
    String(bucket.sampleCount),
    `${(bucket.averageErrorRate * 100).toFixed(1)}%`,
    bucket.confidence,
    bucket.riskFlag ? 'Flagged' : 'OK',
  ];
}

function PricingRulesPanel({ rules, onSubmit }: { rules: AdminPricingRule[]; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Pricing margins</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Active rules</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              <tr><th className="px-5 py-4">Code</th><th className="px-5 py-4">Name</th><th className="px-5 py-4">Formula</th><th className="px-5 py-4">Active</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rules.map((rule) => (
                <tr key={rule.id ?? rule.code}>
                  <td className="px-5 py-4 font-black text-deepblue">{rule.code}</td>
                  <td className="px-5 py-4 font-bold text-slate-700">{rule.name}</td>
                  <td className="px-5 py-4 text-slate-600">{JSON.stringify(rule.formula)}</td>
                  <td className="px-5 py-4 text-slate-600">{rule.isActive === false ? 'No' : 'Yes'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <AdminForm title="Add margin rule" onSubmit={onSubmit}>
        <input name="code" placeholder="Rule code" className={fieldClassName} />
        <input name="name" placeholder="Rule name" className={fieldClassName} />
        <input name="scope" placeholder="Scope e.g. standard_pcb" className={fieldClassName} />
        <input name="marginRate" type="number" min="0" step="0.1" placeholder="Margin %" className={fieldClassName} />
        <label className="flex items-center gap-2 text-sm font-bold text-slate-600"><input name="isActive" type="checkbox" defaultChecked /> Active</label>
      </AdminForm>
    </div>
  );
}

function SupportTicketsPanel({ tickets }: { tickets: AdminSupportTicket[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Support</p>
        <h2 className="mt-2 text-2xl font-black text-ink">Tickets</h2>
      </div>
      <SimpleTable
        headers={['Ticket', 'Subject', 'Order', 'Status', 'Created']}
        rows={tickets.map((ticket) => [ticket.ticketNumber, ticket.subject, ticket.orderId ?? 'None', ticket.status, formatDate(ticket.createdAt)])}
      />
    </Card>
  );
}

function AuditLogPanel({ logs }: { logs: AdminAuditLog[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Audit trail</p>
        <h2 className="mt-2 text-2xl font-black text-ink">Admin actions</h2>
      </div>
      <SimpleTable
        headers={['Action', 'Actor', 'Target', 'Target ID', 'Created']}
        rows={logs.map((log) => [log.action, log.actorUserId, log.targetType, log.targetId ?? 'None', formatDate(log.createdAt)])}
      />
    </Card>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
        <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
          <tr>{headers.map((header) => <th key={header} className="px-5 py-4">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row) => (
            <tr key={row.join(':')}>{row.map((cell, index) => <td key={`${cell}-${index}`} className="px-5 py-4 text-slate-600">{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminForm({ title, onSubmit, children }: { title: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-black text-ink">{title}</h2>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        {children}
        <button type="submit" className="h-11 w-full rounded-xl bg-deepblue text-sm font-black text-white transition hover:bg-deepblue-dark">Save</button>
      </form>
    </Card>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClassName}>
        {options.map((option) => <option key={option} value={option}>{option === 'all' ? 'All' : option}</option>)}
      </select>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-ink">{value}</p>
    </Card>
  );
}

async function adminRequest<T>(path: string, session: { tokenType: string; accessToken: string }, options?: { method?: string; body?: object }): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options?.method ?? 'GET',
    headers: {
      Authorization: `${session.tokenType} ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 || response.status === 403) {
    throw new AdminForbiddenError();
  }

  if (!response.ok) {
    throw new Error('Admin API request failed.');
  }

  return response.json() as Promise<T>;
}

function normalizeOrder(order: AdminOrderRow): AdminOrderRow {
  return {
    ...order,
    paymentStatus: getPaymentStatus(order),
    currency: order.currency ?? 'EUR',
  };
}

function normalizePricingRules(payload: unknown): AdminPricingRule[] {
  if (Array.isArray(payload)) return payload as AdminPricingRule[];
  if (payload && typeof payload === 'object') {
    return [
      {
        code: 'active-margin-set',
        name: 'Active pricing margin set',
        conditions: { scope: 'global' },
        formula: payload as Record<string, unknown>,
        isActive: true,
      },
    ];
  }
  return [];
}

function getPaymentStatus(order: AdminOrderRow): PaymentStatus {
  if (order.paymentStatus) return order.paymentStatus;
  if (order.status === 'refunded') return 'refunded';
  if (order.paidAt || order.status !== 'awaiting_payment') return 'paid';
  return 'pending';
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

const fieldClassName =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100';

class AdminForbiddenError extends Error {}
