'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AdminShell } from '../../components/admin/AdminShell';
import { AdminStatusBadge, PaymentBadge } from '../../components/admin/AdminBadge';
import { Card } from '../../components/ui/Card';
import { readAuthSession } from '../../lib/auth-session';
import { getApiBaseUrl } from '../../lib/api-base-url';
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
  AdminSupplierConnectionTest,
  AdminSupplierOrderPackage,
  AdminPricingSnapshot,
  AdminSupportTicket,
  PrepareSupplierOrderRequest,
  RecordSupplierRealPriceRequest,
  TestSupplierConnectionRequest,
  UpdateAdminOrderStatusRequest,
  UpdateShipmentRequest,
} from '../../lib/admin-contract';
import type { PaymentStatus } from '../../lib/order-detail-contract';

type AdminLoadState = 'checking' | 'authorized' | 'forbidden' | 'error';
type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'orderValidation'
  | 'production'
  | 'delivery'
  | 'disputes'
  | 'gerberAnalysis'
  | 'gerberValidation'
  | 'gerberHistory'
  | 'clients'
  | 'companies'
  | 'clientActivity'
  | 'clientRisk'
  | 'quotes'
  | 'pricing'
  | 'buffers'
  | 'priceHistory'
  | 'suppliers'
  | 'jlcpcb'
  | 'pcbway'
  | 'futureSuppliers'
  | 'shipments'
  | 'tracking'
  | 'customs'
  | 'logisticsIncidents'
  | 'support'
  | 'urgentTickets'
  | 'afterSales'
  | 'payments'
  | 'refunds'
  | 'stripeDisputes'
  | 'analytics'
  | 'revenueAnalytics'
  | 'countryAnalytics'
  | 'performanceAnalytics'
  | 'compliance'
  | 'gdpr'
  | 'consents'
  | 'legalLogs'
  | 'settings'
  | 'users'
  | 'permissions'
  | 'apiSettings'
  | 'emailSettings'
  | 'notificationSettings';

const apiBaseUrl = getApiBaseUrl();

const adminNavigation: Array<{ title: string; items: Array<{ id: AdminTab; label: string }> }> = [
  { title: 'Pilotage', items: [{ id: 'dashboard', label: 'Dashboard' }] },
  {
    title: 'Commandes',
    items: [
      { id: 'orders', label: 'Toutes les commandes' },
      { id: 'orderValidation', label: 'À valider' },
      { id: 'production', label: 'En fabrication' },
      { id: 'delivery', label: 'En livraison' },
      { id: 'disputes', label: 'Litiges' },
    ],
  },
  {
    title: 'Fichiers Gerber',
    items: [
      { id: 'gerberAnalysis', label: 'Analyse automatique' },
      { id: 'gerberValidation', label: 'Validation manuelle' },
      { id: 'gerberHistory', label: 'Historique' },
    ],
  },
  {
    title: 'Clients',
    items: [
      { id: 'clients', label: 'Tous les clients' },
      { id: 'companies', label: 'Entreprises' },
      { id: 'clientActivity', label: 'Activité' },
      { id: 'clientRisk', label: 'Risques' },
    ],
  },
  {
    title: 'Devis & Pricing',
    items: [
      { id: 'quotes', label: 'Devis générés' },
      { id: 'pricing', label: 'Marges' },
      { id: 'buffers', label: 'Buffers' },
      { id: 'priceHistory', label: 'Historique prix' },
    ],
  },
  {
    title: 'Fournisseurs',
    items: [
      { id: 'suppliers', label: 'Vue fournisseurs' },
      { id: 'jlcpcb', label: 'JLCPCB' },
      { id: 'pcbway', label: 'PCBWay' },
      { id: 'futureSuppliers', label: 'Fournisseurs futurs' },
    ],
  },
  {
    title: 'Logistique',
    items: [
      { id: 'shipments', label: 'Expéditions' },
      { id: 'tracking', label: 'Tracking' },
      { id: 'customs', label: 'Douane' },
      { id: 'logisticsIncidents', label: 'Incidents' },
    ],
  },
  {
    title: 'Support',
    items: [
      { id: 'support', label: 'Tickets ouverts' },
      { id: 'urgentTickets', label: 'Tickets urgents' },
      { id: 'afterSales', label: 'SAV' },
    ],
  },
  {
    title: 'Paiements',
    items: [
      { id: 'payments', label: 'Transactions' },
      { id: 'refunds', label: 'Remboursements' },
      { id: 'stripeDisputes', label: 'Litiges Stripe' },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { id: 'analytics', label: 'Revenus' },
      { id: 'revenueAnalytics', label: 'Commandes' },
      { id: 'countryAnalytics', label: 'Pays' },
      { id: 'performanceAnalytics', label: 'Performance' },
    ],
  },
  {
    title: 'Conformité',
    items: [
      { id: 'compliance', label: 'RGPD' },
      { id: 'gdpr', label: 'Consentements' },
      { id: 'consents', label: 'Cookies' },
      { id: 'legalLogs', label: 'Logs légaux' },
    ],
  },
  {
    title: 'Paramètres',
    items: [
      { id: 'settings', label: 'Utilisateurs' },
      { id: 'users', label: 'Rôles' },
      { id: 'permissions', label: 'Permissions' },
      { id: 'apiSettings', label: 'API' },
      { id: 'emailSettings', label: 'Emails' },
      { id: 'notificationSettings', label: 'Notifications' },
    ],
  },
];

