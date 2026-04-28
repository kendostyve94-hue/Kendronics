'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../../components/layout/Navbar';
import { Card } from '../../../components/ui/Card';
import { getApiBaseUrl } from '../../../lib/api-base-url';
import { readAuthSession, readFreshAuthSession } from '../../../lib/auth-session';
import {
  isCustomerTrackingStatus,
  orderDetailApiContract,
  statusLabels,
} from '../../../lib/order-detail-contract';
import type {
  CustomerOrderSummary,
  CustomerTrackingStatus,
  GerberFileInfo,
  OrderDetailResponse,
  PcbSpecs,
  PricingLineItem,
} from '../../../lib/order-detail-contract';

type PageStatus = 'loading' | 'ready' | 'demo' | 'error';
type CheckoutStatus = 'idle' | 'loading' | 'error';
type DeleteStatus = 'idle' | 'deleting' | 'error';
const apiBaseUrl = getApiBaseUrl();
const customerOrdersStorageKey = 'kendronics.customer.orders';

const countryNames: Record<string, string> = {
  SN: 'Senegal',
  GH: 'Ghana',
  KE: 'Kenya',
  NG: 'Nigeria',
  CI: "Cote d'Ivoire",
  ZA: 'South Africa',
  MA: 'Morocco',
  EG: 'Egypt',
};

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const [detail, setDetail] = useState<OrderDetailResponse>(() => buildDemoOrderDetail(orderId));
  const [status, setStatus] = useState<PageStatus>('loading');
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>('idle');
  const [checkoutError, setCheckoutError] = useState('');
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>('idle');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      setStatus('loading');

      try {
        const session = readAuthSession();
        const headers: HeadersInit = session
          ? { Authorization: `${session.tokenType} ${session.accessToken}` }
          : {};

        const [orderResponse, trackingResponse] = await Promise.all([
          fetch(`${apiBaseUrl}${orderDetailApiContract.order.path.replace(':orderId', orderId)}`, { headers }),
          fetch(`${apiBaseUrl}${orderDetailApiContract.tracking.path.replace(':orderId', orderId)}`, { headers }),
        ]);

        if (!orderResponse.ok || !trackingResponse.ok) {
          throw new Error('Details de commande indisponibles.');
        }

        const orderPayload = await orderResponse.json();
        const trackingPayload = await trackingResponse.json();

        if (!cancelled) {
          setDetail(normalizeOrderDetail(orderId, orderPayload, trackingPayload));
          setStatus('ready');
        }
      } catch {
        if (!cancelled) {
          setDetail(buildDemoOrderDetail(orderId));
          setStatus('demo');
        }
      }
    }

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const destination = countryNames[detail.order.destinationCountryIso2] ?? detail.order.destinationCountryIso2;
  const supportHref = `/contact?orderId=${encodeURIComponent(detail.order.id)}`;
  const canCheckout = status === 'ready' && detail.order.paymentStatus === 'pending';

  async function startStripeCheckout() {
    setCheckoutStatus('loading');
    setCheckoutError('');

    try {
      const session = await readFreshAuthSession();
      if (!session) {
        throw new Error('Connectez-vous avant de payer cette commande.');
      }

      const origin = window.location.origin;
      const response = await fetch(`${apiBaseUrl}/api/payments/checkout`, {
        method: 'POST',
        headers: {
          Authorization: `${session.tokenType} ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: detail.order.id,
          successUrl: `${origin}/orders/${detail.order.id}?payment=success`,
          cancelUrl: `${origin}/orders/${detail.order.id}?payment=cancelled`,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(Array.isArray(error?.message) ? error.message.join(' ') : error?.message ?? 'Impossible de lancer le paiement Stripe.');
      }

      const checkout = (await response.json()) as { checkoutUrl: string };
      window.location.assign(checkout.checkoutUrl);
    } catch (error) {
      setCheckoutStatus('error');
      setCheckoutError(error instanceof Error ? error.message : 'Impossible de lancer le paiement Stripe.');
    }
  }

  async function deleteOrder() {
    const confirmed = window.confirm(`Supprimer la commande ${detail.order.orderNumber} ? Cette action retire la commande de votre panier.`);
    if (!confirmed) return;

    setDeleteStatus('deleting');
    setDeleteError('');

    try {
      const session = await readFreshAuthSession();

      if (session && status === 'ready') {
        const response = await fetch(`${apiBaseUrl}${orderDetailApiContract.deleteOrder.path.replace(':orderId', detail.order.id)}`, {
          method: orderDetailApiContract.deleteOrder.method,
          headers: {
            Authorization: `${session.tokenType} ${session.accessToken}`,
          },
        });

        if (!response.ok && response.status !== 404) {
          const error = await response.json().catch(() => null);
          throw new Error(Array.isArray(error?.message) ? error.message.join(' ') : error?.message ?? 'Impossible de supprimer la commande.');
        }
      }

      forgetCustomerOrder(detail.order.id);
      router.push('/quote');
    } catch (error) {
      setDeleteStatus('error');
      setDeleteError(error instanceof Error ? error.message : 'Impossible de supprimer la commande.');
    }
  }

  return (
    <main className="min-h-screen bg-cloud">
      <Navbar />
      <section className="border-b border-line bg-white pt-28">
        <div className="mx-auto max-w-[1320px] px-4 pb-5 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Panier d'achat</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Details de commande</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Chaque commande est regroupee dans une section deroulante avec ses fichiers, specifications et couts.
              </p>
            </div>
            <StatusBadge status={detail.order.status} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-4 py-5 sm:px-6 lg:px-8">
        {status === 'demo' && (
          <div className="mb-5 rounded-sm border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
            Apercu de donnees client affiche car l API de commande authentifiee est indisponible dans cet environnement.
          </div>
        )}
        {status === 'error' && (
          <div className="mb-5 rounded-sm border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            Impossible de charger cette commande. Actualisez la page ou contactez le support.
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="overflow-hidden rounded-sm border border-line bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-5 text-sm font-black">
                <span className="text-[#0877ff]">Toutes (1)</span>
                <span>PCB (1)</span>
                <span>Assemblage ({detail.pcbSpecs.assemblyRequired ? 1 : 0})</span>
              </div>
              <label className="flex h-9 w-full items-center gap-2 rounded-sm border border-line bg-white px-3 md:max-w-56">
                <input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Rechercher" />
                <span className="text-sm text-slate-500">Q</span>
              </label>
            </div>

            <div className="hidden grid-cols-[minmax(0,1fr)_5rem_8rem_7rem] bg-slate-100 px-5 py-3 text-sm font-black text-ink md:grid">
              <span>Article</span>
              <span>Qte</span>
              <span>Delais prod</span>
              <span className="text-right">Prix</span>
            </div>

            <OrderAccordion
              order={detail.order}
              specs={detail.pcbSpecs}
              gerberFile={detail.gerberFile}
              pricingBreakdown={detail.pricingBreakdown}
              destination={destination}
              deleteStatus={deleteStatus}
              deleteError={deleteError}
              onDelete={deleteOrder}
            />
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <SummaryCard
              order={detail.order}
              canCheckout={canCheckout}
              checkoutStatus={checkoutStatus}
              checkoutError={checkoutError}
              onCheckout={startStripeCheckout}
            />
            <SupportCard supportHref={supportHref} orderNumber={detail.order.orderNumber} />
          </div>
        </div>
      </section>
    </main>
  );
}

function SummaryCard({
  order,
  canCheckout,
  checkoutStatus,
  checkoutError,
  onCheckout,
}: {
  order: CustomerOrderSummary;
  canCheckout: boolean;
  checkoutStatus: CheckoutStatus;
  checkoutError: string;
  onCheckout: () => void;
}) {
  const shippingEstimate = order.estimatedDeliveryAt ? formatDate(order.estimatedDeliveryAt) : '--';

  return (
    <Card className="p-5">
      <h2 className="text-xl font-black tracking-tight text-ink">Resume</h2>
      <div className="mt-5 space-y-4 text-sm">
        <SummaryLine label="Total marchandises" value={formatMoney(order.totalPrice, order.currency)} />
        <SummaryLine label="Estimation des frais de port" value="--" />
        <div className="flex items-center justify-between border-t border-line pt-4 text-base font-black">
          <span>Total</span>
          <span className="text-[#ff7a00]">{formatMoney(order.totalPrice, order.currency)}</span>
        </div>
        <div className="border-t border-line pt-4">
          <SummaryLine label="Date d'expedition estimee" value={shippingEstimate} />
          <p className="mt-3 text-xs leading-5 text-slate-500">
            La commande ne sera expediee que lorsque les fichiers, le paiement et la revue seront prets.
          </p>
        </div>
        <SummaryLine label="Poids" value="0kg" />
      </div>
      <button
        type="button"
        disabled={!canCheckout || checkoutStatus === 'loading'}
        onClick={onCheckout}
        className={`mt-5 inline-flex h-12 w-full items-center justify-center rounded-full px-5 text-base font-black text-white transition ${
          canCheckout && checkoutStatus !== 'loading'
            ? 'bg-[#0877ff] hover:bg-[#0068e8]'
            : 'cursor-not-allowed bg-slate-300'
        }`}
      >
        {checkoutStatus === 'loading' ? 'Ouverture de Stripe...' : order.paymentStatus === 'paid' ? 'Paiement confirme' : 'Paiement securise'}
      </button>
      {checkoutStatus === 'error' ? <p className="mt-3 text-sm font-bold text-red-700">{checkoutError}</p> : null}
    </Card>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-700">{label}</span>
      <span className="font-black text-ink">{value}</span>
    </div>
  );
}

function OrderAccordion({
  order,
  specs,
  gerberFile,
  pricingBreakdown,
  destination,
  deleteStatus,
  deleteError,
  onDelete,
}: {
  order: CustomerOrderSummary;
  specs: PcbSpecs;
  gerberFile: GerberFileInfo;
  pricingBreakdown: PricingLineItem[];
  destination: string;
  deleteStatus: DeleteStatus;
  deleteError: string;
  onDelete: () => void;
}) {
  const productionDelay = order.estimatedDeliveryAt ? formatDate(order.estimatedDeliveryAt) : 'A confirmer';

  return (
    <details className="group border-b border-line last:border-b-0" open>
      <summary className="grid cursor-pointer list-none gap-3 px-5 py-4 transition hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_5rem_8rem_7rem] md:items-center">
        <div className="min-w-0">
          <p className="text-base font-black text-ink">{order.orderNumber}</p>
          <p className="mt-1 truncate text-sm text-slate-600">{specs.productType} - {specs.dimensions} - {destination}</p>
        </div>
        <div className="flex items-center justify-between md:block">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500 md:hidden">Qte</span>
          <span className="font-black">{specs.quantity}</span>
        </div>
        <div className="flex items-center justify-between md:block">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500 md:hidden">Delais</span>
          <span className="text-sm font-bold text-slate-700">{productionDelay}</span>
        </div>
        <div className="flex items-center justify-between md:block md:text-right">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500 md:hidden">Prix</span>
          <span className="font-black text-[#ff7a00]">{formatMoney(order.totalPrice, order.currency)}</span>
        </div>
      </summary>
      <div className="border-t border-line bg-slate-50 p-4">
        <div className="mb-4 flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Gestion commande</p>
            <p className="mt-1 text-sm text-slate-600">Vous pouvez retirer cette commande du panier et de votre espace client.</p>
          </div>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleteStatus === 'deleting'}
            className="inline-flex h-10 items-center justify-center rounded-full border border-red-300 px-4 text-sm font-black text-red-700 transition hover:border-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleteStatus === 'deleting' ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
        {deleteStatus === 'error' ? (
          <p className="mb-4 rounded-sm border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{deleteError}</p>
        ) : null}
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <PcbSpecsCard specs={specs} gerberFile={gerberFile} />
          <PricingBreakdownCard order={order} pricingBreakdown={pricingBreakdown} />
        </div>
      </div>
    </details>
  );
}

function forgetCustomerOrder(orderId: string) {
  if (typeof window === 'undefined') return;

  try {
    const current = JSON.parse(window.localStorage.getItem(customerOrdersStorageKey) ?? '[]') as string[];
    const next = Array.isArray(current) ? current.filter((id) => id !== orderId) : [];
    window.localStorage.setItem(customerOrdersStorageKey, JSON.stringify(next));
    window.dispatchEvent(new Event('kendronics:orders-updated'));
  } catch {
    window.localStorage.setItem(customerOrdersStorageKey, JSON.stringify([]));
    window.dispatchEvent(new Event('kendronics:orders-updated'));
  }
}

function PcbSpecsCard({ specs, gerberFile }: { specs: PcbSpecs; gerberFile: GerberFileInfo }) {
  const rows = [
    ['Type de produit', specs.productType],
    ['Couches', `${specs.layers}`],
    ['Dimensions', specs.dimensions],
    ['Quantite', `${specs.quantity}`],
    ['Materiau de base', specs.baseMaterial],
    ['Epaisseur', specs.thickness],
    ['Masque de soudure', specs.solderMaskColor],
    ['Finition de surface', specs.surfaceFinish],
    ['Assemblage', specs.assemblyRequired ? 'Requis' : 'Non requis'],
  ];

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Specifications PCB</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Resume de fabrication</h2>
        </div>
        <FileBadge status={gerberFile.validationStatus} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-sm border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-2 text-sm font-black text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-sm border border-slate-200 bg-white p-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Gerber televerse</p>
        <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
          <p><span className="font-black text-ink">Fichier :</span> {gerberFile.fileName}</p>
          <p><span className="font-black text-ink">Taille :</span> {gerberFile.fileSize}</p>
          <p><span className="font-black text-ink">Televerse :</span> {formatDate(gerberFile.uploadedAt)}</p>
        </div>
      </div>
    </Card>
  );
}

function PricingBreakdownCard({
  order,
  pricingBreakdown,
}: {
  order: CustomerOrderSummary;
  pricingBreakdown: PricingLineItem[];
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Detail du prix</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Resume des couts</h2>
      <div className="mt-5 divide-y divide-slate-100">
        {pricingBreakdown.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 py-3 text-sm">
            <span className="font-bold text-slate-600">{item.label}</span>
            <span className="font-black text-ink">{formatMoney(item.amount, order.currency)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-sm bg-deepblue p-4 text-white">
        <span className="text-sm font-black">Total paye</span>
        <span className="text-xl font-black">{formatMoney(order.totalPrice, order.currency)}</span>
      </div>
    </Card>
  );
}

function SupportCard({ supportHref, orderNumber }: { supportHref: string; orderNumber: string }) {
  return (
    <Card className="p-6">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Besoin d aide ?</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Contacter le support</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Ouvrez un ticket avec {orderNumber} attache afin que le support puisse verifier la timeline client de la commande.
      </p>
      <a
        href={supportHref}
        className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-deepblue px-5 text-sm font-black text-white transition hover:bg-deepblue-dark"
      >
        Ouvrir un ticket support
      </a>
    </Card>
  );
}

function StatusBadge({ status }: { status: CustomerTrackingStatus }) {
  return (
      <span className="inline-flex h-10 items-center rounded-full border border-signal bg-sky-50 px-4 text-sm font-black text-deepblue">
      {statusLabels[status]}
    </span>
  );
}

function FileBadge({ status }: { status: GerberFileInfo['validationStatus'] }) {
  const label = status === 'validated' ? 'Gerber validated' : status === 'pending_review' ? 'Review pending' : 'Review failed';
  const classes =
    status === 'validated'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
      : status === 'pending_review'
        ? 'bg-amber-50 text-amber-700 ring-amber-100'
        : 'bg-red-50 text-red-700 ring-red-100';

  return <span className={`rounded-full px-3 py-2 text-xs font-black ring-1 ${classes}`}>{label}</span>;
}

function normalizeOrderDetail(orderId: string, orderPayload: Partial<CustomerOrderSummary>, trackingPayload: unknown): OrderDetailResponse {
  const demo = buildDemoOrderDetail(orderId);
  const timeline = Array.isArray(trackingPayload)
    ? trackingPayload
        .filter((event): event is Record<string, string> => Boolean(event && typeof event === 'object'))
        .map((event) => ({
          id: event.id ?? crypto.randomUUID(),
          status: isCustomerTrackingStatus(event.status) ? event.status : demo.order.status,
          title: event.title ?? statusLabels[demo.order.status],
          description: event.description,
          location: event.location,
          occurredAt: event.occurredAt,
        }))
    : demo.trackingTimeline;

  const status = orderPayload.status && isCustomerTrackingStatus(orderPayload.status) ? orderPayload.status : demo.order.status;

  return {
    ...demo,
    order: {
      ...demo.order,
      id: orderPayload.id ?? demo.order.id,
      orderNumber: orderPayload.orderNumber ?? demo.order.orderNumber,
      status,
      destinationCountryIso2: orderPayload.destinationCountryIso2 ?? demo.order.destinationCountryIso2,
      estimatedDeliveryAt: orderPayload.estimatedDeliveryAt ?? demo.order.estimatedDeliveryAt,
      paymentStatus: orderPayload.paymentStatus ?? (status === 'paid' ? 'paid' : demo.order.paymentStatus),
      totalPrice: orderPayload.totalPrice ?? demo.order.totalPrice,
      currency: orderPayload.currency ?? demo.order.currency,
    },
    trackingTimeline: timeline,
  };
}

function buildDemoOrderDetail(orderId: string): OrderDetailResponse {
  const now = Date.now();

  return {
    order: {
      id: orderId,
      orderNumber: `KEN-${orderId.slice(0, 8).toUpperCase()}`,
      status: 'supplier_in_production',
      paymentStatus: 'paid',
      destinationCountryIso2: 'SN',
      totalPrice: 184.4,
      currency: 'EUR',
      estimatedDeliveryAt: new Date(now + 13 * 24 * 60 * 60 * 1000).toISOString(),
    },
    pcbSpecs: {
      productType: 'Standard PCB',
      layers: 4,
      dimensions: '80 x 60 mm',
      quantity: 20,
      baseMaterial: 'FR4',
      thickness: '1.6mm',
      solderMaskColor: 'Green',
      surfaceFinish: 'HASL lead-free',
      assemblyRequired: false,
    },
    gerberFile: {
      fileName: 'kendronics-controller-rev-a.zip',
      fileSize: '3.8 MB',
      uploadedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      validationStatus: 'validated',
    },
    pricingBreakdown: [
      { label: 'PCB production', amount: 72 },
      { label: 'Engineering and handling', amount: 24 },
      { label: 'International logistics', amount: 58 },
      { label: 'Payment processing', amount: 6.4 },
      { label: 'Customs buffer', amount: 24 },
    ],
    trackingTimeline: [
      {
        id: 'paid',
        status: 'paid',
        title: 'Payment confirmed',
        description: 'Payment was confirmed and the order moved into fulfillment.',
        occurredAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'supplier_order_pending',
        status: 'supplier_order_pending',
        title: 'Partner order prepared',
        description: 'Kendronics reviewed the files and prepared the external partner order.',
        occurredAt: new Date(now - 36 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'supplier_ordered',
        status: 'supplier_ordered',
        title: 'Partner order placed',
        description: 'The production request was placed with an approved external manufacturing partner.',
        occurredAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'supplier_in_production',
        status: 'supplier_in_production',
        title: 'In production',
        description: 'The boards are in production. Supplier identifiers remain internal.',
        occurredAt: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };
}

function formatMoney(amount: number, currency: CustomerOrderSummary['currency']): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}
