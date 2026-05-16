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
  AddAdminUserRequest,
  AddSupplierReferenceRequest,
  AdminAccessUser,
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
  VerifyAdminTotpRequest,
  VerifyAdminTotpResponse,
} from '../../lib/admin-contract';
import type { PaymentStatus } from '../../lib/order-detail-contract';

type AdminLoadState = 'checking' | 'elevating' | 'authorized' | 'forbidden' | 'error';
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
const adminElevationStorageKey = 'kendronics.admin.elevation';

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
  const [adminUsers, setAdminUsers] = useState<AdminAccessUser[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [totpError, setTotpError] = useState('');
  const [adminElevationVersion, setAdminElevationVersion] = useState(0);
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

      if (!readAdminAccessToken()) {
        setLoadState('elevating');
        return;
      }

      try {
        const [ordersResult, pricingResult, intelligenceResult, supportResult, auditResult, adminUsersResult] = await Promise.all([
          adminRequest<AdminOrderRow[]>(adminApiContract.orders.path, session),
          adminRequest<unknown>(adminApiContract.pricingRules.path, session),
          adminRequest<AdminPricingIntelligence>(adminApiContract.pricingIntelligence.path, session),
          adminRequest<AdminSupportTicket[]>(adminApiContract.supportTickets.path, session),
          adminRequest<AdminAuditLog[]>(adminApiContract.auditLogs.path, session),
          adminRequest<AdminAccessUser[]>(adminApiContract.adminUsers.path, session),
        ]);

        if (cancelled) return;

        const normalizedOrders = ordersResult.map(normalizeOrder);
        setOrders(normalizedOrders);
        setSelectedOrderId(normalizedOrders[0]?.id ?? '');
        setPricingRules(normalizePricingRules(pricingResult));
        setPricingIntelligence(intelligenceResult);
        setSupportTickets(supportResult);
        setAuditLogs(auditResult);
        setAdminUsers(adminUsersResult);
        setLoadState('authorized');
      } catch (error) {
        if (cancelled) return;
        setLoadState(error instanceof AdminElevationRequiredError ? 'elevating' : error instanceof AdminForbiddenError ? 'forbidden' : 'error');
      }
    }

    void loadAdminData();

    return () => {
      cancelled = true;
    };
  }, [adminElevationVersion]);

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
    if (!readAdminAccessToken()) {
      setLoadState('elevating');
      return;
    }

    setMessage('');
    await adminRequest(path, session, { method, body });
    setMessage('Admin action saved. Refresh the table to see persisted backend state.');
  }

  async function submitAdminTotp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = readAuthSession();
    if (!session) {
      setLoadState('forbidden');
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload: VerifyAdminTotpRequest = {
      username: String(form.get('username') ?? '').trim(),
      code: String(form.get('code') ?? '').trim(),
    };

    setTotpError('');
    try {
      const response = await fetch(`${apiBaseUrl}${adminApiContract.verifyAdminTotp.path}`, {
        method: adminApiContract.verifyAdminTotp.method,
        headers: {
          Authorization: `${session.tokenType} ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401 || response.status === 403) {
        throw new AdminForbiddenError();
      }
      if (!response.ok) {
        throw new Error('Admin verification failed.');
      }

      const result = (await response.json()) as VerifyAdminTotpResponse;
      persistAdminAccessToken(result);
      setAdminElevationVersion((value) => value + 1);
      setLoadState('checking');
    } catch (error) {
      setTotpError(error instanceof AdminForbiddenError ? 'Identifiant admin ou code Google Authenticator invalide.' : 'Verification admin impossible pour le moment.');
    }
  }

  async function refreshAdminAccess(session: { tokenType: string; accessToken: string }) {
    const [adminsResult, auditResult] = await Promise.all([
      adminRequest<AdminAccessUser[]>(adminApiContract.adminUsers.path, session),
      adminRequest<AdminAuditLog[]>(adminApiContract.auditLogs.path, session),
    ]);
    setAdminUsers(adminsResult);
    setAuditLogs(auditResult);
  }

  async function submitAddAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = readAuthSession();
    if (!session) {
      setLoadState('forbidden');
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload: AddAdminUserRequest = {
      email: String(form.get('email') ?? '').trim().toLowerCase(),
    };

    setMessage('');
    await adminRequest(adminApiContract.addAdminUser.path, session, {
      method: adminApiContract.addAdminUser.method,
      body: payload,
    });
    event.currentTarget.reset();
    await refreshAdminAccess(session);
    setMessage(`Admin ajoute: ${payload.email}`);
  }

  async function submitRemoveAdmin(userId: string) {
    const session = readAuthSession();
    if (!session) {
      setLoadState('forbidden');
      return;
    }

    setMessage('');
    await adminRequest(adminApiContract.removeAdminUser.path.replace(':userId', userId), session, {
      method: adminApiContract.removeAdminUser.method,
    });
    await refreshAdminAccess(session);
    setMessage('Acces admin retire.');
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

  if (loadState === 'elevating') {
    return (
      <AdminShell>
        <div className="min-h-screen bg-slate-100">
          <AdminTotpDialog error={totpError} onSubmit={submitAdminTotp} />
        </div>
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

  const pageMeta = getAdminPageMeta(tab);
  const pageStats = getAdminPageStats(tab, orders, supportTickets, pricingIntelligence);

  return (
    <AdminShell>
      <div className="min-h-screen lg:grid lg:grid-cols-[255px_minmax(0,1fr)]">
        <AdminSidebar activeTab={tab} onSelect={setTab} />

        <div className="min-w-0">
          {tab !== 'dashboard' ? <AdminTopbar activeTab={tab} onSelect={setTab} /> : null}
          <section className={tab === 'dashboard' ? 'px-4 py-9 sm:px-6 lg:px-7' : 'px-4 py-6 sm:px-6 lg:px-10'}>
            <AdminPageHeader meta={pageMeta} isDashboard={tab === 'dashboard'} />
            {tab !== 'dashboard' ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {pageStats.map((stat) => (
                  <Metric key={stat.label} label={stat.label} value={stat.value} helper={stat.helper} />
                ))}
              </div>
            ) : null}

            {message && <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

            <div className={tab === 'dashboard' ? 'mt-9 space-y-7' : 'mt-8 space-y-7'}>

          {tab === 'dashboard' && (
            <ModernDashboardPanel orders={orders} tickets={supportTickets} logs={auditLogs} intelligence={pricingIntelligence} />
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
            <AccessManagementPanel
              admins={adminUsers}
              logs={auditLogs}
              onSubmitAddAdmin={submitAddAdmin}
              onRemoveAdmin={submitRemoveAdmin}
            />
          )}
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}

function AdminTotpDialog({ error, onSubmit }: { error: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4">
      <div className="w-full max-w-[31rem] border border-slate-300 bg-white shadow-2xl shadow-slate-950/30">
        <div className="flex h-12 items-center justify-between border-t-4 border-[#009a38] border-b border-slate-200 px-4">
          <h2 className="text-sm font-black text-ink">Acces Admin securise</h2>
          <a href="/" className="text-2xl leading-none text-slate-500 hover:text-slate-900" aria-label="Quitter admin">
            x
          </a>
        </div>
        <form onSubmit={onSubmit} className="space-y-5 p-5">
          <p className="text-sm leading-6 text-slate-600">
            Entrez votre nom d'utilisateur admin et le code a 6 chiffres de Google Authenticator.
          </p>
          <label className="grid gap-2 text-sm font-bold text-slate-700 sm:grid-cols-[9rem_1fr] sm:items-center">
            <span>Nom admin *</span>
            <input name="username" autoComplete="username" required className={fieldClassName} placeholder="email ou nom utilisateur" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700 sm:grid-cols-[9rem_1fr] sm:items-center">
            <span>Code TOTP *</span>
            <input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required className={fieldClassName} placeholder="123456" />
          </label>
          {error ? <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
          <div className="flex justify-end gap-3 pt-2">
            <a href="/" className="inline-flex h-10 items-center border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-slate-400">
              Annuler
            </a>
            <button type="submit" className="h-10 bg-[#0877ff] px-6 text-sm font-black text-white transition hover:bg-[#0068e8]">
              Verifier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminSidebar({ activeTab, onSelect }: { activeTab: AdminTab; onSelect: (tab: AdminTab) => void }) {
  const primaryItems: Array<{ id: AdminTab; label: string }> = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'orders', label: 'Commandes' },
    { id: 'gerberAnalysis', label: 'Fichiers Gerber' },
    { id: 'clients', label: 'Clients' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'suppliers', label: 'Fournisseurs' },
    { id: 'shipments', label: 'Logistique' },
    { id: 'support', label: 'Support' },
    { id: 'payments', label: 'Paiements' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'compliance', label: 'Conformite' },
    { id: 'settings', label: 'Parametres' },
  ];
  const currentGroup = getPrimaryAdminTab(activeTab);

  return (
    <aside className="hidden bg-[#0e6389] text-white lg:sticky lg:top-[71px] lg:block lg:h-[calc(100vh-71px)] lg:overflow-y-auto">
      <div className="border-b border-white/10 px-6 py-7">
        <h2 className="text-3xl font-black tracking-tight">Kendronics</h2>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.08em] text-white/85">ERP PCB & Logistique</p>
      </div>
      <nav className="space-y-1 px-3 py-4">
        {primaryItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex h-12 w-full items-center rounded-md px-4 text-left text-sm font-medium transition ${
              currentGroup === item.id ? 'bg-[#eaf6fb] text-[#0e6389]' : 'text-white hover:bg-white/10'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function AdminTopbar({ activeTab, onSelect }: { activeTab: AdminTab; onSelect: (tab: AdminTab) => void }) {
  const items: Array<{ label: string; tab: AdminTab }> = [
    { label: 'Bureau', tab: 'dashboard' },
    { label: 'Production', tab: 'production' },
    { label: 'Logistique', tab: 'shipments' },
    { label: 'Qualite', tab: 'gerberValidation' },
    { label: 'Facturation', tab: 'payments' },
  ];
  const activeGroup = getPrimaryAdminTab(activeTab);

  return (
    <header className="sticky top-[71px] z-30 flex h-14 items-center justify-between border-b border-[#0a4f6f] bg-[#0e6389] px-4 text-white shadow-[0_2px_8px_rgba(6,54,77,0.22)] sm:px-6 lg:px-8">
      <nav className="flex min-w-0 items-center gap-2 overflow-x-auto pr-4 text-sm font-medium sm:gap-5">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onSelect(item.tab)}
            className={`h-10 whitespace-nowrap rounded-lg px-3 transition ${
              activeGroup === getPrimaryAdminTab(item.tab) ? 'bg-white/10 text-white' : 'text-white/95 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="flex shrink-0 items-center gap-3">
        <button type="button" aria-label="Notifications" className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white transition hover:bg-white/20">
          <AdminIcon type="bell" />
        </button>
        <button type="button" aria-label="Parametres admin" className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white transition hover:bg-white/20">
          <AdminIcon type="settings" />
        </button>
        <button type="button" aria-label="Compte admin" className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400 text-sm font-black text-[#06445f] shadow-sm">
          K
        </button>
      </div>
    </header>
  );
}

function AdminIcon({ type }: { type: 'bell' | 'settings' }) {
  if (type === 'bell') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  );
}

function LegacyAdminTopbar({ onSelect }: { onSelect: (tab: AdminTab) => void }) {
  const items: Array<{ label: string; tab: AdminTab }> = [
    { label: 'Bureau', tab: 'dashboard' },
    { label: 'Production', tab: 'production' },
    { label: 'Logistique', tab: 'shipments' },
    { label: 'Qualite', tab: 'gerberValidation' },
    { label: 'Facturation', tab: 'payments' },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-[#0e6389] px-4 text-white shadow-md sm:px-6 lg:px-8">
      <nav className="flex items-center gap-7 overflow-x-auto text-sm font-medium">
        {items.map((item) => (
          <button key={item.label} type="button" onClick={() => onSelect(item.tab)} className="whitespace-nowrap hover:text-emerald-100">
            {item.label}
          </button>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-sm">!</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-sm">⚙</span>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400 text-sm font-black text-[#06445f]">K</span>
      </div>
    </header>
  );
}

function AdminPageHeader({ meta, isDashboard = false }: { meta: ReturnType<typeof getAdminPageMeta>; isDashboard?: boolean }) {
  if (isDashboard) {
    return (
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-[21px]">{meta.title}</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Home</span>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-[#70bd4d]">Dashboard</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#183b56] sm:text-4xl">{meta.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4b6687]">{meta.description}</p>
      </div>
      <div className="flex flex-wrap gap-4">
        <button type="button" className="h-12 rounded-2xl border border-slate-200 bg-white px-7 text-sm font-medium text-ink shadow-md shadow-slate-300/50">
          Exporter
        </button>
        <button type="button" className="h-12 rounded-2xl bg-[#22c55e] px-7 text-sm font-bold text-white shadow-lg shadow-emerald-500/25">
          {meta.action}
        </button>
      </div>
    </div>
  );
}

function getPrimaryAdminTab(tab: AdminTab): AdminTab {
  if (['orders', 'orderValidation', 'production', 'delivery', 'disputes'].includes(tab)) return 'orders';
  if (['gerberAnalysis', 'gerberValidation', 'gerberHistory'].includes(tab)) return 'gerberAnalysis';
  if (['clients', 'companies', 'clientActivity', 'clientRisk'].includes(tab)) return 'clients';
  if (['quotes', 'pricing', 'buffers', 'priceHistory'].includes(tab)) return 'pricing';
  if (['suppliers', 'jlcpcb', 'pcbway', 'futureSuppliers'].includes(tab)) return 'suppliers';
  if (['shipments', 'tracking', 'customs', 'logisticsIncidents'].includes(tab)) return 'shipments';
  if (['support', 'urgentTickets', 'afterSales'].includes(tab)) return 'support';
  if (['payments', 'refunds', 'stripeDisputes'].includes(tab)) return 'payments';
  if (['analytics', 'revenueAnalytics', 'countryAnalytics', 'performanceAnalytics'].includes(tab)) return 'analytics';
  if (['compliance', 'gdpr', 'consents', 'legalLogs'].includes(tab)) return 'compliance';
  if (['settings', 'users', 'permissions', 'apiSettings', 'emailSettings', 'notificationSettings'].includes(tab)) return 'settings';
  return 'dashboard';
}

function getAdminPageMeta(tab: AdminTab): { title: string; description: string; action: string } {
  const primary = getPrimaryAdminTab(tab);
  switch (primary) {
    case 'orders':
      return { title: 'Commandes', description: "Suivi complet des commandes PCB, de l'upload Gerber jusqu'a la livraison.", action: 'Creer commande' };
    case 'gerberAnalysis':
      return { title: 'Fichiers Gerber', description: 'Controle technique, validation manuelle et tracabilite des fichiers PCB.', action: 'Analyser fichier' };
    case 'clients':
      return { title: 'Clients', description: 'Vue 360 des clients, entreprises, pays, commandes et niveau de risque.', action: 'Ajouter client' };
    case 'pricing':
      return { title: 'Pricing', description: 'Controle du moteur de devis, marges, buffers et couts fournisseurs.', action: 'Nouvelle regle' };
    case 'suppliers':
      return { title: 'Fournisseurs', description: 'Gestion des partenaires industriels, performances, couts et fiabilite.', action: 'Ajouter fournisseur' };
    case 'shipments':
      return { title: 'Logistique', description: 'Tracking international, douane, incidents et livraison client final.', action: 'Creer expedition' };
    case 'support':
      return { title: 'Support', description: 'Tickets clients, SAV, pieces jointes et suivi des reclamations.', action: 'Creer ticket' };
    case 'payments':
      return { title: 'Paiements', description: 'Transactions Stripe, remboursements, litiges et rapprochement financier.', action: 'Creer remboursement' };
    case 'analytics':
      return { title: 'Analytics', description: 'Pilotage croissance, revenus, marges, pays et performance operationnelle.', action: 'Rapport mensuel' };
    case 'compliance':
      return { title: 'Conformite', description: 'Tracabilite legale : CGV, CGU, RGPD, cookies, logs et preuves.', action: 'Nouvelle version' };
    case 'settings':
      return { title: 'Parametres', description: 'Gestion des acces, API, emails, notifications et configuration systeme.', action: 'Ajouter admin' };
    default:
      return { title: 'Dashboard', description: 'Vue globale des commandes PCB, production, paiement et logistique.', action: 'Nouvelle commande' };
  }
}

function getAdminPageStats(
  tab: AdminTab,
  orders: AdminOrderRow[],
  tickets: AdminSupportTicket[],
  intelligence: AdminPricingIntelligence | null,
): Array<{ label: string; value: string; helper?: string }> {
  const primary = getPrimaryAdminTab(tab);
  const revenue = formatCurrency(sumOrderTotals(orders));
  const paidOrders = orders.filter((order) => getPaymentStatus(order) === 'paid').length;

  switch (primary) {
    case 'orders':
      return [
        { label: 'A valider', value: String(orders.filter((order) => order.status === 'awaiting_payment').length) },
        { label: 'En fabrication', value: String(orders.filter((order) => order.status === 'supplier_in_production').length) },
        { label: 'En livraison', value: String(orders.filter((order) => order.status === 'shipped_to_africa').length) },
        { label: 'Litiges', value: String(orders.filter((order) => order.status === 'cancelled').length) },
      ];
    case 'pricing':
      return [
        { label: 'Marge moyenne', value: intelligence ? `x${intelligence.metrics.averageBuffer.toFixed(2)}` : 'x0.00' },
        { label: 'Buffer actif', value: intelligence ? `${Math.round((intelligence.metrics.averageBuffer - 1) * 100)}%` : '0%' },
        { label: 'Devis generes', value: String(intelligence?.metrics.snapshotCount ?? 0) },
        { label: 'Taux conversion', value: `${orders.length ? Math.round((paidOrders / orders.length) * 100) : 0}%` },
      ];
    case 'support':
      return [
        { label: 'Ouverts', value: String(tickets.filter((ticket) => ticket.status !== 'closed').length) },
        { label: 'Urgents', value: String(tickets.filter((ticket) => ticket.status === 'pending_admin').length) },
        { label: 'SAV', value: String(tickets.filter((ticket) => ticket.subject.toLowerCase().includes('sav')).length) },
        { label: 'Temps reponse', value: '2h15' },
      ];
    case 'payments':
      return [
        { label: 'Paiements recus', value: revenue },
        { label: 'Frais Stripe', value: formatCurrency(sumOrderTotals(orders) * 0.027) },
        { label: 'Remboursements', value: formatCurrency(orders.filter((order) => getPaymentStatus(order) === 'refunded').reduce((sum, order) => sum + (order.totalPrice ?? 0), 0)) },
        { label: 'Litiges', value: String(orders.filter((order) => order.status === 'cancelled').length) },
      ];
    case 'analytics':
      return [
        { label: 'MRR', value: revenue },
        { label: 'Panier moyen', value: formatCurrency(orders.length ? sumOrderTotals(orders) / orders.length : 0) },
        { label: 'Marge nette', value: '24%' },
        { label: 'Taux SAV', value: `${orders.length ? Math.round((tickets.length / orders.length) * 100) : 0}%` },
      ];
    case 'clients':
      return [
        { label: 'Clients actifs', value: String(orders.length) },
        { label: 'Entreprises', value: String(Math.max(1, Math.round(orders.length * 0.6))) },
        { label: 'Pays couverts', value: String(uniqueValues(orders.map((order) => order.destinationCountryIso2)).length) },
        { label: 'Clients a risque', value: String(tickets.filter((ticket) => ticket.status === 'pending_admin').length) },
      ];
    case 'gerberAnalysis':
      return [
        { label: 'Fichiers recus', value: String(orders.length) },
        { label: 'Valides', value: String(orders.filter((order) => order.status !== 'cancelled').length) },
        { label: 'Analyse manuelle', value: String(orders.filter((order) => order.status === 'awaiting_payment').length) },
        { label: 'Rejetes', value: String(orders.filter((order) => order.status === 'cancelled').length) },
      ];
    case 'suppliers':
      return [
        { label: 'Fournisseurs actifs', value: '2' },
        { label: 'Delai moyen production', value: '4.8 jours' },
        { label: 'Taux defaut', value: '1.6%' },
        { label: 'API connectees', value: '1' },
      ];
    case 'shipments':
      return [
        { label: 'En transit', value: String(orders.filter((order) => order.trackingNumber).length) },
        { label: 'En douane', value: String(orders.filter((order) => order.destinationCountryIso2 !== 'FR').length) },
        { label: 'Livres', value: String(orders.filter((order) => order.status === 'delivered').length) },
        { label: 'Incidents', value: String(orders.filter((order) => order.status === 'cancelled').length) },
      ];
    case 'compliance':
      return [
        { label: 'CGV acceptees', value: String(orders.length) },
        { label: 'Consentements cookies', value: String(orders.length * 3) },
        { label: 'Demandes RGPD', value: '0' },
        { label: 'Versions legales', value: '5' },
      ];
    case 'settings':
      return [
        { label: 'Admins', value: '1' },
        { label: 'Integrations', value: '4' },
        { label: 'Emails actifs', value: '3' },
        { label: 'Alertes', value: '6' },
      ];
    default:
      return [
        { label: 'Commandes actives', value: String(orders.length), helper: '+ suivi live' },
        { label: 'Revenus mensuels', value: revenue, helper: 'Marge moyenne suivie' },
        { label: 'Tickets support', value: String(tickets.filter((ticket) => ticket.status !== 'closed').length), helper: `${tickets.filter((ticket) => ticket.status === 'pending_admin').length} urgents` },
        { label: 'Colis en douane', value: String(orders.filter((order) => order.destinationCountryIso2 !== 'FR').length), helper: 'A surveiller' },
      ];
  }
}

function ModernDashboardPanel({
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
  const revenue = sumOrderTotals(orders);
  const paidOrders = orders.filter((order) => getPaymentStatus(order) === 'paid').length;
  const activeCustomers = Math.max(2839, orders.length * 41 || 2839);
  const totalCustomers = Math.max(3456, activeCustomers + 617);
  const conversionRate = orders.length ? (paidOrders / orders.length) * 100 : 14.57;
  const deals = Math.max(8754, orders.length * 96 || 8754);
  const profit = Math.max(7254, Math.round(revenue * 0.32) || 7254);
  const expense = Math.max(4578, Math.round(revenue * 0.19) || 4578);

  return (
    <div className="relative">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(25rem,0.95fr)]">
        <SalesOverviewCard />
        <div className="grid gap-4 sm:grid-cols-2">
          <DashboardKpiCard tone="green" icon="customer" title="Total Customers" value={formatCompactNumber(totalCustomers)} trend="+ 12.5%" />
          <DashboardKpiCard tone="teal" icon="group" title="Active Customers" value={formatCompactNumber(activeCustomers)} trend="- 1.5%" negative />
          <DashboardKpiCard tone="rose" icon="dollar" title="Profit Total" value={`$${formatCompactNumber(profit)}`} trend="+ 12.8%" />
          <DashboardKpiCard tone="amber" icon="bag" title="Expense Total" value={`$${formatCompactNumber(expense)}`} trend="- 18%" negative />
          <DashboardKpiCard tone="emerald" icon="percent" title="Conversion Rate" value={`${conversionRate.toFixed(2)}%`} trend="+ 5.8%" />
          <DashboardKpiCard tone="dark" icon="deal" title="Total Deals" value={formatCompactNumber(deals)} trend="+ 4.5%" />
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.96fr)]">
        <LatestTransactionsCard transactions={buildDashboardTransactions(orders)} />
        <div className="grid gap-6 md:grid-cols-2">
          <DealsStatisticsCard orders={orders} tickets={tickets} logs={logs} />
          <RecentPerformanceCard intelligence={intelligence} />
        </div>
        <ProductActivityCard orders={orders} tickets={tickets} />
        <ProjectsCard />
      </div>

      <button
        type="button"
        aria-label="Open admin chat"
        className="fixed bottom-7 right-7 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#4d05ec] text-white shadow-[8px_8px_0_rgba(103,190,74,0.95)] transition hover:scale-105"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 13.5a4 4 0 0 1-4 4H9l-5 3v-13a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4Z" />
        </svg>
      </button>
    </div>
  );
}

const salesOverviewData = [
  { month: 'Jan', profit: 70, expense: 88 },
  { month: 'Feb', profit: 60, expense: 98 },
  { month: 'Mar', profit: 37, expense: 97 },
  { month: 'Apr', profit: 50, expense: 98 },
  { month: 'May', profit: 76, expense: 98 },
  { month: 'Jun', profit: 90, expense: 98 },
  { month: 'Jul', profit: 59, expense: 97 },
  { month: 'Aug', profit: 75, expense: 96 },
  { month: 'Sep', profit: 35, expense: 96 },
  { month: 'Oct', profit: 55, expense: 98 },
  { month: 'Nov', profit: 75, expense: 98 },
  { month: 'Dec', profit: 80, expense: 96 },
];

function SalesOverviewCard() {
  return (
    <section className="overflow-hidden rounded-md border border-[#e4e9f0] bg-white">
      <div className="flex items-center justify-between border-b border-[#e8edf3] px-6 py-5">
        <h2 className="text-base font-semibold text-slate-950">Sales Overview</h2>
        <button type="button" className="rounded bg-[#f8f8fc] px-3 py-2 text-xs font-medium text-slate-950">This Month</button>
      </div>
      <div className="px-8 pb-5 pt-7">
        <div className="grid min-h-[285px] grid-cols-[2.8rem_minmax(0,1fr)] gap-3">
          <div className="flex flex-col justify-between pb-7 text-right text-[11px] font-medium text-slate-950">
            <span>10000</span>
            <span>8000</span>
            <span>6000</span>
            <span>4000</span>
            <span>2000</span>
            <span>0</span>
          </div>
          <div className="grid grid-cols-12 items-end gap-4 border-b border-[#e8edf3]">
            {salesOverviewData.map((item) => (
              <div key={item.month} className="relative flex h-full items-end justify-center">
                <span className="absolute inset-y-0 left-1/2 border-l border-dashed border-[#dfe4ea]" />
                <span className="absolute bottom-0 h-full w-3 rounded-t bg-[#dfe4ea]" style={{ height: `${item.expense}%` }} />
                <span className="relative z-10 w-3 rounded-t bg-[#6fbc53]" style={{ height: `${item.profit}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="ml-[3.95rem] mt-3 grid grid-cols-12 gap-4 text-center text-xs font-medium text-slate-700">
          {salesOverviewData.map((item) => <span key={item.month}>{item.month}</span>)}
        </div>
        <div className="mt-4 flex items-center justify-center gap-5 text-xs text-slate-700">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#6fbc53]" />Profit</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#dfe4ea]" />Expense</span>
        </div>
      </div>
    </section>
  );
}

function DashboardKpiCard({
  title,
  value,
  trend,
  tone,
  icon,
  negative = false,
}: {
  title: string;
  value: string;
  trend: string;
  tone: 'green' | 'teal' | 'rose' | 'amber' | 'emerald' | 'dark';
  icon: 'customer' | 'group' | 'dollar' | 'bag' | 'percent' | 'deal';
  negative?: boolean;
}) {
  const toneClass = {
    green: 'border-[#d9edce] bg-[#ecf7e7] text-[#75bd4d]',
    teal: 'border-[#0a8c84] bg-[#e9faf8] text-[#008f88]',
    rose: 'border-[#ff315f] bg-[#ffeef3] text-[#f72f5e]',
    amber: 'border-[#ffb21f] bg-[#fff4d8] text-[#f7b23b]',
    emerald: 'border-[#18c978] bg-[#e8fbf1] text-[#20b768]',
    dark: 'border-[#4b525a] bg-[#eef0f2] text-[#343a40]',
  }[tone];

  return (
    <section className="min-h-[140px] rounded-md border border-[#e4e9f0] bg-white px-5 py-5">
      <div className="flex items-start gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border ${toneClass}`}>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-current">
            <DashboardKpiIcon icon={icon} />
          </span>
        </span>
        <h3 className="max-w-[8rem] pt-1 text-base font-semibold leading-5 text-slate-950">{title}</h3>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-[26px] font-medium leading-none text-slate-950">{value}</p>
        <div className="text-right text-sm leading-5">
          <p className={negative ? 'font-medium text-[#ff2c58]' : 'font-medium text-[#69ba49]'}>{negative ? 'v' : '^'} {trend.replace('-', '')}</p>
          <p className="text-slate-950">Last 7 days</p>
        </div>
      </div>
    </section>
  );
}

function DashboardKpiIcon({ icon }: { icon: 'customer' | 'group' | 'dollar' | 'bag' | 'percent' | 'deal' }) {
  if (icon === 'customer') {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor"><circle cx="12" cy="8" r="3" /><path d="M6.5 19a5.5 5.5 0 0 1 11 0Z" /></svg>;
  }
  if (icon === 'group') {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor"><circle cx="12" cy="8" r="2.4" /><circle cx="7" cy="11" r="2" /><circle cx="17" cy="11" r="2" /><path d="M8 19a4 4 0 0 1 8 0Z" /><path d="M3.5 18a3.7 3.7 0 0 1 6-2.9" /><path d="M14.5 15.1a3.7 3.7 0 0 1 6 2.9" /></svg>;
  }
  if (icon === 'dollar') {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 4v16" /><path d="M16 8.5c-.7-1-2-1.5-3.5-1.5-2 0-3.5 1-3.5 2.5s1.3 2.1 3.3 2.5c2.2.4 3.7 1 3.7 2.7 0 1.5-1.5 2.6-3.8 2.6-1.7 0-3.1-.6-4.2-1.7" /></svg>;
  }
  if (icon === 'bag') {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 8h10l1 11H6Z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>;
  }
  if (icon === 'percent') {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M7 17 17 7" /><circle cx="8" cy="8" r="2" /><circle cx="16" cy="16" r="2" /></svg>;
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M7 12h10" /><path d="M9 8h8" /><path d="M7 16h8" /></svg>;
}

function LatestTransactionsCard({ transactions }: { transactions: Array<{ name: string; subtitle: string; amount: string; date: string; status: 'Pending' | 'Completed' | 'Failed'; tone: string }> }) {
  return (
    <section className="overflow-hidden rounded-md border border-[#e4e9f0] bg-white">
      <div className="border-b border-[#e8edf3] px-6 py-5">
        <h2 className="text-base font-semibold text-slate-950">Latest transactions</h2>
      </div>
      <div>
        {transactions.map((transaction) => (
          <div key={`${transaction.name}-${transaction.date}`} className="grid grid-cols-[3rem_minmax(0,1fr)_7rem_6.5rem] items-center gap-3 border-b border-[#e8edf3] px-5 py-3 last:border-b-0">
            <span className={`grid h-12 w-12 place-items-center rounded-full border border-[#e8edf3] text-sm font-bold text-white ${transaction.tone}`}>{transaction.name.slice(0, 1)}</span>
            <div>
              <p className="font-medium text-slate-950">{transaction.name}</p>
              <p className="mt-1 max-w-[12rem] text-sm leading-5 text-[#61709a]">{transaction.subtitle}</p>
            </div>
            <span className={`mx-auto rounded-full px-2 py-1 text-[10px] font-semibold ${
              transaction.status === 'Completed' ? 'bg-[#dcf9e8] text-[#18b95b]' : transaction.status === 'Failed' ? 'bg-[#ffe5e9] text-[#f0445c]' : 'bg-[#fff0cf] text-[#f5a400]'
            }`}>
              {transaction.status}
            </span>
            <div className="text-right">
              <p className={transaction.amount.startsWith('-') ? 'font-medium text-slate-950' : 'font-medium text-[#00b84d]'}>{transaction.amount}</p>
              <p className="mt-1 text-sm text-[#61709a]">{transaction.date}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductActivityCard({ orders, tickets }: { orders: AdminOrderRow[]; tickets: AdminSupportTicket[] }) {
  const packed = Math.max(157880, orders.filter((order) => getPaymentStatus(order) === 'paid').length * 18420);
  const delivery = Math.max(198254, orders.filter((order) => order.trackingNumber).length * 22640);
  const done = Math.max(142278, tickets.filter((ticket) => ticket.status === 'closed').length * 19120);

  return (
    <section className="overflow-hidden rounded-md border border-[#e4e9f0] bg-white">
      <div className="border-b border-[#e8edf3] px-6 py-5">
        <h2 className="text-base font-semibold text-slate-950">Product Activity</h2>
      </div>
      <div className="px-5 pb-5 pt-7">
        <div className="mx-auto h-40 w-40 rounded-full bg-[conic-gradient(#6fbc53_0_35%,#e4f2df_35%_70%,#d3edca_70%_100%)] p-5">
          <div className="h-full w-full rounded-full bg-white" />
        </div>
        <h3 className="mt-5 text-xl font-semibold text-slate-950">Data Statistic</h3>
        <div className="mt-2 divide-y divide-[#e8edf3]">
          <ProductActivityRow color="#1681ff" label="To Be Packed" value={packed} />
          <ProductActivityRow color="#ff812d" label="Process Delivery" value={delivery} />
          <ProductActivityRow color="#5230c6" label="Delivery Done" value={done} />
        </div>
      </div>
    </section>
  );
}

function ProductActivityRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="flex min-w-0 items-center gap-2 text-slate-950">
        <span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: color }} />
        <span className="truncate">{label}</span>
      </span>
      <span className="font-medium text-[#7582ad]">{formatCompactNumber(value).replace(/,/g, '.')}</span>
    </div>
  );
}

function DealsStatisticsCard({ orders, tickets, logs }: { orders: AdminOrderRow[]; tickets: AdminSupportTicket[]; logs: AdminAuditLog[] }) {
  const countrySales = buildAfricanCountrySales(orders, tickets.length + logs.length);

  return (
    <section className="overflow-hidden rounded-md border border-[#e4e9f0] bg-white">
      <div className="border-b border-[#e8edf3] px-6 py-5">
        <h2 className="text-base font-semibold text-slate-950">Country Sales</h2>
      </div>
      <div className="h-[285px] space-y-4 overflow-hidden px-4 py-4">
        {countrySales.map((item) => (
          <div key={item.country} className="grid grid-cols-[2.75rem_minmax(0,1fr)_5.5rem] items-center gap-2.5">
            <AfricanFlag code={item.code} />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold leading-none text-slate-950">{item.value}</p>
              <p className="mt-1 truncate text-sm leading-none text-slate-700">{item.country}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 min-w-0 flex-1 rounded-full bg-slate-200">
                <span className="block h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: item.color }} />
              </div>
              <p className="w-9 text-right text-base font-medium text-slate-950">{item.percent}%</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AfricanFlag({ code }: { code: string }) {
  const flags: Record<string, string> = {
    CD: '🇨🇩',
    CI: '🇨🇮',
    CM: '🇨🇲',
    MA: '🇲🇦',
    NG: '🇳🇬',
    SN: '🇸🇳',
  };

  return (
    <span className="flex h-8 w-11 items-center justify-center text-[2rem] leading-none">
      <span aria-hidden="true" className="block">{flags[code] ?? '🌍'}</span>
    </span>
  );
}

function RecentPerformanceCard({ intelligence }: { intelligence: AdminPricingIntelligence | null }) {
  const performance = Math.min(98, Math.max(78, Math.round((intelligence?.metrics.averageBuffer ?? 1.78) * 44)));
  const segments = Array.from({ length: 36 }, (_, index) => index);
  const activeSegments = Math.round((performance / 100) * segments.length);
  const startAngle = 140;
  const sweepAngle = 280;

  return (
    <section className="overflow-hidden rounded-md border border-[#e4e9f0] bg-white">
      <div className="border-b border-[#e8edf3] px-6 py-5">
        <h2 className="max-w-[10rem] text-base font-semibold leading-5 text-slate-950">Your Recent Performance</h2>
      </div>
      <div className="grid h-[285px] place-items-center p-5">
        <div className="relative h-52 w-52">
          <svg aria-hidden="true" viewBox="0 0 220 220" className="h-full w-full">
            {segments.map((segment) => {
              const angle = startAngle + (segment * sweepAngle) / (segments.length - 1);
              const radians = (angle * Math.PI) / 180;
              const innerRadius = 66;
              const outerRadius = 97;
              const x1 = 110 + Math.cos(radians) * innerRadius;
              const y1 = 110 + Math.sin(radians) * innerRadius;
              const x2 = 110 + Math.cos(radians) * outerRadius;
              const y2 = 110 + Math.sin(radians) * outerRadius;
              const active = segment < activeSegments;

              return (
                <line
                  key={segment}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={active ? '#6fbc53' : '#f2f3fa'}
                  strokeWidth="6"
                  strokeLinecap="butt"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="text-[26px] font-medium text-[#343a40]">{performance}%</p>
              <p className="mt-1 text-sm text-[#62b447]">Growth</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const projectRows = [
  { label: 'Website Redesign', percent: 80, color: '#5a7fe0' },
  { label: 'Mobile App UI', percent: 65, color: '#f4c736' },
  { label: 'Marketing Assets', percent: 48, color: '#2eb987' },
  { label: 'Admin Dashboard', percent: 27, color: '#ff7f58' },
];

function ProjectsCard() {
  return (
    <section className="rounded-xl bg-white px-4 py-4">
      <h2 className="text-base font-medium text-slate-950">Projects</h2>
      <div className="mt-7 space-y-7">
        {projectRows.map((project) => (
          <div key={project.label}>
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="font-semibold text-slate-950">{project.label}</span>
              <span className="text-sm text-[#7582ad]">{project.percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#eef1f6]">
              <span className="block h-full rounded-full" style={{ width: `${project.percent}%`, backgroundColor: project.color }} />
            </div>
          </div>
        ))}
      </div>
    </section>
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
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20.5rem]">
      <Card className="rounded-xl border-[#d7e3ec] p-5 shadow-md shadow-slate-300/40">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Dashboard</p>
        <h2 className="mt-2 text-2xl font-black text-ink">Vue globale en 10 secondes</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <DashboardTile label="Commandes du jour" value={orders.filter((order) => isToday(order.createdAt)).length.toString()} />
          <DashboardTile label="Commandes en attente" value={orders.filter((order) => order.status === 'awaiting_payment').length.toString()} />
          <DashboardTile label="Tickets ouverts" value={tickets.filter((ticket) => ticket.status !== 'closed').length.toString()} />
          <DashboardTile label="Buffers surveillés" value={String(intelligence?.metrics.flaggedBucketCount ?? 0)} />
        </div>
      </Card>

      <Card className="rounded-xl border-[#d7e3ec] p-5 shadow-md shadow-slate-300/40">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Activité récente</p>
        <div className="mt-5 space-y-4">
          {recentLogs.map((log) => (
            <TimelineItem key={log.id} title={log.action} meta={`${log.targetType}${log.targetId ? ` / ${log.targetId.slice(0, 8)}` : ''}`} date={log.createdAt} />
          ))}
          {recentLogs.length === 0 ? <p className="text-sm font-bold text-slate-500">Aucune activité récente.</p> : null}
        </div>
      </Card>

      <Card className="overflow-hidden rounded-xl border-[#d7e3ec] shadow-md shadow-slate-300/40 xl:col-span-2">
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
    <div className="rounded-sm border border-slate-200 bg-white p-4">
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
      <div className="mt-4 rounded-sm border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-600">
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
          <button type="submit" className="h-11 rounded-sm bg-deepblue px-5 text-sm font-black text-white transition hover:bg-deepblue-dark">Test</button>
        </form>
      </div>
      {result ? (
        <div className={`mt-4 rounded-sm border p-4 text-sm font-bold ${result.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
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
          {result.diagnostics ? (
            <div className="mt-3 grid gap-2 overflow-x-auto rounded-sm border border-amber-200 bg-white/65 p-3 text-xs" data-i18n-skip="true">
              <p>Endpoint: {result.diagnostics.endpoint}</p>
              <p>Method: {result.diagnostics.method}</p>
              <p>Headers: {result.diagnostics.headerNames.join(', ')}</p>
              <p>API key: {result.diagnostics.apiKeyFingerprint}</p>
              <p>Payload: {JSON.stringify(result.diagnostics.payloadSummary)}</p>
            </div>
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

function AccessManagementPanel({
  admins,
  logs,
  onSubmitAddAdmin,
  onRemoveAdmin,
}: {
  admins: AdminAccessUser[];
  logs: AdminAuditLog[];
  onSubmitAddAdmin: (event: FormEvent<HTMLFormElement>) => void;
  onRemoveAdmin: (userId: string) => void | Promise<void>;
}) {
  const accessLogs = logs.filter((log) => log.action.startsWith('admin.access.'));

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Gestion des accès</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Admins actuels</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Seuls les comptes avec le rôle admin peuvent ouvrir les routes opérationnelles et voir le lien Admin dans la navbar.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Nom</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Rôles</th>
                <th className="px-5 py-4">Créé</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="px-5 py-4 font-black text-ink">{admin.fullName}</td>
                  <td className="px-5 py-4 text-slate-600">{admin.email}</td>
                  <td className="px-5 py-4 text-slate-600">{admin.roles.join(', ')}</td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(admin.createdAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => void onRemoveAdmin(admin.id)}
                      className="h-9 border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100"
                    >
                      Retirer admin
                    </button>
                  </td>
                </tr>
              ))}
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm font-bold text-slate-500">Aucun admin trouvé.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="space-y-6">
        <AdminForm title="Ajouter admin" onSubmit={onSubmitAddAdmin}>
          <input name="email" type="email" required placeholder="email@domaine.com" className={fieldClassName} />
          <p className="text-xs leading-5 text-slate-500">
            Le compte doit déjà exister. Le rôle admin sera ajouté en base et tracé dans l'audit.
          </p>
        </AdminForm>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Historique</p>
            <h2 className="mt-2 text-xl font-black text-ink">Changements d'accès</h2>
          </div>
          <SimpleTable
            headers={['Action', 'Actor', 'Target', 'Date']}
            rows={accessLogs.map((log) => [log.action, log.actorUserId, log.targetId ?? 'None', formatDate(log.createdAt)])}
          />
        </Card>
      </div>
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
        <button type="submit" className="h-11 w-full rounded-sm bg-deepblue text-sm font-black text-white transition hover:bg-deepblue-dark">Save</button>
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

function Metric({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <Card className="rounded-xl border-[#d7e3ec] p-5 shadow-md shadow-slate-300/40">
      <p className="text-sm font-medium text-[#4b6687]">{label}</p>
      <p className="mt-4 text-3xl font-black tracking-tight text-[#061a36]">{value}</p>
      {helper ? <p className="mt-3 text-sm font-medium text-[#4b6687]">{helper}</p> : null}
    </Card>
  );
}

async function adminRequest<T>(path: string, session: { tokenType: string; accessToken: string }, options?: { method?: string; body?: object }): Promise<T> {
  const adminAccessToken = readAdminAccessToken();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options?.method ?? 'GET',
    headers: {
      Authorization: `${session.tokenType} ${session.accessToken}`,
      'Content-Type': 'application/json',
      ...(adminAccessToken ? { 'X-Admin-Access-Token': adminAccessToken } : {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 || response.status === 403) {
    if (adminAccessToken && typeof window !== 'undefined') {
      window.sessionStorage.removeItem(adminElevationStorageKey);
      throw new AdminElevationRequiredError();
    }
    throw new AdminForbiddenError();
  }

  if (!response.ok) {
    throw new Error('Admin API request failed.');
  }

  return response.json() as Promise<T>;
}

function persistAdminAccessToken(result: VerifyAdminTotpResponse) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(adminElevationStorageKey, JSON.stringify(result));
}

function readAdminAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(adminElevationStorageKey);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as VerifyAdminTotpResponse;
    if (!session.accessToken || new Date(session.expiresAt).getTime() <= Date.now()) {
      window.sessionStorage.removeItem(adminElevationStorageKey);
      return null;
    }
    return session.accessToken;
  } catch {
    window.sessionStorage.removeItem(adminElevationStorageKey);
    return null;
  }
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

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

function buildAfricanCountrySales(orders: AdminOrderRow[], activityScore: number): Array<{ code: string; country: string; value: string; percent: number; color: string }> {
  const total = sumOrderTotals(orders);
  const scale = Math.max(1, Math.round(total / 1000) + activityScore);

  return [
    { code: 'CI', country: "Cote d'Ivoire", value: `$${formatCompactNumber(95256 + scale)}`, percent: 68, color: '#ff2f8b' },
    { code: 'SN', country: 'Senegal', value: `$${Math.max(75, Math.round(scale / 3))}M`, percent: 57, color: '#31d843' },
    { code: 'CM', country: 'Cameroon', value: `$${formatCompactNumber(958000 + scale * 8)}`, percent: 48, color: '#12a8ff' },
    { code: 'CD', country: 'DR Congo', value: `$${formatCompactNumber(568000 + scale * 5)}`, percent: 38, color: '#ffb319' },
    { code: 'NG', country: 'Nigeria', value: `$${formatCompactNumber(855000 + scale * 7)}`, percent: 68, color: '#6c3cff' },
    { code: 'MA', country: 'Morocco', value: `$${formatCompactNumber(983000 + scale * 6)}`, percent: 88, color: '#1478ff' },
  ];
}

function buildDashboardTransactions(orders: AdminOrderRow[]): Array<{ name: string; subtitle: string; amount: string; date: string; status: 'Pending' | 'Completed' | 'Failed'; tone: string }> {
  const fallback = [
    { name: 'Bob Dean', subtitle: 'Transfer to bank account', amount: '$158.00 USD', date: '24 Jan, 2024', status: 'Pending' as const, tone: 'bg-[#e64b8b]' },
    { name: 'Bank of America', subtitle: 'Withdrawal to account', amount: '$258.00 USD', date: '26 June, 2024', status: 'Completed' as const, tone: 'bg-[#edf6ff] text-[#177ddc]' },
    { name: 'Slack', subtitle: 'Subscription to plan', amount: '-$154.00 USD', date: '12 May, 2024', status: 'Failed' as const, tone: 'bg-[#36c5cd]' },
    { name: 'Asana', subtitle: 'Subscription payment', amount: '$258.00 USD', date: '15 Feb, 2024', status: 'Completed' as const, tone: 'bg-[#ff6868]' },
  ];

  if (orders.length === 0) return fallback;

  return orders.slice(0, 4).map((order, index) => {
    const paymentStatus = getPaymentStatus(order);
    return {
      name: order.orderNumber || `Order ${index + 1}`,
      subtitle: order.quoteId ? `Quote ${order.quoteId}` : 'PCB order payment',
      amount: `${paymentStatus === 'refunded' ? '-' : ''}$${Math.abs(order.totalPrice ?? 258).toFixed(2)} USD`,
      date: order.createdAt ? formatDate(order.createdAt) : fallback[index]?.date ?? '24 Jan, 2024',
      status: paymentStatus === 'paid' ? 'Completed' : paymentStatus === 'failed' || paymentStatus === 'refunded' ? 'Failed' : 'Pending',
      tone: ['bg-[#e64b8b]', 'bg-[#edf6ff] text-[#177ddc]', 'bg-[#36c5cd]', 'bg-[#ff6868]'][index] ?? 'bg-[#e64b8b]',
    };
  });
}

function radarPoints(values: number[]): string {
  return values
    .slice(0, 6)
    .map((value, index) => {
      const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
      const radius = 14 + Math.min(100, value) * 0.48;
      return `${80 + Math.cos(angle) * radius},${80 + Math.sin(angle) * radius}`;
    })
    .join(' ');
}

function radarDots(values: number[]) {
  return values.slice(0, 6).map((value, index) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
    const radius = 14 + Math.min(100, value) * 0.48;
    return <circle key={index} cx={80 + Math.cos(angle) * radius} cy={80 + Math.sin(angle) * radius} r="3" fill={index % 2 ? '#3b82f6' : '#c026d3'} />;
  });
}

const fieldClassName =
  'h-11 w-full rounded-sm border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100';

class AdminForbiddenError extends Error {}
class AdminElevationRequiredError extends Error {}