export default function AdminPage() {
  const [loadState, setLoadState] = useState<AdminLoadState>('checking');
  const [tab, setTab] = useState<AdminTab>('dashboard');
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
  const [supplierOrderPackage, setSupplierOrderPackage] = useState<AdminSupplierOrderPackage | null>(null);
  const [supplierConnectionTest, setSupplierConnectionTest] = useState<AdminSupplierConnectionTest | null>(null);

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
  const scopedOrders = useMemo(() => filterOrdersForAdminTab(filteredOrders, tab), [filteredOrders, tab]);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? orders[0];

  useEffect(() => {
    setSupplierOrderPackage(null);
  }, [selectedOrderId]);

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

  async function submitSupplierRealPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: RecordSupplierRealPriceRequest = {
      realSupplierPrice: Number(form.get('realSupplierPrice') || 0),
      supplierOrderId: String(form.get('supplierOrderId') || ''),
      note: String(form.get('note') || ''),
    };

    await mutateAdmin(
      adminApiContract.supplierRealPrice.path.replace(':orderId', selectedOrderId),
      adminApiContract.supplierRealPrice.method,
      payload,
    );
  }

  async function submitSupplierOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = readAuthSession();
    if (!session) {
      setLoadState('forbidden');
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload: PrepareSupplierOrderRequest = {
      mode: String(form.get('mode') || 'prepare') as PrepareSupplierOrderRequest['mode'],
      supplier: String(form.get('supplier') || 'jlcpcb'),
      note: String(form.get('note') || ''),
    };

    setMessage('');
    const result = await adminRequest<AdminSupplierOrderPackage>(
      adminApiContract.supplierOrder.path.replace(':orderId', selectedOrderId),
      session,
      { method: adminApiContract.supplierOrder.method, body: payload },
    );
    setSupplierOrderPackage(result);
    setMessage(result.mode === 'create' ? 'Supplier order creation request completed.' : 'Supplier order package prepared.');
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

  async function submitSupplierConnectionTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = readAuthSession();
    if (!session) {
      setLoadState('forbidden');
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload: TestSupplierConnectionRequest = {
      supplier: String(form.get('supplier') || 'pcbway') as TestSupplierConnectionRequest['supplier'],
    };

    setMessage('');
    const result = await adminRequest<AdminSupplierConnectionTest>(
      adminApiContract.supplierConnectionTest.path,
      session,
      { method: adminApiContract.supplierConnectionTest.method, body: payload },
    );
    setSupplierConnectionTest(result);
    setMessage(result.ok ? `${result.supplier} connection test passed.` : `${result.supplier} connection test failed.`);
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
      <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <AdminSidebar activeTab={tab} onSelect={setTab} />

        <div className="min-w-0 space-y-5">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Metric label="Commandes" value={orders.length.toString()} />
            <Metric label="CA suivi" value={formatCurrency(sumOrderTotals(orders))} />
            <Metric label="Marge moyenne" value={pricingIntelligence ? `x${pricingIntelligence.metrics.averageBuffer.toFixed(2)}` : 'x0.00'} />
            <Metric label="En attente" value={orders.filter((order) => order.status === 'awaiting_payment').length.toString()} />
            <Metric label="Tickets ouverts" value={supportTickets.filter((ticket) => ticket.status !== 'closed').length.toString()} />
            <Metric label="Bloquées" value={orders.filter((order) => ['cancelled', 'refunded'].includes(order.status)).length.toString()} />
          </div>

          {message && <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

          {tab === 'dashboard' && (
            <DashboardPanel orders={orders} tickets={supportTickets} logs={auditLogs} intelligence={pricingIntelligence} />
          )}

          {['orders', 'orderValidation', 'production', 'delivery', 'disputes'].includes(tab) && (
            <OrdersWorkspace
              tab={tab}
              orders={scopedOrders}
              selectedOrder={selectedOrder}
              selectedOrderId={selectedOrderId}
              statusFilter={statusFilter}
              countryFilter={countryFilter}
              paymentFilter={paymentFilter}
              countries={countries}
              onSelectOrder={setSelectedOrderId}
              onStatusFilter={setStatusFilter}
              onCountryFilter={setCountryFilter}
              onPaymentFilter={setPaymentFilter}
              onSubmitStatus={submitStatus}
              onSubmitSupplier={submitSupplier}
              onSubmitSupplierOrder={submitSupplierOrder}
              onSubmitSupplierRealPrice={submitSupplierRealPrice}
              onSubmitShipment={submitShipment}
              supplierOrderPackage={supplierOrderPackage}
            />
          )}

          {['quotes', 'pricing', 'buffers', 'priceHistory'].includes(tab) && (
            <PricingPanel
              rules={pricingRules}
              intelligence={pricingIntelligence}
              supplierConnectionTest={supplierConnectionTest}
              onSubmit={submitPricingRule}
              onSubmitSupplierConnectionTest={submitSupplierConnectionTest}
            />
          )}

          {['support', 'urgentTickets', 'afterSales'].includes(tab) && <SupportTicketsPanel tickets={supportTickets} />}
          {['compliance', 'gdpr', 'consents', 'legalLogs'].includes(tab) && <AuditLogPanel logs={auditLogs} />}

          {['gerberAnalysis', 'gerberValidation', 'gerberHistory'].includes(tab) && (
            <OperationalPanel
              eyebrow="Fichiers Gerber"
              title={adminTabTitle(tab)}
              description="Analyse automatique, validation manuelle, historique des fichiers, erreurs potentielles et confiance parser."
              rows={orders.map((order) => [order.orderNumber, order.quoteId, order.status, order.createdAt ? formatDate(order.createdAt) : 'Pending'])}
              columns={['Commande', 'Quote', 'Statut', 'Upload']}
            />
          )}

          {['clients', 'companies', 'clientActivity', 'clientRisk'].includes(tab) && (
            <OperationalPanel
              eyebrow="Clients"
              title={adminTabTitle(tab)}
              description="Vision 360 client : pays, volume, tickets, paiements, commandes et score de risque interne."
              rows={orders.map((order) => [order.orderNumber, order.destinationCountryIso2, getPaymentStatus(order), formatCurrency(order.totalPrice ?? 0)])}
              columns={['Dernière commande', 'Pays', 'Paiement', 'Volume']}
            />
          )}

          {['suppliers', 'jlcpcb', 'pcbway', 'futureSuppliers'].includes(tab) && (
            <SupplierPanel orders={orders} supplierConnectionTest={supplierConnectionTest} onSubmitSupplierConnectionTest={submitSupplierConnectionTest} />
          )}

          {['shipments', 'tracking', 'customs', 'logisticsIncidents'].includes(tab) && (
            <OperationalPanel
              eyebrow="Logistique"
              title={adminTabTitle(tab)}
              description="Expéditions, tracking, douane, incidents, transporteurs et ETA critiques."
              rows={orders.map((order) => [order.orderNumber, order.carrierName || 'En attente', order.trackingNumber || 'Aucun', order.estimatedDeliveryAt ? formatDate(order.estimatedDeliveryAt) : 'ETA pending'])}
              columns={['Commande', 'Transporteur', 'Tracking', 'ETA']}
            />
          )}

          {['payments', 'refunds', 'stripeDisputes'].includes(tab) && (
            <OperationalPanel
              eyebrow="Paiements"
              title={adminTabTitle(tab)}
              description="Transactions Stripe, remboursements, litiges, statuts de paiement et montants suivis."
              rows={orders.map((order) => [order.orderNumber, getPaymentStatus(order), formatCurrency(order.totalPrice ?? 0), order.paidAt ? formatDate(order.paidAt) : 'En attente'])}
              columns={['Commande', 'Statut', 'Montant', 'Date']}
            />
          )}

          {['analytics', 'revenueAnalytics', 'countryAnalytics', 'performanceAnalytics'].includes(tab) && (
            <AnalyticsPanel orders={orders} tickets={supportTickets} intelligence={pricingIntelligence} />
          )}

          {['settings', 'users', 'permissions', 'apiSettings', 'emailSettings', 'notificationSettings'].includes(tab) && (
            <OperationalPanel
              eyebrow="Paramètres"
              title={adminTabTitle(tab)}
              description="Utilisateurs, rôles, permissions, clés API, emails, notifications, maintenance et logs système."
              rows={[
                ['Stripe', 'Paiements', 'Actif', 'Dashboard fournisseur'],
                ['PCBWay', 'Fournisseur', supplierConnectionTest?.ok ? 'Connecté' : 'À vérifier', 'API partenaire'],
                ['Resend', 'Email', 'Configuré', 'Notifications'],
                ['R2/S3', 'Stockage fichiers', 'Actif', 'Gerber/BOM/CPL'],
              ]}
              columns={['Service', 'Scope', 'Statut', 'Usage']}
            />
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function AdminSidebar({ activeTab, onSelect }: { activeTab: AdminTab; onSelect: (tab: AdminTab) => void }) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-signal">Admin workspace</p>
          <h2 className="mt-2 text-lg font-black text-ink">Kendronics OS</h2>
        </div>
        <nav className="max-h-[72vh] overflow-y-auto p-2">
          {adminNavigation.map((group) => (
            <div key={group.title} className="pb-3">
              <p className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{group.title}</p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={`flex min-h-9 w-full items-center rounded-sm px-3 text-left text-sm font-bold transition ${
                      activeTab === item.id ? 'bg-[#0f8f6b] text-white' : 'text-slate-700 hover:bg-slate-50 hover:text-ink'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </Card>
    </aside>
  );
}

function DashboardPanel({
  orders,
  tickets,
  logs,
  intelligence,
}: {
  orders: AdminOrderRow[];
  tickets: AdminSupportTicket[];
  logs: AdminAuditLog[];
  intelligence: AdminPricingIntelligence | null;
}) {
  const recentOrders = orders.slice(0, 5);
  const recentLogs = logs.slice(0, 6);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Dashboard</p>
        <h2 className="mt-2 text-2xl font-black text-ink">Vue globale en 10 secondes</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <DashboardTile label="Commandes du jour" value={orders.filter((order) => isToday(order.createdAt)).length.toString()} />
          <DashboardTile label="Commandes en attente" value={orders.filter((order) => order.status === 'awaiting_payment').length.toString()} />
          <DashboardTile label="Tickets ouverts" value={tickets.filter((ticket) => ticket.status !== 'closed').length.toString()} />
          <DashboardTile label="Buffers surveillés" value={String(intelligence?.metrics.flaggedBucketCount ?? 0)} />
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Activité récente</p>
        <div className="mt-5 space-y-4">
          {recentLogs.map((log) => (
            <TimelineItem key={log.id} title={log.action} meta={`${log.targetType}${log.targetId ? ` / ${log.targetId.slice(0, 8)}` : ''}`} date={log.createdAt} />
          ))}
          {recentLogs.length === 0 ? <p className="text-sm font-bold text-slate-500">Aucune activité récente.</p> : null}
        </div>
      </Card>

      <Card className="overflow-hidden xl:col-span-2">
        <div className="border-b border-slate-100 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Production / Logistique / Finance</p>
          <h2 className="mt-2 text-xl font-black text-ink">Flux opérationnel récent</h2>
        </div>
        <OrdersTable orders={recentOrders} selectedOrderId="" onSelect={() => undefined} />
      </Card>
    </div>
  );
}

function OrdersWorkspace({
  tab,
  orders,
  selectedOrder,
  selectedOrderId,
  statusFilter,
  countryFilter,
  paymentFilter,
  countries,
  onSelectOrder,
  onStatusFilter,
  onCountryFilter,
  onPaymentFilter,
  onSubmitStatus,
  onSubmitSupplier,
  onSubmitSupplierOrder,
  onSubmitSupplierRealPrice,
  onSubmitShipment,
  supplierOrderPackage,
}: {
  tab: AdminTab;
  orders: AdminOrderRow[];
  selectedOrder?: AdminOrderRow;
  selectedOrderId: string;
  statusFilter: string;
  countryFilter: string;
  paymentFilter: string;
  countries: string[];
  onSelectOrder: (id: string) => void;
  onStatusFilter: (value: string) => void;
  onCountryFilter: (value: string) => void;
  onPaymentFilter: (value: string) => void;
  onSubmitStatus: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitSupplier: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitSupplierOrder: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitSupplierRealPrice: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitShipment: (event: FormEvent<HTMLFormElement>) => void;
  supplierOrderPackage: AdminSupplierOrderPackage | null;
}) {
  const title = adminTabTitle(tab);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Commandes</p>
              <h2 className="mt-2 text-2xl font-black text-ink">{title}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <FilterSelect label="Status" value={statusFilter} onChange={onStatusFilter} options={['all', ...adminOrderStatuses]} />
              <FilterSelect label="Country" value={countryFilter} onChange={onCountryFilter} options={['all', ...countries]} />
              <FilterSelect label="Payment" value={paymentFilter} onChange={onPaymentFilter} options={['all', 'pending', 'paid', 'failed', 'refunded']} />
            </div>
          </div>
        </div>
        <OrdersTable orders={orders} selectedOrderId={selectedOrderId} onSelect={onSelectOrder} />
      </Card>

      {selectedOrder ? (
        <AdminOrderActions
          order={selectedOrder}
          onSubmitStatus={onSubmitStatus}
          onSubmitSupplier={onSubmitSupplier}
          onSubmitSupplierOrder={onSubmitSupplierOrder}
          onSubmitSupplierRealPrice={onSubmitSupplierRealPrice}
          onSubmitShipment={onSubmitShipment}
          supplierOrderPackage={supplierOrderPackage}
        />
      ) : null}
    </div>
  );
}

function OperationalPanel({
  eyebrow,
  title,
  description,
  columns,
  rows,
}: {
  eyebrow: string;
  title: string;
  description: string;
  columns: string[];
  rows: string[][];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black text-ink">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            <tr>{columns.map((column) => <th key={column} className="px-5 py-4">{column}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.slice(0, 12).map((row, index) => (
              <tr key={`${row.join('-')}-${index}`}>
                {row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className="px-5 py-4 font-bold text-slate-700">{cell}</td>)}
              </tr>
            ))}
            {rows.length === 0 ? <tr><td className="px-5 py-8 text-center text-sm font-bold text-slate-500" colSpan={columns.length}>Aucune donnée disponible.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SupplierPanel({
  orders,
  supplierConnectionTest,
  onSubmitSupplierConnectionTest,
}: {
  orders: AdminOrderRow[];
  supplierConnectionTest: AdminSupplierConnectionTest | null;
  onSubmitSupplierConnectionTest: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="space-y-5">
      <SupplierConnectionPanel result={supplierConnectionTest} onSubmit={onSubmitSupplierConnectionTest} />
      <OperationalPanel
        eyebrow="Fournisseurs"
        title="JLCPCB / PCBWay / Fournisseurs futurs"
        description="Suivi des partenaires industriels : API, délais moyens, coût, qualité, incidents et références externes."
        columns={['Fournisseur', 'Commandes', 'API', 'Dernier statut']}
        rows={[
          ['PCBWay', orders.filter((order) => (order.externalManufacturingPartner ?? '').toLowerCase().includes('pcbway')).length.toString(), supplierConnectionTest?.supplier === 'pcbway' && supplierConnectionTest.ok ? 'Connectée' : 'À vérifier', supplierConnectionTest?.message ?? 'Pas de test récent'],
          ['JLCPCB', orders.filter((order) => (order.externalManufacturingPartner ?? '').toLowerCase().includes('jlcpcb')).length.toString(), 'Prévu', 'Fournisseur configurable'],
          ['Futurs', '0', 'Prévu', 'Marketplace fournisseur'],
        ]}
      />
    </div>
  );
}

function AnalyticsPanel({ orders, tickets, intelligence }: { orders: AdminOrderRow[]; tickets: AdminSupportTicket[]; intelligence: AdminPricingIntelligence | null }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Analytics</p>
        <h2 className="mt-2 text-2xl font-black text-ink">Croissance et performance</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <DashboardTile label="Revenu suivi" value={formatCurrency(sumOrderTotals(orders))} />
          <DashboardTile label="Panier moyen" value={formatCurrency(orders.length ? sumOrderTotals(orders) / orders.length : 0)} />
          <DashboardTile label="Pays actifs" value={uniqueValues(orders.map((order) => order.destinationCountryIso2)).length.toString()} />
          <DashboardTile label="Taux SAV" value={`${orders.length ? Math.round((tickets.length / orders.length) * 100) : 0}%`} />
        </div>
      </Card>
      <Card className="p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Pricing intelligence</p>
        <h2 className="mt-2 text-2xl font-black text-ink">Moteur Smart Buffer</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <DashboardTile label="Snapshots" value={String(intelligence?.metrics.snapshotCount ?? 0)} />
          <DashboardTile label="Buckets" value={String(intelligence?.metrics.bucketCount ?? 0)} />
          <DashboardTile label="Buckets risque" value={String(intelligence?.metrics.flaggedBucketCount ?? 0)} />
          <DashboardTile label="Buffer moyen" value={intelligence ? `x${intelligence.metrics.averageBuffer.toFixed(2)}` : 'x0.00'} />
        </div>
      </Card>
    </div>
  );
}

function DashboardTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-ink">{value}</p>
    </div>
  );
}

function TimelineItem({ title, meta, date }: { title: string; meta: string; date: string }) {
  return (
    <div className="grid grid-cols-[0.75rem_1fr] gap-3">
      <span className="mt-1 h-3 w-3 rounded-full bg-[#0f8f6b]" />
      <div>
        <p className="text-sm font-black text-ink">{title}</p>
        <p className="mt-1 text-xs font-bold text-slate-500">{meta} · {formatDate(date)}</p>
      </div>
    </div>
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
  onSubmitSupplierOrder,
  onSubmitSupplierRealPrice,
  onSubmitShipment,
  supplierOrderPackage,
}: {
  order: AdminOrderRow;
  onSubmitStatus: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitSupplier: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitSupplierOrder: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitSupplierRealPrice: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitShipment: (event: FormEvent<HTMLFormElement>) => void;
  supplierOrderPackage: AdminSupplierOrderPackage | null;
}) {
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Selected order</p>
        <h2 className="mt-2 text-xl font-black text-ink">{order.orderNumber}</h2>
        <p className="mt-1 text-sm text-slate-600">{order.id}</p>
        <p className="mt-1 text-xs font-bold text-slate-500">Quote {order.quoteId}</p>
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

      <AdminForm title="Supplier order package" onSubmit={onSubmitSupplierOrder}>
        <select name="mode" defaultValue="prepare" className={fieldClassName}>
          <option value="prepare">Prepare package</option>
          <option value="create">Create through API</option>
        </select>
        <input name="supplier" placeholder="Supplier" defaultValue={order.externalManufacturingPartner || 'jlcpcb'} className={fieldClassName} />
        <input name="note" placeholder="Internal note optional" className={fieldClassName} />
        <p className="text-xs font-bold text-slate-500">Prepare mode is assisted ordering. Create mode only works when the supplier order API is configured.</p>
      </AdminForm>

      {supplierOrderPackage ? <SupplierOrderPackagePanel packageData={supplierOrderPackage} /> : null}

      <AdminForm title="Supplier real price" onSubmit={onSubmitSupplierRealPrice}>
        <input name="realSupplierPrice" type="number" min="0.01" step="0.01" placeholder="Real supplier PCB price" className={fieldClassName} />
        <input name="supplierOrderId" placeholder="Supplier order ID optional" defaultValue={order.externalSupplierOrderId} className={fieldClassName} />
        <input name="note" placeholder="Internal note optional" className={fieldClassName} />
        <p className="text-xs font-bold text-slate-500">Updates the Smart Buffer bucket for this quote. This cost is admin-only.</p>
      </AdminForm>

      <AdminForm title="Shipment" onSubmit={onSubmitShipment}>
        <input name="carrierName" placeholder="Carrier" defaultValue={order.carrierName} className={fieldClassName} />
        <input name="trackingNumber" placeholder="Tracking number" defaultValue={order.trackingNumber} className={fieldClassName} />
        <input name="estimatedDeliveryAt" type="date" className={fieldClassName} />
      </AdminForm>
    </div>
  );
}

function SupplierOrderPackagePanel({ packageData }: { packageData: AdminSupplierOrderPackage }) {
  const analysis = packageData.gerber?.analysis;

  return (
    <Card className="p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Prepared supplier data</p>
      <h2 className="mt-2 text-lg font-black text-ink">{packageData.supplier.toUpperCase()} package</h2>
      <div className="mt-4 space-y-3 text-sm text-slate-600">
        <InfoLine label="Order" value={`${packageData.orderNumber} / ${packageData.quoteId.slice(0, 8)}`} />
        <InfoLine label="Gerber" value={packageData.gerber?.storageKey ?? 'Missing upload record'} />
        <InfoLine label="Board" value={`${packageData.pcb.layers} layers, ${packageData.pcb.lengthMm} x ${packageData.pcb.widthMm} mm, ${packageData.pcb.quantity} pcs`} />
        <InfoLine label="Parser" value={analysis ? `${analysis.complexity}, confidence ${(analysis.parserConfidence * 100).toFixed(0)}%` : 'No analysis'} />
        <InfoLine label="Supplier estimate" value={packageData.pricing.supplierEstimatedPrice == null ? 'Missing' : formatCurrency(packageData.pricing.supplierEstimatedPrice)} />
        <InfoLine label="Client PCB" value={packageData.pricing.pcbClientPrice == null ? 'Missing' : formatCurrency(packageData.pricing.pcbClientPrice)} />
        <InfoLine label="Shipping" value={packageData.pricing.shippingPrice == null ? 'Missing' : formatCurrency(packageData.pricing.shippingPrice)} />
        <InfoLine label="Buffer" value={packageData.pricing.bufferUsed == null ? 'Missing' : `x${packageData.pricing.bufferUsed.toFixed(2)}`} />
        <InfoLine label="Live API" value={packageData.liveCreateAvailable ? 'Configured' : 'Not configured'} />
        {packageData.supplierOrderId ? <InfoLine label="Supplier ID" value={packageData.supplierOrderId} /> : null}
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-600">
        {packageData.notes.join(' ')}
      </div>
    </Card>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="min-w-28 font-black text-ink">{label}</span>
      <span className="break-all">{value}</span>
    </div>
  );
}

function PricingPanel({
  rules,
  intelligence,
  supplierConnectionTest,
  onSubmit,
  onSubmitSupplierConnectionTest,
}: {
  rules: AdminPricingRule[];
  intelligence: AdminPricingIntelligence | null;
  supplierConnectionTest: AdminSupplierConnectionTest | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitSupplierConnectionTest: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="space-y-6">
      <SupplierConnectionPanel result={supplierConnectionTest} onSubmit={onSubmitSupplierConnectionTest} />
      {intelligence ? <PricingIntelligencePanel intelligence={intelligence} /> : null}
      <PricingRulesPanel rules={rules} onSubmit={onSubmit} />
    </div>
  );
}

function SupplierConnectionPanel({
  result,
  onSubmit,
}: {
  result: AdminSupplierConnectionTest | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card className="p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem] lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Supplier API</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Live connection test</h2>
        </div>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <select name="supplier" defaultValue="pcbway" className={fieldClassName}>
            <option value="pcbway">PCBWay</option>
            <option value="jlcpcb">JLCPCB</option>
          </select>
          <button type="submit" className="h-11 rounded-xl bg-deepblue px-5 text-sm font-black text-white transition hover:bg-deepblue-dark">Test</button>
        </form>
      </div>
      {result ? (
        <div className={`mt-4 rounded-xl border p-4 text-sm font-bold ${result.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
          <p>{result.message}</p>
          <p className="mt-2 text-xs">Expected env: {result.expectedEnv.join(', ')}</p>
          {result.account ? (
            <p className="mt-2 text-xs">
              Account auth: {result.account.ok ? 'accepted' : 'rejected'} / http {result.account.statusCode}
              {result.account.balance !== undefined ? ` / balance ${formatCurrency(result.account.balance)}` : ''}
              {result.account.coupon !== undefined ? ` / coupon ${formatCurrency(result.account.coupon)}` : ''}
              {result.account.point !== undefined ? ` / points ${result.account.point}` : ''}
            </p>
          ) : null}
          {result.quote ? (
            <p className="mt-2 text-xs">
              Test quote: {formatCurrency(result.quote.manufacturingPrice)} PCB, {formatCurrency(result.quote.shippingPrice)} shipping
              {result.quote.leadTimeDays ? `, ${result.quote.leadTimeDays} days` : ''}
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
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

function sumOrderTotals(orders: AdminOrderRow[]): number {
  return orders.reduce((total, order) => total + (order.totalPrice ?? 0), 0);
}

function isToday(value: string): boolean {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function adminTabTitle(tab: AdminTab): string {
  for (const group of adminNavigation) {
    const item = group.items.find((entry) => entry.id === tab);
    if (item) return item.label;
  }
  return 'Dashboard';
}

function filterOrdersForAdminTab(orders: AdminOrderRow[], tab: AdminTab): AdminOrderRow[] {
  if (tab === 'orderValidation') return orders.filter((order) => ['awaiting_payment', 'created', 'file_review'].includes(order.status));
  if (tab === 'production') return orders.filter((order) => ['production', 'quality_control'].includes(order.status));
  if (tab === 'delivery') return orders.filter((order) => ['shipped', 'in_transit', 'delivered'].includes(order.status));
  if (tab === 'disputes') return orders.filter((order) => ['cancelled', 'refunded'].includes(order.status) || getPaymentStatus(order) === 'refunded');
  return orders;
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
