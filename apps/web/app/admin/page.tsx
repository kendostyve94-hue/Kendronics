'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AdminShell } from '../../components/admin/AdminShell';
import { AdminStatusBadge, PaymentBadge } from '../../components/admin/AdminBadge';
import { Card } from '../../components/ui/Card';
import { africanCountries } from '../../lib/african-countries';
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
  SetupAdminCodeRequest,
  StartAdminCodeResponse,
  VerifyAdminCodeRequest,
  VerifyAdminCodeResponse,
} from '../../lib/admin-contract';
import type { PaymentStatus } from '../../lib/order-detail-contract';

type AdminLoadState = 'checking' | 'elevating' | 'authorized' | 'forbidden' | 'error';
type AdminCodeStep = 'email' | 'setup' | 'personal';
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
  const [adminCodeError, setAdminCodeError] = useState('');
  const [adminCodeStep, setAdminCodeStep] = useState<AdminCodeStep>('email');
  const [adminProfessionalEmail, setAdminProfessionalEmail] = useState('');
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

  async function submitAdminCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = readAuthSession();
    if (!session) {
      setLoadState('forbidden');
      return;
    }

    const form = new FormData(event.currentTarget);
    const mode = String(form.get('mode') ?? 'email');
    const adminEmail = String(form.get('adminEmail') ?? adminProfessionalEmail).trim().toLowerCase();

    setAdminCodeError('');
    try {
      if (mode === 'email') {
        const response = await fetch(`${apiBaseUrl}${adminApiContract.startAdminCode.path}`, {
          method: adminApiContract.startAdminCode.method,
          headers: {
            Authorization: `${session.tokenType} ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ adminEmail }),
        });

        if (response.status === 401 || response.status === 403) {
          throw new AdminForbiddenError();
        }
        if (!response.ok) {
          throw new Error('Admin verification failed.');
        }

        const result = (await response.json()) as StartAdminCodeResponse;
        setAdminProfessionalEmail(adminEmail);
        setAdminCodeStep(result.status === 'setup_code_sent' ? 'setup' : 'personal');
        return;
      }

      const contract = mode === 'setup' ? adminApiContract.setupAdminCode : adminApiContract.verifyAdminCode;
      const payload: VerifyAdminCodeRequest | SetupAdminCodeRequest =
        mode === 'setup'
          ? {
              adminEmail,
              code: String(form.get('setupCode') ?? '').trim(),
              personalCode: String(form.get('personalCode') ?? '').trim(),
            }
          : {
              adminEmail,
              code: String(form.get('personalCode') ?? '').trim(),
            };

      const response = await fetch(`${apiBaseUrl}${contract.path}`, {
        method: contract.method,
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

      const result = (await response.json()) as VerifyAdminCodeResponse;
      persistAdminAccessToken(result);
      setAdminElevationVersion((value) => value + 1);
      setLoadState('checking');
    } catch (error) {
      setAdminCodeError(error instanceof AdminForbiddenError ? 'Acces admin refuse. Verifiez les informations saisies.' : 'Verification admin impossible pour le moment.');
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
      professionalEmail: String(form.get('professionalEmail') ?? '').trim().toLowerCase(),
      accessRoles: form.getAll('accessRoles').map((role) => String(role)),
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

  async function submitRemoveAdmin(accessId: string) {
    const session = readAuthSession();
    if (!session) {
      setLoadState('forbidden');
      return;
    }

    setMessage('');
    await adminRequest(adminApiContract.removeAdminUser.path.replace(':accessId', accessId), session, {
      method: adminApiContract.removeAdminUser.method,
    });
    await refreshAdminAccess(session);
    setMessage('Acces admin retire.');
  }

  async function submitResetAdminCode(accessId: string) {
    const session = readAuthSession();
    if (!session) {
      setLoadState('forbidden');
      return;
    }

    setMessage('');
    await adminRequest(adminApiContract.resetAdminCode.path.replace(':accessId', accessId), session, {
      method: adminApiContract.resetAdminCode.method,
    });
    await refreshAdminAccess(session);
    setMessage('Code admin reinitialise. Un code temporaire a ete envoye par e-mail.');
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
          <AdminCodeDialog
            error={adminCodeError}
            professionalEmail={adminProfessionalEmail}
            step={adminCodeStep}
            onSubmit={submitAdminCode}
          />
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
  const pageStats = getAdminPageStats(tab, orders, supportTickets, pricingIntelligence, auditLogs, adminUsers);
  const isAnalyticsTab = ['analytics', 'revenueAnalytics', 'countryAnalytics', 'performanceAnalytics'].includes(tab);

  return (
    <AdminShell>
      <div className="min-h-screen lg:grid lg:grid-cols-[255px_minmax(0,1fr)]">
        <AdminSidebar activeTab={tab} onSelect={setTab} />

        <div className="min-w-0">
          {tab !== 'dashboard' && !isAnalyticsTab ? <AdminTopbar activeTab={tab} onSelect={setTab} /> : null}
          <section className={tab === 'dashboard' ? 'px-4 py-9 sm:px-6 lg:px-7' : isAnalyticsTab ? 'px-0 py-0' : 'px-4 py-6 sm:px-6 lg:px-10'}>
            {!isAnalyticsTab ? <AdminPageHeader meta={pageMeta} isDashboard={tab === 'dashboard'} /> : null}
            {tab !== 'dashboard' && !isAnalyticsTab ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {pageStats.map((stat) => (
                  <Metric key={stat.label} label={stat.label} value={stat.value} helper={stat.helper} />
                ))}
              </div>
            ) : null}

            {message && <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

            <div className={tab === 'dashboard' ? 'mt-9 space-y-7' : isAnalyticsTab ? 'space-y-0' : 'mt-8 space-y-7'}>

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
              onResetAdminCode={submitResetAdminCode}
            />
          )}
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}

function AdminCodeDialog({
  error,
  professionalEmail,
  step,
  onSubmit,
}: {
  error: string;
  professionalEmail: string;
  step: AdminCodeStep;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [adminEmail, setAdminEmail] = useState(professionalEmail);
  const [setupCode, setSetupCode] = useState('');
  const [personalCode, setPersonalCode] = useState('');
  const effectiveEmail = professionalEmail || adminEmail;
  const canSubmit =
    step === 'email'
      ? adminEmail.trim().length > 0
      : step === 'setup'
        ? /^\d{6}$/.test(setupCode.trim()) && personalCode.trim().length >= 6
        : personalCode.trim().length >= 6;

  useEffect(() => {
    if (professionalEmail) setAdminEmail(professionalEmail);
  }, [professionalEmail]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4">
      <div className="w-full max-w-[31rem] border border-slate-300 bg-white">
        <div className="flex h-12 items-center justify-between border-b-4 border-[#009a38] px-4">
          <h2 className="text-sm font-normal text-ink">Acces admin securise</h2>
          <a href="/" className="text-2xl leading-none text-slate-500 hover:text-slate-900" aria-label="Quitter admin">
            x
          </a>
        </div>
        <form onSubmit={onSubmit} className="space-y-5 p-5">
          <input type="hidden" name="mode" value={step} />
          <p className="text-sm leading-6 text-slate-600">
            Confirmez votre acces administrateur avec votre adresse professionnelle et votre code personnel.
          </p>
          <label className="grid gap-2 text-sm font-normal text-slate-700 sm:grid-cols-[9rem_1fr] sm:items-center">
            <span>E-mail admin *</span>
            <input
              name="adminEmail"
              type="email"
              autoComplete="email"
              required
              className={fieldClassName}
              placeholder="adresse professionnelle autorisee"
              value={effectiveEmail}
              readOnly={step !== 'email'}
              onChange={(event) => setAdminEmail(event.target.value)}
            />
          </label>
          {step === 'setup' ? (
            <label className="grid gap-2 text-sm font-normal text-slate-700 sm:grid-cols-[9rem_1fr] sm:items-center">
              <span>Code recu *</span>
              <input
                name="setupCode"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="one-time-code"
                required
                className={fieldClassName}
                placeholder="code a 6 chiffres"
                value={setupCode}
                onChange={(event) => setSetupCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </label>
          ) : null}
          {step !== 'email' ? (
            <label className="grid gap-2 text-sm font-normal text-slate-700 sm:grid-cols-[9rem_1fr] sm:items-center">
              <span>{step === 'setup' ? 'Nouveau code *' : 'Code personnel *'}</span>
              <input
                name="personalCode"
                type="password"
                autoComplete={step === 'setup' ? 'new-password' : 'current-password'}
                required
                minLength={6}
                maxLength={32}
                className={fieldClassName}
                placeholder="code personnel admin"
                value={personalCode}
                onChange={(event) => setPersonalCode(event.target.value)}
              />
            </label>
          ) : null}
          {step === 'setup' ? (
            <p className="text-xs leading-5 text-slate-500">
              Un code temporaire vient d'etre envoye a l'adresse professionnelle. Definissez ensuite votre code personnel.
            </p>
          ) : null}
          {error ? <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-normal text-red-700">{error}</p> : null}
          <div className="flex justify-end gap-3 pt-2">
            <a href="/" className="inline-flex h-10 items-center border border-slate-200 bg-white px-5 text-sm font-normal text-slate-700 transition hover:border-slate-400">
              Annuler
            </a>
            <button
              type="submit"
              disabled={!canSubmit}
              className="h-10 bg-[#0877ff] px-6 text-sm font-normal text-white transition hover:bg-[#0068e8] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              {step === 'email' ? 'Continuer' : 'Verifier'}
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
  logs: AdminAuditLog[],
  admins: AdminAccessUser[],
): Array<{ label: string; value: string; helper?: string }> {
  const primary = getPrimaryAdminTab(tab);
  const revenue = formatCurrency(sumOrderTotals(orders));
  const paidOrders = orders.filter((order) => getPaymentStatus(order) === 'paid').length;

  switch (primary) {
    case 'orders':
      return [
        { label: 'A valider', value: String(orders.filter((order) => order.status === 'awaiting_payment').length) },
        { label: 'En fabrication', value: String(orders.filter((order) => order.status === 'supplier_in_production').length) },
        { label: 'En livraison', value: String(orders.filter((order) => ['shipped_to_africa', 'customs_processing', 'out_for_delivery'].includes(order.status)).length) },
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
        { label: 'Contacts publics', value: String(tickets.filter((ticket) => ticket.userId === 'public-contact').length) },
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
        { label: 'Marge nette', value: intelligence ? `${Math.round(((intelligence.metrics.totals.pcbClientPrice - intelligence.metrics.totals.supplierEstimatedPrice) / Math.max(intelligence.metrics.totals.pcbClientPrice, 1)) * 100)}%` : '0%' },
        { label: 'Taux SAV', value: `${orders.length ? Math.round((tickets.length / orders.length) * 100) : 0}%` },
      ];
    case 'clients':
      return [
        { label: 'Clients actifs', value: String(uniqueValues(orders.map((order) => order.userId)).length) },
        { label: 'Clients 30 jours', value: String(uniqueValues(orders.filter((order) => isRecentDate(order.createdAt, 30)).map((order) => order.userId)).length) },
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
        { label: 'Fournisseurs actifs', value: String(uniqueValues(orders.map((order) => order.externalManufacturingPartner ?? '')).length) },
        { label: 'Commandes 3PL', value: String(orders.filter((order) => order.status === 'china_3pl_received').length) },
        { label: 'Taux defaut', value: `${orders.length ? Math.round((orders.filter((order) => order.status === 'cancelled' || order.status === 'refunded').length / orders.length) * 100) : 0}%` },
        { label: 'API connectees', value: String(uniqueValues(orders.map((order) => order.externalManufacturingPartner ?? '')).length) },
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
        { label: 'Logs audit', value: String(logs.length) },
        { label: 'Actions 30 jours', value: String(logs.filter((log) => isRecentDate(log.createdAt, 30)).length) },
        { label: 'Demandes support', value: String(tickets.length) },
      ];
    case 'settings':
      return [
        { label: 'Admins actifs', value: String(admins.filter((admin) => admin.status === 'active').length) },
        { label: 'Admins verrouilles', value: String(admins.filter((admin) => admin.status === 'locked').length) },
        { label: 'Roles declares', value: String(uniqueValues(admins.flatMap((admin) => admin.accessRoles)).length) },
        { label: 'Audits recents', value: String(logs.filter((log) => isRecentDate(log.createdAt, 30)).length) },
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
  const paidOrders = orders.filter((order) => getPaymentStatus(order) === 'paid').length;
  const productionOrders = orders.filter((order) => ['supplier_order_pending', 'supplier_ordered', 'supplier_in_production'].includes(order.status)).length;
  const activeCustomers = uniqueValues(orders.filter((order) => isRecentDate(order.createdAt, 30)).map((order) => order.userId)).length;
  const conversionRate = orders.length ? (paidOrders / orders.length) * 100 : 0;
  const shipments = orders.filter((order) => Boolean(order.trackingNumber) || ['shipped_to_africa', 'customs_processing', 'out_for_delivery', 'delivered'].includes(order.status)).length;
  const deliveredParcels = orders.filter((order) => order.status === 'delivered').length;
  const supportMessages = tickets.length;

  return (
    <div className="relative rounded-md border border-[#12324a] bg-[#061d2d] p-4 text-white">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(25rem,0.95fr)]">
        <SalesOverviewCard orders={orders} intelligence={intelligence} />
        <div className="grid gap-4 sm:grid-cols-2">
          <DashboardKpiCard tone="green" icon="bag" title="Commandes en production" value={formatCompactNumber(productionOrders)} trend={`${shareOf(productionOrders, orders.length)}%`} caption="des commandes" />
          <DashboardKpiCard tone="teal" icon="group" title="Clients actifs" value={formatCompactNumber(activeCustomers)} trend={`${shareOf(activeCustomers, orders.length)}%`} caption="30 jours" />
          <DashboardKpiCard tone="emerald" icon="percent" title="Taux de conversion" value={`${conversionRate.toFixed(2)}%`} trend={`${conversionRate.toFixed(1)}%`} caption="devis > paiement" />
          <DashboardKpiCard tone="amber" icon="shipment" title="Expeditions" value={formatCompactNumber(shipments)} trend={`${shareOf(shipments, orders.length)}%`} caption="colis suivis" />
          <DashboardKpiCard tone="dark" icon="delivered" title="Colis recus" value={formatCompactNumber(deliveredParcels)} trend={`${shareOf(deliveredParcels, orders.length)}%`} caption="livres" />
          <DashboardKpiCard tone="rose" icon="support" title="Tickets support" value={formatCompactNumber(supportMessages)} trend={`${shareOf(supportMessages, Math.max(orders.length, supportMessages))}%`} caption="messages recus" />
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.96fr)]">
        <LatestTransactionsCard transactions={buildDashboardTransactions(orders)} />
        <div className="grid gap-6 md:grid-cols-2">
          <DealsStatisticsCard orders={orders} />
          <RecentPerformanceCard orders={orders} />
        </div>
        <ProductActivityCard orders={orders} />
        <ProjectsCard orders={orders} />
      </div>
    </div>
  );
}

function SalesOverviewCard({ orders, intelligence }: { orders: AdminOrderRow[]; intelligence: AdminPricingIntelligence | null }) {
  const [period, setPeriod] = useState<SalesOverviewPeriod>('year');
  const quoteSeries = buildQuoteSeries(orders, intelligence?.snapshots ?? [], period);
  const maxValue = Math.max(...quoteSeries.flatMap((item) => [item.quotes, item.paid]), 1);
  const scaleLabels = buildScaleLabels(maxValue);

  return (
    <section className="overflow-hidden rounded-md border border-[#11516b] bg-[#08263a]">
      <div className="flex items-center justify-between border-b border-[#143b58] px-6 py-5">
        <h2 className="text-base font-semibold text-white">Devis vs commandes payees</h2>
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value as SalesOverviewPeriod)}
          className="rounded-sm border border-[#1f4a68] bg-[#0b3047] px-3 py-2 text-xs font-medium text-white outline-none"
        >
          <option value="year">Cette annee</option>
          <option value="month">Ce mois</option>
        </select>
      </div>
      <div className="px-8 pb-5 pt-7">
        <div className="grid min-h-[285px] grid-cols-[2.8rem_minmax(0,1fr)] gap-3">
          <div className="flex flex-col justify-between pb-7 text-right text-[11px] font-medium text-white/70">
            {scaleLabels.map((label) => <span key={label}>{label}</span>)}
          </div>
          <div className={`grid items-end gap-4 border-b border-[#24465c] ${period === 'month' ? 'grid-cols-4' : 'grid-cols-12'}`}>
            {quoteSeries.map((item) => (
              <div key={item.month} className="relative flex h-full items-end justify-center">
                <span className="absolute inset-y-0 left-1/2 border-l border-dashed border-[#143b58]" />
                <span className="absolute bottom-0 h-full w-3 rounded-t bg-[#17415a]" style={{ height: `${Math.max((item.quotes / maxValue) * 100, item.quotes ? 4 : 0)}%` }} />
                <span className="relative z-10 w-3 rounded-t bg-[#36d679]" style={{ height: `${Math.max((item.paid / maxValue) * 100, item.paid ? 4 : 0)}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className={`ml-[3.95rem] mt-3 grid gap-4 text-center text-xs font-medium text-white/65 ${period === 'month' ? 'grid-cols-4' : 'grid-cols-12'}`}>
          {quoteSeries.map((item) => <span key={item.month}>{item.month}</span>)}
        </div>
        <div className="mt-4 flex items-center justify-center gap-5 text-xs text-white/70">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#36d679]" />Commandes payees</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#17415a]" />Devis crees</span>
        </div>
      </div>
    </section>
  );
}

function DashboardKpiCard({
  title,
  value,
  trend,
  caption,
  tone,
  icon,
}: {
  title: string;
  value: string;
  trend: string;
  caption: string;
  tone: 'green' | 'teal' | 'rose' | 'amber' | 'emerald' | 'dark';
  icon: 'customer' | 'group' | 'dollar' | 'bag' | 'percent' | 'deal' | 'shipment' | 'delivered' | 'support';
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
    <section className="min-h-[140px] rounded-md border border-[#11516b] bg-[#08263a] px-5 py-5">
      <div className="flex items-start gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-sm border ${toneClass}`}>
          <span className="grid h-8 w-8 place-items-center rounded-sm bg-current">
            <DashboardKpiIcon icon={icon} />
          </span>
        </span>
        <h3 className="max-w-[8rem] pt-1 text-base font-semibold leading-5 text-white">{title}</h3>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-[26px] font-medium leading-none text-white">{value}</p>
        <div className="text-right text-sm leading-5">
          <p className="font-medium text-[#65d84f]">^ {trend}</p>
          <p className="text-white/70">{caption}</p>
        </div>
      </div>
    </section>
  );
}

function DashboardKpiIcon({ icon }: { icon: 'customer' | 'group' | 'dollar' | 'bag' | 'percent' | 'deal' | 'shipment' | 'delivered' | 'support' }) {
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
  if (icon === 'shipment') {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h11v10H3Z" /><path d="M14 10h4l3 3v4h-7Z" /><circle cx="7" cy="18" r="1.5" /><circle cx="18" cy="18" r="1.5" /></svg>;
  }
  if (icon === 'delivered') {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12 9 17 20 6" /><path d="M4 19h16" /></svg>;
  }
  if (icon === 'support') {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-8 8H8l-5 2 1.8-4A8 8 0 1 1 21 12Z" /><path d="M8 11h8" /><path d="M8 15h5" /></svg>;
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M7 12h10" /><path d="M9 8h8" /><path d="M7 16h8" /></svg>;
}

type SalesOverviewPeriod = 'year' | 'month';

function buildQuoteSeries(orders: AdminOrderRow[], snapshots: AdminPricingSnapshot[], period: SalesOverviewPeriod) {
  return period === 'month' ? buildCurrentMonthQuoteSeries(orders, snapshots) : buildMonthlyQuoteSeries(orders, snapshots);
}

function buildCurrentMonthQuoteSeries(orders: AdminOrderRow[], snapshots: AdminPricingSnapshot[]) {
  const now = new Date();
  const series = [
    { month: 'S1', quotes: 0, paid: 0 },
    { month: 'S2', quotes: 0, paid: 0 },
    { month: 'S3', quotes: 0, paid: 0 },
    { month: 'S4', quotes: 0, paid: 0 },
  ];
  const quoteIds = new Set<string>();

  for (const snapshot of snapshots) {
    const quoteId = snapshot.quote?.id ?? snapshot.quoteId;
    if (!quoteId || quoteIds.has(quoteId)) continue;
    const createdAt = new Date(snapshot.quote?.createdAt ?? snapshot.createdAt);
    if (createdAt.getFullYear() !== now.getFullYear() || createdAt.getMonth() !== now.getMonth()) continue;
    quoteIds.add(quoteId);
    series[monthWeekIndex(createdAt)].quotes += 1;
  }

  for (const order of orders) {
    const createdAt = new Date(order.createdAt);
    if (createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth() && snapshots.length === 0 && !quoteIds.has(order.quoteId)) {
      quoteIds.add(order.quoteId);
      series[monthWeekIndex(createdAt)].quotes += 1;
    }
    const paidAt = order.paidAt ? new Date(order.paidAt) : createdAt;
    if (paidAt.getFullYear() === now.getFullYear() && paidAt.getMonth() === now.getMonth() && getPaymentStatus(order) === 'paid') {
      series[monthWeekIndex(paidAt)].paid += 1;
    }
  }

  return series;
}

function monthWeekIndex(date: Date): number {
  return Math.min(3, Math.floor((date.getDate() - 1) / 7));
}

function buildMonthlyQuoteSeries(orders: AdminOrderRow[], snapshots: AdminPricingSnapshot[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const series = months.map((month) => ({ month, quotes: 0, paid: 0 }));

  const quoteIds = new Set<string>();
  for (const snapshot of snapshots) {
    const quoteId = snapshot.quote?.id ?? snapshot.quoteId;
    if (!quoteId || quoteIds.has(quoteId)) continue;
    const createdAt = snapshot.quote?.createdAt ?? snapshot.createdAt;
    const date = new Date(createdAt);
    if (date.getFullYear() !== currentYear) continue;
    quoteIds.add(quoteId);
    series[date.getMonth()].quotes += 1;
  }

  for (const order of orders) {
    const createdAt = new Date(order.createdAt);
    if (createdAt.getFullYear() === currentYear && snapshots.length === 0) {
      const quoteId = order.quoteId;
      if (!quoteIds.has(quoteId)) {
        quoteIds.add(quoteId);
        series[createdAt.getMonth()].quotes += 1;
      }
    }
    const paidAt = order.paidAt ? new Date(order.paidAt) : createdAt;
    if (paidAt.getFullYear() !== currentYear) continue;
    if (getPaymentStatus(order) === 'paid') series[paidAt.getMonth()].paid += 1;
  }

  return series;
}

function buildScaleLabels(maxValue: number) {
  const top = Math.max(5, Math.ceil(maxValue / 5) * 5);
  return [top, Math.round(top * 0.8), Math.round(top * 0.6), Math.round(top * 0.4), Math.round(top * 0.2), 0].map(String);
}

function LatestTransactionsCard({ transactions }: { transactions: Array<{ name: string; subtitle: string; amount: string; date: string; status: 'Pending' | 'Completed' | 'Failed'; tone: string; progress: number }> }) {
  return (
    <section className="overflow-hidden rounded-md border border-[#11516b] bg-[#08263a]">
      <div className="border-b border-[#143b58] px-6 py-5">
        <h2 className="text-base font-semibold text-white">Activite recente</h2>
      </div>
      <div>
        {transactions.length === 0 ? (
          <p className="px-5 py-8 text-sm text-white/55">Aucune commande recente disponible.</p>
        ) : (
          transactions.map((transaction) => (
            <div key={`${transaction.name}-${transaction.date}`} className="grid grid-cols-[3rem_minmax(0,1fr)_7rem_6.5rem] items-center gap-3 border-b border-[#143b58] px-5 py-3 last:border-b-0">
              <span className={`grid h-12 w-12 place-items-center rounded-sm border border-[#143b58] text-sm font-bold text-white ${transaction.tone}`}>{transaction.name.slice(0, 1)}</span>
              <div>
                <p className="font-medium text-white">{transaction.name}</p>
                <p className="mt-1 max-w-[12rem] text-sm leading-5 text-white/60">{transaction.subtitle}</p>
              </div>
              <span className={`mx-auto rounded-full px-2 py-1 text-[10px] font-semibold ${
                transaction.status === 'Completed' ? 'bg-[#dcf9e8] text-[#18b95b]' : transaction.status === 'Failed' ? 'bg-[#ffe5e9] text-[#f0445c]' : 'bg-[#fff0cf] text-[#f5a400]'
              }`}>
                {transaction.status}
              </span>
              <div className="text-right">
                <p className="font-medium text-[#36d679]">{transaction.amount}</p>
                <p className="mt-1 text-sm text-white/60">{transaction.date}</p>
                <span className="mt-2 grid grid-cols-[1fr_2rem] items-center gap-1">
                  <span className="h-1.5 bg-[#0c3149]"><span className="block h-full bg-[#36d679]" style={{ width: `${transaction.progress}%` }} /></span>
                  <span className="text-[10px] text-white/50">{transaction.progress}%</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function ProductActivityCard({ orders }: { orders: AdminOrderRow[] }) {
  const regionStats = buildAfricanRegionStats(orders);
  const conicStops = buildConicGradient(regionStats);

  return (
    <section className="overflow-hidden rounded-md border border-[#11516b] bg-[#08263a]">
      <div className="border-b border-[#143b58] px-6 py-5">
        <h2 className="text-base font-semibold text-white">Regions Afrique</h2>
      </div>
      <div className="px-5 pb-5 pt-6">
        <div className="mx-auto h-28 w-28 rounded-full p-4" style={{ background: conicStops }}>
          <div className="grid h-full w-full place-items-center rounded-full bg-[#08263a]">
            <span className="text-lg font-semibold text-[#6fbc53]">100%</span>
          </div>
        </div>
        <h3 className="mt-4 text-base font-semibold text-white">Repartition par zone</h3>
        <div className="mt-2 divide-y divide-[#143b58]">
          {regionStats.map((region) => (
            <ProductActivityRow key={region.label} color={region.color} label={region.label} value={`${region.percent}% (${region.orders})`} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductActivityRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="flex min-w-0 items-center gap-2 text-white/75">
        <span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: color }} />
        <span className="truncate">{label}</span>
      </span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function buildAfricanRegionStats(orders: AdminOrderRow[]): Array<{ label: string; percent: number; orders: number; color: string }> {
  const regionDefinitions = [
    { id: 'AFRICA_WEST', label: "Afrique de l'Ouest", color: '#6fbc53' },
    { id: 'AFRICA_CENTRAL', label: 'Afrique Centrale', color: '#9ed78b' },
    { id: 'AFRICA_NORTH', label: 'Afrique du Nord', color: '#d3edca' },
    { id: 'AFRICA_EAST', label: "Afrique de l'Est", color: '#2eb987' },
    { id: 'AFRICA_SOUTHERN', label: 'Afrique Australe', color: '#0e6389' },
    { id: 'AFRICA_ISLANDS', label: 'Iles africaines', color: '#1478ff' },
  ];
  const countriesByIso = new Map(africanCountries.map((country) => [country.iso2, country]));
  const counts = new Map(regionDefinitions.map((region) => [region.id, 0]));

  for (const order of orders) {
    const code = order.destinationCountryIso2.trim().toUpperCase();
    const country = countriesByIso.get(code);
    if (!country) continue;
    counts.set(country.logisticsZone, (counts.get(country.logisticsZone) ?? 0) + 1);
  }

  const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0);
  const ranked = regionDefinitions
    .map((region, index) => ({
      ...region,
      orders: counts.get(region.id) ?? 0,
      rank: index,
      rawPercent: total ? ((counts.get(region.id) ?? 0) / total) * 100 : 0,
    }))
    .sort((left, right) => right.orders - left.orders || left.rank - right.rank);

  let remaining = 100;
  return ranked.map((region, index) => {
    const percent = total === 0 ? 0 : index === ranked.length - 1 ? remaining : Math.round(region.rawPercent);
    remaining -= percent;
    return {
      label: region.label,
      percent,
      orders: region.orders,
      color: region.color,
    };
  });
}

function buildConicGradient(items: Array<{ percent: number; color: string }>) {
  if (items.every((item) => item.percent === 0)) return 'conic-gradient(#f2f3fa 0% 100%)';

  let cursor = 0;
  const stops = items.map((item) => {
    const start = cursor;
    cursor += item.percent;
    return `${item.color} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(',')})`;
}

function DealsStatisticsCard({ orders }: { orders: AdminOrderRow[] }) {
  const countrySales = buildAfricanCountrySales(orders);

  return (
    <section className="overflow-hidden rounded-md border border-[#11516b] bg-[#08263a]">
      <div className="border-b border-[#143b58] px-6 py-5">
        <h2 className="text-base font-semibold text-white">Top pays africains</h2>
      </div>
      <div className="h-[285px] space-y-4 overflow-hidden px-4 py-4">
        {countrySales.length === 0 ? (
          <p className="px-1 py-8 text-sm text-white/55">Aucune commande pays disponible.</p>
        ) : (
          countrySales.map((item) => (
            <div key={item.country} className="grid grid-cols-[2.75rem_minmax(0,1fr)_5.5rem] items-center gap-2.5">
              <AfricanFlag code={item.code} />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold leading-none text-white">{item.value}</p>
                <p className="mt-1 truncate text-sm leading-none text-white/60">{item.country}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 min-w-0 flex-1 rounded-full bg-[#0c3149]">
                  <span className="block h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: item.color }} />
                </div>
                <p className="w-9 text-right text-base font-medium text-white">{item.percent}%</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function AfricanFlag({ code }: { code: string }) {
  return (
    <span className="flex h-8 w-11 items-center justify-center text-[2rem] leading-none">
      <span aria-hidden="true" className="block">{countryFlag(code)}</span>
    </span>
  );
}

function countryFlag(iso2: string): string {
  const code = iso2.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '🌍';
  return code.replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function RecentPerformanceCard({ orders }: { orders: AdminOrderRow[] }) {
  const metrics = buildOperationalProgressMetrics(orders);

  return (
    <section className="overflow-hidden rounded-md border border-[#11516b] bg-[#08263a]">
      <div className="border-b border-[#143b58] px-6 py-5">
        <h2 className="max-w-[12rem] text-base font-semibold leading-5 text-white">Suivi operationnel</h2>
      </div>
      <div className="flex h-[285px] flex-col items-center justify-between px-5 py-4">
        <OperationalProgressGauge metric={metrics.production} />
        <OperationalProgressGauge metric={metrics.delivery} />
        <div className="grid w-full grid-cols-2 gap-3 text-xs text-white/65">
          {Object.values(metrics).map((metric) => (
            <span key={metric.label} className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0" style={{ backgroundColor: metric.color }} />
              <span className="truncate">{metric.label}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function OperationalProgressGauge({ metric }: { metric: { label: string; percent: number; color: string; count: number; total: number } }) {
  const segments = Array.from({ length: 28 }, (_, index) => index);
  const activeSegments = Math.round((metric.percent / 100) * segments.length);
  const startAngle = 145;
  const sweepAngle = 250;

  return (
    <div className="relative h-[108px] w-[145px]">
      <svg aria-hidden="true" viewBox="0 0 160 125" className="h-full w-full">
        {segments.map((segment) => {
          const angle = startAngle + (segment * sweepAngle) / (segments.length - 1);
          const radians = (angle * Math.PI) / 180;
          const innerRadius = 45;
          const outerRadius = 65;
          const x1 = 80 + Math.cos(radians) * innerRadius;
          const y1 = 76 + Math.sin(radians) * innerRadius;
          const x2 = 80 + Math.cos(radians) * outerRadius;
          const y2 = 76 + Math.sin(radians) * outerRadius;
          const active = segment < activeSegments;

          return (
            <line
              key={segment}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={active ? metric.color : '#143b58'}
              strokeWidth="5"
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      <div className="absolute inset-x-0 top-[42px] text-center">
        <p className="text-[22px] font-medium leading-none text-white">{metric.percent}%</p>
        <p className="mt-1 text-xs leading-none" style={{ color: metric.color }}>{metric.count}/{metric.total}</p>
      </div>
    </div>
  );
}

function ProjectsCard({ orders }: { orders: AdminOrderRow[] }) {
  const projectRows = buildPcbServiceStats(orders);

  return (
    <section className="rounded-md border border-[#11516b] bg-[#08263a] px-4 py-4">
      <h2 className="text-base font-medium text-white">Services PCB</h2>
      <div className="mt-7 space-y-7">
        {projectRows.map((project) => (
          <div key={project.label}>
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="font-semibold text-white">{project.label}</span>
              <span className="text-sm text-white/65">{project.percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#0c3149]">
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
  const revenueSummary = buildAnalyticsRevenueSummary(orders);
  const commercialPerformance = buildCommercialPerformance(revenueSummary.totalRevenue, revenueSummary.previousRevenue);
  const quoteSeries = buildQuoteSeries(orders, intelligence?.snapshots ?? [], 'year');
  const paidOrders = orders.filter((order) => getPaymentStatus(order) === 'paid');
  const conversionRate = quoteSeries.reduce((sum, item) => sum + item.quotes, 0)
    ? (quoteSeries.reduce((sum, item) => sum + item.paid, 0) / quoteSeries.reduce((sum, item) => sum + item.quotes, 0)) * 100
    : 0;
  const activeCustomers = uniqueValues(orders.filter((order) => isRecentDate(order.createdAt, 30)).map((order) => order.userId)).length;
  const serviceStats = buildPcbServiceStats(orders);
  const countrySales = buildAfricanCountrySales(orders);
  const revenueSeries = buildAnalyticsRevenueSeries(orders);
  const orderSparkline = buildMonthlyOrderCounts(orders);
  const supplierCost = intelligence?.metrics.totals.supplierEstimatedPrice ?? 0;
  const margin = revenueSummary.totalRevenue - supplierCost;
  const logisticsStats = buildAnalyticsLogisticsStats(orders);
  const recentTickets = [...tickets]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 5)
    .map(normalizeSupportTicketForDisplay);

  return (
    <div className="rounded-md border border-[#12324a] bg-[#061d2d] p-4 text-white">
      <div className="grid gap-4 lg:grid-cols-4">
        <AnalyticsMetricCard tone="#16c784" icon="quote" title="Devis generes" value={formatCompactNumber(quoteSeries.reduce((sum, item) => sum + item.quotes, 0))} trend={revenueSummary.revenueTrendLabel} sparkline={quoteSeries.map((item) => item.quotes)} />
        <AnalyticsMetricCard tone="#2787ff" icon="percent" title="Taux de conversion" value={`${conversionRate.toFixed(1)}%`} trend="devis > paiement" sparkline={quoteSeries.map((item) => item.paid)} />
        <AnalyticsMetricCard tone="#12a88f" icon="cart" title="Commandes payees" value={formatCompactNumber(paidOrders.length)} trend={`+ ${shareOf(paidOrders.length, orders.length)}%`} sparkline={revenueSeries.map((item) => item.orders)} />
        <AnalyticsMetricCard tone="#27bddc" icon="users" title="Clients actifs" value={formatCompactNumber(activeCustomers)} trend="+ 30 jours" sparkline={orderSparkline} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          <AnalyticsRevenueChart orders={orders} />
          <section className="rounded-md border border-[#143b58] bg-[#08263a] p-4">
            <h2 className="text-sm font-semibold text-white">Revenus et performance commerciale</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <AnalyticsFinancialTile label="Revenus" value={formatCurrency(revenueSummary.totalRevenue)} helper={`${paidOrders.length} commandes payees`} color="#0f9f6e" />
              <AnalyticsFinancialTile label="Marge estimee" value={formatCurrency(margin)} helper={supplierCost ? 'prix client - fournisseur' : 'cout fournisseur en attente'} color="#6fbc53" />
              <AnalyticsFinancialTile label="Couts fournisseurs" value={formatCurrency(supplierCost)} helper={`${intelligence?.metrics.snapshotCount ?? 0} snapshots pricing`} color="#0e6389" />
            </div>
          </section>
        </div>
        <div className="grid gap-4">
          <RevenueSummaryCard summary={revenueSummary} />
          <CommercialPerformanceCard performance={commercialPerformance} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <TopAfricanCountriesCard countries={countrySales} />
        <AnalyticsServiceCard services={serviceStats} />
        <AnalyticsLogisticsCard stats={logisticsStats} />
      </div>

      <section className="mt-4 rounded-md border border-[#143b58] bg-[#08263a] p-4">
        <h2 className="text-sm font-semibold text-white">Support</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <DarkSupportMetric label="Tickets ouverts" value={formatCompactNumber(tickets.filter((ticket) => ticket.status !== 'closed').length)} helper="vs periode precedente" />
          <DarkSupportMetric label="Temps de reponse moy." value="Non suivi" helper="champ SLA a connecter" />
          <DarkSupportMetric label="Resolution SLA" value={`${tickets.length ? Math.round((tickets.filter((ticket) => ['resolved', 'closed'].includes(ticket.status)).length / tickets.length) * 100) : 0}%`} helper="tickets resolus" />
          <DarkSupportMetric label="Satisfaction client" value="Non suivi" helper="avis support a connecter" />
        </div>
        <div className="mt-4 overflow-x-auto rounded-sm border border-[#143b58]">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-[#0b3047] text-[#8db4c9]">
              <tr>
                <th className="px-3 py-2 font-semibold">Date</th>
                <th className="px-3 py-2 font-semibold">ID ticket</th>
                <th className="px-3 py-2 font-semibold">Sujet</th>
                <th className="px-3 py-2 font-semibold">Statut</th>
                <th className="px-3 py-2 font-semibold">Priorite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#143b58] bg-[#08263a] text-white/80">
              {recentTickets.length ? recentTickets.map((ticket) => (
                <tr key={ticket.id} className="bg-[#08263a] odd:bg-[#0a3048]">
                  <td className="px-3 py-2">{ticket.date}</td>
                  <td className="px-3 py-2">{ticket.ticketNumber}</td>
                  <td className="px-3 py-2">{ticket.subject}</td>
                  <td className="px-3 py-2 text-[#4ee28f]">{ticket.status}</td>
                  <td className="px-3 py-2 text-[#ffb34d]">{ticket.priority}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-3 py-5 text-center text-white/55">Aucun ticket support.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-center text-xs font-semibold text-[#34a7ff]">Voir tous les tickets</p>
      </section>
    </div>
  );
}

function AnalyticsMetricCard({ title, value, trend, sparkline, tone, icon }: { title: string; value: string; trend: string; sparkline: number[]; tone: string; icon: 'quote' | 'percent' | 'cart' | 'users' }) {
  return (
    <div
      className="min-h-[178px] rounded-md p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_18px_rgba(16,185,129,0.08)]"
      style={{ background: 'linear-gradient(135deg, #07334a 0%, #05283c 55%, #062236 100%)', border: '1px solid #11516b' }}
    >
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-sm text-white shadow-[0_0_14px_rgba(0,0,0,0.25)]" style={{ backgroundColor: tone }}>
          <AnalyticsMetricIcon icon={icon} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white/85">{title}</p>
          <div className="mt-8 flex items-end justify-between gap-3">
            <p className="text-[34px] font-semibold leading-none tracking-tight text-white">{value}</p>
            <p className="pb-1 text-sm font-semibold text-[#65d84f]">{trend}</p>
          </div>
          <MiniLineChart values={sparkline} color={tone} />
        </div>
      </div>
    </div>
  );
}

function AnalyticsMetricIcon({ icon }: { icon: 'quote' | 'percent' | 'cart' | 'users' }) {
  if (icon === 'quote') {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3h8l4 4v14H7z" /><path d="M15 3v5h5" /><path d="M10 13h6" /><path d="M10 17h4" /></svg>;
  }
  if (icon === 'percent') {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M7 17 17 7" /><circle cx="8" cy="8" r="2.1" /><circle cx="16" cy="16" r="2.1" /></svg>;
  }
  if (icon === 'cart') {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h2l2 10h9l2-7H8" /><circle cx="10" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /></svg>;
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="2.6" /><path d="M7.5 19a4.5 4.5 0 0 1 9 0" /><path d="M5 10.5a2 2 0 1 0 0 4" /><path d="M19 10.5a2 2 0 1 1 0 4" /></svg>;
}

function AnalyticsRevenueChart({ orders }: { orders: AdminOrderRow[] }) {
  const [period, setPeriod] = useState<AnalyticsRevenuePeriod>('year');
  const series = buildAnalyticsRevenueSeriesForPeriod(orders, period);
  const maxRevenue = Math.max(...series.map((item) => item.revenue), 1);
  const maxOrders = Math.max(...series.map((item) => item.orders), 1);
  const revenueScale = buildCurrencyScale(maxRevenue);
  const orderScale = buildOrderScale(maxOrders);
  const linePoints = series
    .map((item, index) => {
      const x = 10 + (index / Math.max(series.length - 1, 1)) * 80;
      const y = 76 - (item.orders / maxOrders) * 58;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <section className="rounded-md border border-[#11516b] bg-[#08263a] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Revenus et commandes</h2>
        <div className="flex items-center gap-4 text-[11px] text-white/70">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#36d679]" />Revenus</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#2d8cff]" />Commandes</span>
          <div className="flex overflow-hidden rounded-sm border border-[#1f4a68] bg-[#0b3047]">
            {[
              ['day', 'Jour'],
              ['week', 'Semaine'],
              ['month', 'Mois'],
              ['year', 'Annee'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value as AnalyticsRevenuePeriod)}
                className={`px-2 py-1 text-[11px] transition ${period === value ? 'bg-[#1478ff] text-white' : 'text-white/70 hover:bg-[#123c58] hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 grid h-[300px] grid-cols-[3rem_minmax(0,1fr)_3rem] gap-3">
        <div className="flex flex-col justify-between pb-7 text-right text-[11px] text-white/70">
          <span>USD</span>
          {revenueScale.map((label) => <span key={label}>{label}</span>)}
        </div>
        <svg viewBox="0 0 100 84" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
          {[18, 32.5, 47, 61.5, 76].map((y) => <line key={y} x1="6" x2="96" y1={y} y2={y} stroke="rgba(141,180,201,0.18)" strokeWidth="0.35" />)}
          {series.map((item, index) => {
            const barHeight = (item.revenue / maxRevenue) * 54;
            const x = 10 + (index / Math.max(series.length - 1, 1)) * 80;
            return <rect key={item.month} x={x - 1.1} y={76 - barHeight} width="2.2" height={barHeight} rx="0.35" fill="url(#revenueBar)" opacity="0.95" />;
          })}
          <polyline points={linePoints} fill="none" stroke="#2d8cff" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" />
          {series.map((item, index) => {
            const x = 10 + (index / Math.max(series.length - 1, 1)) * 80;
            const y = 76 - (item.orders / maxOrders) * 58;
            return <circle key={`${item.month}-point`} cx={x} cy={y} r="1" fill="#ffffff" stroke="#2d8cff" strokeWidth="0.5" />;
          })}
          <defs>
            <linearGradient id="revenueBar" x1="0" x2="0" y1="0" y2="1">
              <stop stopColor="#72d45e" offset="0" />
              <stop stopColor="#21c4c4" offset="1" />
            </linearGradient>
          </defs>
        </svg>
        <div className="flex flex-col justify-between pb-7 text-left text-[11px] text-white/70">
          <span>Commandes</span>
          {orderScale.map((label) => <span key={label}>{label}</span>)}
        </div>
      </div>
      <div className="mx-[4rem] grid gap-2 text-center text-[11px] text-white/65" style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}>
        {series.map((item) => <span key={item.month}>{item.month}</span>)}
      </div>
    </section>
  );
}

function RevenueSummaryCard({ summary }: { summary: ReturnType<typeof buildAnalyticsRevenueSummary> }) {
  return (
    <section className="rounded-md border border-[#143b58] bg-[#08263a] p-4 text-white">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-sm bg-[#0f9f6e] text-white">
          <DashboardKpiIcon icon="dollar" />
        </span>
        <h3 className="text-sm font-semibold">Revenus</h3>
      </div>
      <p className="mt-7 text-3xl font-semibold tracking-tight">{formatCurrency(summary.totalRevenue)}</p>
      <p className="mt-4 text-sm font-semibold text-[#58b947]">revenus encaisses</p>
      <p className="mt-2 text-xs text-white/60">total commandes payees</p>
    </section>
  );
}

function CommercialPerformanceCard({ performance }: { performance: ReturnType<typeof buildCommercialPerformance> }) {
  const radius = 58;
  const circumference = Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, performance.percent));

  return (
    <section className="rounded-md border border-[#143b58] bg-[#08263a] p-4 text-white">
      <h3 className="text-sm font-semibold">Performance commerciale</h3>
      <div className="mt-5 grid place-items-center">
        <svg viewBox="0 0 160 92" className="h-32 w-full max-w-[210px]" aria-hidden="true">
          <path d="M22 78a58 58 0 0 1 116 0" fill="none" stroke="#1f4056" strokeWidth="12" strokeLinecap="round" />
          <path
            d="M22 78a58 58 0 0 1 116 0"
            fill="none"
            stroke="#36d679"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(clamped / 100) * circumference} ${circumference}`}
          />
          <text x="80" y="62" textAnchor="middle" className="fill-white text-[24px] font-semibold">{Math.round(clamped)}%</text>
          <text x="80" y="82" textAnchor="middle" className="fill-white/60 text-[10px]">objectif atteint</text>
        </svg>
      </div>
      <div className="mt-4 space-y-1 text-xs text-white/70">
        <p>Objectif : {formatCurrency(performance.goal)}</p>
        <p>Actuel : {formatCurrency(performance.current)}</p>
      </div>
    </section>
  );
}

function TopAfricanCountriesCard({ countries }: { countries: ReturnType<typeof buildAfricanCountrySales> }) {
  return (
    <section className="rounded-md border border-[#143b58] bg-[#08263a] p-4">
      <h2 className="text-sm font-semibold text-white">Top pays africains</h2>
      <div className="mt-4 space-y-3">
        {countries.length ? countries.map((country) => (
          <div key={country.code} className="grid grid-cols-[2rem_minmax(0,1fr)_auto_auto] items-center gap-3 text-xs">
            <span className="text-xl leading-none">{countryFlag(country.code)}</span>
            <span className="truncate font-medium text-white/80">{country.country.replace(/\s\(\d+\)$/, '')}</span>
            <span className="font-semibold text-white">{country.value}</span>
            <span className="w-10 text-right text-white/55">{country.percent}%</span>
            <span className="col-span-4 h-1 bg-[#0c3149]"><span className="block h-full bg-[#36d679]" style={{ width: `${country.percent}%` }} /></span>
          </div>
        )) : <p className="text-sm text-white/55">Aucune commande africaine suivie.</p>}
      </div>
      <p className="mt-5 text-center text-xs font-semibold text-[#34a7ff]">Voir tous</p>
    </section>
  );
}

function AnalyticsFinancialTile({ label, value, helper, color }: { label: string; value: string; helper: string; color: string }) {
  return (
    <div className="rounded-sm p-4" style={{ backgroundColor: '#061d2d', border: '1px solid #143b58' }}>
      <span className="grid h-10 w-10 place-items-center rounded-sm text-white" style={{ backgroundColor: color }}>
        <DashboardKpiIcon icon="dollar" />
      </span>
      <p className="mt-4 text-xs font-semibold text-white/70">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-3 text-[11px] text-white/50">{helper}</p>
    </div>
  );
}

function AnalyticsServiceCard({ services }: { services: ReturnType<typeof buildPcbServiceStats> }) {
  const totalOrders = services.reduce((sum, service) => sum + service.orders, 0);
  return (
    <section className="rounded-md border border-[#143b58] bg-[#08263a] p-4">
      <h2 className="text-sm font-semibold text-white">Services les plus demandes</h2>
      <div className="mt-5 grid place-items-center">
        <DonutChart total={totalOrders} label="commandes" items={services.map((service) => ({ label: service.label, percent: service.percent, color: service.color }))} />
      </div>
      <div className="mt-4 space-y-2">
        {services.map((service) => (
          <div key={service.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-white/70"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: service.color }} /><span className="truncate">{service.label}</span></span>
            <span className="text-white">{service.percent}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AnalyticsLogisticsCard({ stats }: { stats: ReturnType<typeof buildAnalyticsLogisticsStats> }) {
  return (
    <section className="rounded-md border border-[#143b58] bg-[#08263a] p-4">
      <h2 className="text-sm font-semibold text-white">Suivi logistique</h2>
      <div className="mt-5 grid place-items-center">
        <DonutChart total={stats.reduce((sum, item) => sum + item.count, 0)} label="operations" items={stats} />
      </div>
      <div className="mt-4 space-y-2">
        {stats.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-white/70"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="truncate">{item.label}</span></span>
            <span className="text-white">{item.percent}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function DonutChart({ total, label, items }: { total: number; label: string; items: Array<{ label: string; percent: number; color: string }> }) {
  let offset = 25;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg viewBox="0 0 120 120" className="h-40 w-40" aria-hidden="true">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="#0c3149" strokeWidth="17" />
      {items.map((item) => {
        const length = (Math.max(0, item.percent) / 100) * circumference;
        const segment = (
          <circle
            key={item.label}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={item.color}
            strokeWidth="17"
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={offset}
            strokeLinecap="butt"
            transform="rotate(-90 60 60)"
          />
        );
        offset -= length;
        return segment;
      })}
      <text x="60" y="50" textAnchor="middle" className="fill-white/55 text-[7px]">Total</text>
      <text x="60" y="68" textAnchor="middle" className="fill-white text-[18px] font-semibold">{formatCompactNumber(total)}</text>
      <text x="60" y="84" textAnchor="middle" className="fill-white/55 text-[7px]">{label}</text>
    </svg>
  );
}

function DarkSupportMetric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-sm p-3" style={{ backgroundColor: '#061d2d', border: '1px solid #143b58' }}>
      <p className="text-[11px] font-semibold text-white/65">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-[11px] text-white/45">{helper}</p>
    </div>
  );
}

function MiniLineChart({ values, color }: { values: number[]; color: string }) {
  const maxValue = Math.max(...values, 1);
  const plottedValues = values.length > 0 ? values : [0];
  const points = plottedValues.map((value, index) => {
    const x = plottedValues.length === 1 ? 50 : 4 + (index / (plottedValues.length - 1)) * 92;
    const y = 34 - (value / maxValue) * 24;
    return { x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  const area = `4,40 ${line} 96,40`;

  return (
    <svg viewBox="0 0 100 44" className="mt-5 h-12 w-full" preserveAspectRatio="none" aria-hidden="true">
      <polygon points={area} fill={color} opacity="0.13" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
  onResetAdminCode,
}: {
  admins: AdminAccessUser[];
  logs: AdminAuditLog[];
  onSubmitAddAdmin: (event: FormEvent<HTMLFormElement>) => void;
  onRemoveAdmin: (accessId: string) => void | Promise<void>;
  onResetAdminCode: (accessId: string) => void | Promise<void>;
}) {
  const accessLogs = logs.filter((log) => log.action.startsWith('admin.access.'));

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Gestion des accès</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Acces admin en base</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Render garde seulement l'acces de depart. Les nouveaux admins sont maintenant lies ici avec leur compte de connexion et leur e-mail professionnel.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Nom</th>
                <th className="px-5 py-4">Compte connecte</th>
                <th className="px-5 py-4">Email pro</th>
                <th className="px-5 py-4">Roles acces</th>
                <th className="px-5 py-4">Statut</th>
                <th className="px-5 py-4">Code</th>
                <th className="px-5 py-4">Dernier acces</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {admins.map((admin) => (
                <tr key={admin.accessId}>
                  <td className="px-5 py-4 font-black text-ink">{admin.fullName}</td>
                  <td className="px-5 py-4 text-slate-600">{admin.email}</td>
                  <td className="px-5 py-4 text-slate-600">{admin.professionalEmail}</td>
                  <td className="px-5 py-4 text-slate-600">{admin.accessRoles.join(', ')}</td>
                  <td className="px-5 py-4 text-slate-600">{adminAccessStatusLabel(admin.status)}</td>
                  <td className="px-5 py-4 text-slate-600">{admin.personalCodeExpiresAt ? `Expire ${formatDate(admin.personalCodeExpiresAt)}` : 'A initialiser'}</td>
                  <td className="px-5 py-4 text-slate-600">{admin.lastVerifiedAt ? formatDate(admin.lastVerifiedAt) : 'Jamais'}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => void onResetAdminCode(admin.accessId)}
                      className="mr-2 h-9 border border-slate-300 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-slate-500"
                    >
                      Reset code
                    </button>
                    <button
                      type="button"
                      onClick={() => void onRemoveAdmin(admin.accessId)}
                      className="h-9 border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100"
                    >
                      Retirer admin
                    </button>
                  </td>
                </tr>
              ))}
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-sm font-bold text-slate-500">Aucun acces admin trouve.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="space-y-6">
        <AdminForm title="Ajouter admin" onSubmit={onSubmitAddAdmin}>
          <input name="email" type="email" required placeholder="compte-connecte@gmail.com" className={fieldClassName} />
          <input name="professionalEmail" type="email" required placeholder="email.pro@kendronics.com" className={fieldClassName} />
          <div className="grid gap-2 text-xs text-slate-600">
            {[
              ['admin', 'Admin'],
              ['support', 'Support'],
              ['logistics', 'Logistique'],
              ['pricing', 'Pricing'],
              ['super_admin', 'Super admin'],
            ].map(([value, label]) => (
              <label key={value} className="inline-flex items-center gap-2">
                <input type="checkbox" name="accessRoles" value={value} defaultChecked={value === 'admin'} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <p className="text-xs leading-5 text-slate-500">
            Le compte doit deja exister. Le role admin et l'e-mail professionnel seront enregistres en base et traces dans l'audit.
          </p>
        </AdminForm>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Historique</p>
            <h2 className="mt-2 text-xl font-black text-ink">Changements d'accès</h2>
          </div>
          <SimpleTable
            headers={['Action', 'Actor', 'Target', 'IP', 'Date']}
            rows={accessLogs.map((log) => [log.action, log.actorUserId, log.targetId ?? 'None', log.ipAddress ?? 'None', formatDate(log.createdAt)])}
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

function adminAccessStatusLabel(status: AdminAccessUser['status']) {
  const labels: Record<AdminAccessUser['status'], string> = {
    active: 'Actif',
    pending_setup: 'A initialiser',
    expired: 'Expire',
    locked: 'Verrouille',
    disabled: 'Desactive',
  };
  return labels[status];
}

function AuditLogPanel({ logs }: { logs: AdminAuditLog[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Audit trail</p>
        <h2 className="mt-2 text-2xl font-black text-ink">Admin actions</h2>
      </div>
      <SimpleTable
        headers={['Action', 'Actor', 'Target', 'Target ID', 'IP', 'Created']}
        rows={logs.map((log) => [log.action, log.actorUserId, log.targetType, log.targetId ?? 'None', log.ipAddress ?? 'None', formatDate(log.createdAt)])}
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

function persistAdminAccessToken(result: VerifyAdminCodeResponse) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(adminElevationStorageKey, JSON.stringify(result));
}

function readAdminAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(adminElevationStorageKey);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as VerifyAdminCodeResponse;
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

function shareOf(value: number, total: number): string {
  if (!total) return '0.0';
  return ((value / total) * 100).toFixed(1);
}

function percentOf(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function sumOrderTotals(orders: AdminOrderRow[]): number {
  return orders.reduce((total, order) => total + (order.totalPrice ?? 0), 0);
}

function sumPaidOrderTotals(orders: AdminOrderRow[]): number {
  return orders
    .filter((order) => getPaymentStatus(order) === 'paid' && !['cancelled', 'refunded'].includes(order.status))
    .reduce((total, order) => total + (order.totalPrice ?? 0), 0);
}

function buildAnalyticsRevenueSummary(orders: AdminOrderRow[]) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const previousMonth = previousMonthDate.getMonth();
  const previousYear = previousMonthDate.getFullYear();

  let currentRevenue = 0;
  let previousRevenue = 0;

  for (const order of orders) {
    if (getPaymentStatus(order) !== 'paid' || ['cancelled', 'refunded'].includes(order.status)) continue;
    const date = new Date(order.paidAt ?? order.createdAt);
    const value = order.totalPrice ?? 0;
    if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) currentRevenue += value;
    if (date.getFullYear() === previousYear && date.getMonth() === previousMonth) previousRevenue += value;
  }

  const revenueTrend = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : currentRevenue > 0 ? 100 : 0;

  return {
    totalRevenue: sumPaidOrderTotals(orders),
    currentRevenue,
    previousRevenue,
    revenueTrend,
    revenueTrendLabel: `${revenueTrend >= 0 ? '+' : ''}${revenueTrend.toFixed(1)}%`,
  };
}

function buildCommercialPerformance(currentRevenue: number, previousRevenue: number) {
  const goal = previousRevenue > 0 ? previousRevenue * 1.15 : currentRevenue;
  const percent = goal > 0 ? (currentRevenue / goal) * 100 : 0;

  return {
    current: currentRevenue,
    goal,
    percent,
  };
}

function buildAnalyticsRevenueSeries(orders: AdminOrderRow[]): Array<{ month: string; revenue: number; orders: number }> {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const series = months.map((month) => ({ month, revenue: 0, orders: 0 }));

  for (const order of orders) {
    if (getPaymentStatus(order) !== 'paid' || ['cancelled', 'refunded'].includes(order.status)) continue;
    const date = new Date(order.paidAt ?? order.createdAt);
    if (date.getFullYear() !== currentYear) continue;
    series[date.getMonth()].revenue += order.totalPrice ?? 0;
    series[date.getMonth()].orders += 1;
  }

  return series;
}

type AnalyticsRevenuePeriod = 'day' | 'week' | 'month' | 'year';

function buildAnalyticsRevenueSeriesForPeriod(orders: AdminOrderRow[], period: AnalyticsRevenuePeriod): Array<{ month: string; revenue: number; orders: number }> {
  if (period === 'year') return buildAnalyticsRevenueSeries(orders);

  const now = new Date();
  if (period === 'day') {
    const labels = Array.from({ length: 24 }, (_, hour) => `${hour}h`);
    const series = labels.map((month) => ({ month, revenue: 0, orders: 0 }));
    for (const order of orders) {
      if (getPaymentStatus(order) !== 'paid' || ['cancelled', 'refunded'].includes(order.status)) continue;
      const date = new Date(order.paidAt ?? order.createdAt);
      if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth() || date.getDate() !== now.getDate()) continue;
      series[date.getHours()].revenue += order.totalPrice ?? 0;
      series[date.getHours()].orders += 1;
    }
    return series.filter((_, index) => index % 2 === 0);
  }

  if (period === 'week') {
    const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const series = labels.map((month) => ({ month, revenue: 0, orders: 0 }));
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);

    for (const order of orders) {
      if (getPaymentStatus(order) !== 'paid' || ['cancelled', 'refunded'].includes(order.status)) continue;
      const date = new Date(order.paidAt ?? order.createdAt);
      if (date < monday || date >= sunday) continue;
      const index = (date.getDay() || 7) - 1;
      series[index].revenue += order.totalPrice ?? 0;
      series[index].orders += 1;
    }
    return series;
  }

  const series = ['S1', 'S2', 'S3', 'S4'].map((month) => ({ month, revenue: 0, orders: 0 }));
  for (const order of orders) {
    if (getPaymentStatus(order) !== 'paid' || ['cancelled', 'refunded'].includes(order.status)) continue;
    const date = new Date(order.paidAt ?? order.createdAt);
    if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) continue;
    const index = monthWeekIndex(date);
    series[index].revenue += order.totalPrice ?? 0;
    series[index].orders += 1;
  }
  return series;
}

function buildCurrencyScale(maxValue: number): string[] {
  const ceiling = Math.max(maxValue, 1);
  return [1, 0.75, 0.5, 0.25, 0].map((ratio) => formatCompactCurrencyScale(ceiling * ratio));
}

function buildOrderScale(maxValue: number): string[] {
  const ceiling = Math.max(maxValue, 1);
  return [1, 0.8, 0.6, 0.4, 0.2, 0].map((ratio) => formatCompactNumber(ceiling * ratio));
}

function formatCompactCurrencyScale(value: number): string {
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return formatCompactNumber(value);
}

function buildMonthlyOrderCounts(orders: AdminOrderRow[]): number[] {
  const currentYear = new Date().getFullYear();
  const counts = Array.from({ length: 12 }, () => 0);

  for (const order of orders) {
    const date = new Date(order.createdAt);
    if (date.getFullYear() !== currentYear) continue;
    counts[date.getMonth()] += 1;
  }

  return counts;
}

function buildAnalyticsLogisticsStats(orders: AdminOrderRow[]): Array<{ label: string; percent: number; count: number; color: string }> {
  const rows = [
    { label: 'Livres', count: orders.filter((order) => order.status === 'delivered').length, color: '#36d679' },
    { label: 'En transit', count: orders.filter((order) => ['china_3pl_received', 'shipped_to_africa', 'customs_processing', 'out_for_delivery'].includes(order.status)).length, color: '#2d8cff' },
    { label: 'En attente', count: orders.filter((order) => ['awaiting_payment', 'paid', 'supplier_order_pending', 'supplier_ordered'].includes(order.status)).length, color: '#ffb22e' },
    { label: 'Retardes', count: orders.filter((order) => ['cancelled', 'refunded'].includes(order.status)).length, color: '#ff4b6e' },
  ];
  const total = rows.reduce((sum, item) => sum + item.count, 0);
  let remaining = 100;

  return rows.map((item, index) => {
    const percent = total === 0 ? 0 : index === rows.length - 1 ? remaining : Math.round((item.count / total) * 100);
    remaining -= percent;
    return { ...item, percent };
  });
}

function isToday(value: string): boolean {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function isRecentDate(value: string, days: number): boolean {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return false;
  return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
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
  if (tab === 'delivery') return orders.filter((order) => ['shipped_to_africa', 'customs_processing', 'out_for_delivery', 'delivered'].includes(order.status));
  if (tab === 'disputes') return orders.filter((order) => ['cancelled', 'refunded'].includes(order.status) || getPaymentStatus(order) === 'refunded');
  return orders;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}

function safeFormatDate(value?: string): string {
  if (!value) return 'Date inconnue';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Date inconnue';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
}

function normalizeSupportTicketForDisplay(ticket: AdminSupportTicket) {
  return {
    id: ticket.id || `${ticket.ticketNumber || 'ticket'}-${ticket.createdAt || 'unknown'}`,
    date: safeFormatDate(ticket.createdAt),
    ticketNumber: ticket.ticketNumber?.trim() || 'Ticket sans ID',
    subject: ticket.subject?.trim() || 'Sujet non renseigne',
    status: supportTicketStatusLabel(ticket.status),
    priority: ticket.status === 'pending_admin' ? 'Elevee' : 'Moyenne',
  };
}

function supportTicketStatusLabel(status: AdminSupportTicket['status']): string {
  const labels: Record<AdminSupportTicket['status'], string> = {
    open: 'Ouvert',
    pending_customer: 'Client',
    pending_admin: 'A traiter',
    resolved: 'Resolu',
    closed: 'Ferme',
  };
  return labels[status] ?? 'Ouvert';
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatOrderCurrency(value: number, currency?: 'EUR' | 'USD'): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency ?? 'EUR' }).format(value);
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

function buildAfricanCountrySales(orders: AdminOrderRow[]): Array<{ code: string; country: string; value: string; percent: number; color: string }> {
  const countriesByIso = new Map(africanCountries.map((country) => [country.iso2, country.name]));
  const buckets = new Map<string, { code: string; country: string; orders: number; total: number }>();

  for (const order of orders) {
    const code = (order.destinationCountryIso2 ?? '').trim().toUpperCase();
    if (!countriesByIso.has(code)) continue;

    const current = buckets.get(code) ?? { code, country: countriesByIso.get(code) ?? code, orders: 0, total: 0 };
    current.orders += 1;
    current.total += order.totalPrice ?? 0;
    buckets.set(code, current);
  }

  const totalOrders = Array.from(buckets.values()).reduce((sum, item) => sum + item.orders, 0);
  const colors = ['#ff2f8b', '#31d843', '#12a8ff', '#ffb319', '#6c3cff', '#1478ff', '#6fbc53', '#0e6389'];

  return Array.from(buckets.values())
    .sort((left, right) => right.orders - left.orders || right.total - left.total || left.country.localeCompare(right.country))
    .slice(0, 8)
    .map((item, index) => ({
      code: item.code,
      country: `${item.country} (${item.orders})`,
      value: formatCurrency(item.total),
      percent: Math.max(1, Math.round((item.orders / Math.max(totalOrders, 1)) * 100)),
      color: colors[index % colors.length],
    }));
}

function buildOperationalProgressMetrics(orders: AdminOrderRow[]) {
  const activeOrders = orders.filter((order) => !['cancelled', 'refunded'].includes(order.status));
  const total = activeOrders.length;
  const productionStatuses: AdminOrderStatus[] = [
    'supplier_order_pending',
    'supplier_ordered',
    'supplier_in_production',
    'china_3pl_received',
    'shipped_to_africa',
    'customs_processing',
    'out_for_delivery',
    'delivered',
  ];
  const deliveryStatuses: AdminOrderStatus[] = [
    'shipped_to_africa',
    'customs_processing',
    'out_for_delivery',
    'delivered',
  ];
  const productionCount = activeOrders.filter((order) => productionStatuses.includes(order.status)).length;
  const deliveryCount = activeOrders.filter((order) => deliveryStatuses.includes(order.status)).length;

  return {
    production: {
      label: 'Fabrication',
      percent: percentOf(productionCount, total),
      color: '#6fbc53',
      count: productionCount,
      total,
    },
    delivery: {
      label: 'Livraison',
      percent: percentOf(deliveryCount, total),
      color: '#0e6389',
      count: deliveryCount,
      total,
    },
  };
}

function buildPcbServiceStats(orders: AdminOrderRow[]): Array<{ label: string; percent: number; orders: number; color: string }> {
  const serviceDefinitions = [
    { id: 'standard_pcb', label: 'Standard PCB', color: '#6fbc53' },
    { id: 'advanced_pcb', label: 'PCB avance', color: '#0e6389' },
    { id: 'pcb_assembly', label: 'PCBA', color: '#2eb987' },
    { id: 'fpc_rigid_flex', label: 'FPC / Rigid-Flex', color: '#12a8ff' },
    { id: 'smt_stencil', label: 'SMD-Stencil', color: '#ff812d' },
    { id: 'cnc_3d', label: 'CNC / Impression 3D', color: '#6c3cff' },
  ];
  const counts = new Map(serviceDefinitions.map((service) => [service.id, 0]));
  let unclassifiedCount = 0;

  for (const order of orders) {
    const productType = productTypeForOrder(order);
    if (productType && counts.has(productType)) {
      counts.set(productType, (counts.get(productType) ?? 0) + 1);
    } else {
      unclassifiedCount += 1;
    }
  }

  const rows = serviceDefinitions.map((service, index) => ({
    ...service,
    orders: counts.get(service.id) ?? 0,
    rank: index,
  }));
  if (unclassifiedCount > 0) {
    rows.push({ id: 'unclassified', label: 'Non classe', color: '#343a40', orders: unclassifiedCount, rank: rows.length });
  }

  const total = rows.reduce((sum, service) => sum + service.orders, 0);
  const ranked = rows
    .map((service) => ({
      ...service,
      rawPercent: total ? (service.orders / total) * 100 : 0,
    }))
    .sort((left, right) => right.orders - left.orders || left.rank - right.rank);

  let remaining = 100;
  return ranked.map((service, index) => {
    const percent = total === 0 ? 0 : index === ranked.length - 1 ? remaining : Math.round(service.rawPercent);
    remaining -= percent;
    return {
      label: service.label,
      percent,
      orders: service.orders,
      color: service.color,
    };
  });
}

function productTypeForOrder(order: AdminOrderRow): string | undefined {
  return order.quoteSnapshot?.productType?.trim();
}

function buildDashboardTransactions(orders: AdminOrderRow[]): Array<{ name: string; subtitle: string; amount: string; date: string; status: 'Pending' | 'Completed' | 'Failed'; tone: string; progress: number }> {
  return [...orders]
    .filter((order) => !['delivered', 'cancelled', 'refunded'].includes(order.status))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 4)
    .map((order) => {
      const paymentStatus = getPaymentStatus(order);
      return {
        name: order.orderNumber,
        subtitle: `${serviceLabelForOrder(order)} - ${countryLabelForOrder(order)} - ${dashboardStageLabelForOrder(order)}`,
        amount: formatOrderCurrency(order.totalPrice ?? 0, order.currency),
        date: formatDate(order.createdAt),
        status: transactionStatusForOrder(order, paymentStatus),
        tone: transactionToneForOrder(order, paymentStatus),
        progress: progressForOrder(order),
      };
    });
}

function serviceLabelForOrder(order: AdminOrderRow): string {
  const value = String(productTypeForOrder(order) ?? '').toLowerCase();
  if (value.includes('assembly') || value.includes('pcba')) return 'PCBA';
  if (value.includes('flex')) return 'FPC/Rigid-Flex';
  if (value.includes('cnc') || value.includes('3d')) return 'CNC / 3D';
  if (value.includes('advanced')) return 'PCB avance';
  return 'Standard PCB';
}

function countryLabelForOrder(order: AdminOrderRow): string {
  const code = order.destinationCountryIso2.trim().toUpperCase();
  return africanCountries.find((country) => country.iso2 === code)?.name ?? code;
}

function dashboardStageLabelForOrder(order: AdminOrderRow): string {
  if (order.status === 'awaiting_payment') return 'Paiement';
  if (['paid', 'supplier_order_pending', 'supplier_ordered'].includes(order.status)) return 'Fournisseur';
  if (order.status === 'supplier_in_production') return 'Fabrication';
  if (order.status === 'china_3pl_received') return '3PL Chine';
  if (['shipped_to_africa', 'customs_processing', 'out_for_delivery'].includes(order.status)) return 'Livraison';
  if (order.status === 'delivered') return 'Livree';
  if (['cancelled', 'refunded'].includes(order.status)) return 'Fermee';
  return adminStatusLabels[order.status] ?? order.status;
}

function transactionStatusForOrder(order: AdminOrderRow, paymentStatus: PaymentStatus): 'Pending' | 'Completed' | 'Failed' {
  if (paymentStatus === 'failed' || paymentStatus === 'refunded' || ['cancelled', 'refunded'].includes(order.status)) return 'Failed';
  if (order.status === 'delivered') return 'Completed';
  return 'Pending';
}

function transactionToneForOrder(order: AdminOrderRow, paymentStatus: PaymentStatus): string {
  if (paymentStatus === 'failed' || paymentStatus === 'refunded' || ['cancelled', 'refunded'].includes(order.status)) return 'bg-[#ff6868]';
  if (order.status === 'delivered') return 'bg-[#36c5cd]';
  if (['supplier_in_production', 'china_3pl_received', 'shipped_to_africa', 'customs_processing', 'out_for_delivery'].includes(order.status)) return 'bg-[#e64b8b]';
  return 'bg-[#edf6ff] text-[#177ddc]';
}

function progressForOrder(order: AdminOrderRow): number {
  const map: Record<AdminOrderStatus, number> = {
    awaiting_payment: 10,
    paid: 25,
    supplier_order_pending: 35,
    supplier_ordered: 45,
    supplier_in_production: 55,
    china_3pl_received: 70,
    shipped_to_africa: 80,
    customs_processing: 88,
    out_for_delivery: 95,
    delivered: 100,
    cancelled: 0,
    refunded: 0,
  };
  return map[order.status];
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
