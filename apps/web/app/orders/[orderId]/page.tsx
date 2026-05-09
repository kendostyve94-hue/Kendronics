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
  TrackingTimelineItem,
} from '../../../lib/order-detail-contract';

type PageStatus = 'loading' | 'ready' | 'error';
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
  const [detail, setDetail] = useState<OrderDetailResponse | null>(null);
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
          throw new Error('Détails de commande indisponibles.');
        }

        const orderPayload = await orderResponse.json();
        const trackingPayload = await trackingResponse.json();

        if (!cancelled) {
          setDetail(buildOrderDetail(orderPayload, trackingPayload));
          setStatus('ready');
        }
      } catch {
        if (!cancelled) {
          setDetail(null);
          setStatus('error');
        }
      }
    }

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const destination = detail ? countryNames[detail.order.destinationCountryIso2] ?? detail.order.destinationCountryIso2 : '';
  const supportHref = detail ? `/contact?orderId=${encodeURIComponent(detail.order.id)}` : '/contact';
  const canCheckout = status === 'ready' && detail?.order.paymentStatus === 'pending';

  async function startStripeCheckout() {
    if (!detail) return;
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
    if (!detail) return;
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
              <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Détail de commande</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Consultez les fichiers, spécifications, coûts et actions disponibles pour cette commande.
              </p>
            </div>
            {detail ? <StatusBadge status={detail.order.status} /> : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-4 py-5 sm:px-6 lg:px-8">
        {status === 'error' && (
          <div className="mb-5 rounded-sm border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            Impossible de charger cette commande. Connectez-vous avec le bon compte ou créez un nouveau devis.
            <a href="/quote" className="ml-2 underline">Ouvrir le devis</a>
          </div>
        )}
        {status === 'loading' || !detail ? (
          <div className="rounded-sm border border-line bg-white p-6 text-sm font-bold text-slate-600">
            {status === 'loading' ? 'Chargement de la commande...' : 'Aucune donnée de commande à afficher.'}
          </div>
        ) : (

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="overflow-hidden rounded-sm border border-line bg-white">
            <div className="flex flex-col gap-2 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Commande</p>
                <p className="mt-1 text-lg font-black text-ink">{detail.order.orderNumber}</p>
              </div>
              <p className="text-sm font-bold text-slate-600">{detail.pcbSpecs.productType}</p>
            </div>

            <OrderAccordion
              order={detail.order}
              specs={detail.pcbSpecs}
              gerberFile={detail.gerberFile}
              pricingBreakdown={detail.pricingBreakdown}
              trackingTimeline={detail.trackingTimeline}
              destination={destination}
              deleteStatus={deleteStatus}
              deleteError={deleteError}
              onDelete={deleteOrder}
            />
          </div>

          <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
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
        )}
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
      <h2 className="text-xl font-black tracking-tight text-ink">Résumé</h2>
      <div className="mt-5 space-y-4 text-sm">
        <SummaryLine label="Total marchandises" value={formatMoney(order.totalPrice, order.currency)} />
        <SummaryLine label="Livraison" value="Incluse ou confirmée au paiement" />
        <div className="flex items-center justify-between border-t border-line pt-4 text-base font-black">
          <span>Total</span>
          <span className="text-[#ff7a00]">{formatMoney(order.totalPrice, order.currency)}</span>
        </div>
        <div className="border-t border-line pt-4">
          <SummaryLine label="Date d’expédition estimée" value={shippingEstimate} />
          <p className="mt-3 text-xs leading-5 text-slate-500">
            La commande avance après validation des fichiers, paiement et disponibilité fournisseur.
          </p>
        </div>
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
        {checkoutStatus === 'loading' ? 'Ouverture de Stripe...' : order.paymentStatus === 'paid' ? 'Paiement confirmé' : 'Paiement sécurisé'}
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
  trackingTimeline,
  destination,
  deleteStatus,
  deleteError,
  onDelete,
}: {
  order: CustomerOrderSummary;
  specs: PcbSpecs;
  gerberFile: GerberFileInfo;
  pricingBreakdown: PricingLineItem[];
  trackingTimeline: TrackingTimelineItem[];
  destination: string;
  deleteStatus: DeleteStatus;
  deleteError: string;
  onDelete: () => void;
}) {
  const productionDelay = order.estimatedDeliveryAt ? formatDate(order.estimatedDeliveryAt) : 'À confirmer après validation';

  return (
    <details className="group border-b border-line last:border-b-0" open>
      <summary className="grid cursor-pointer list-none gap-3 px-5 py-4 transition hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_10rem_9rem_8rem] md:items-center">
        <div className="min-w-0">
          <p className="text-base font-black text-ink">{order.orderNumber}</p>
          <p className="mt-1 truncate text-sm text-slate-600">{specs.productType} - {specs.dimensions} - {destination}</p>
        </div>
        <div className="flex items-center justify-between md:block">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500 md:block">Qté</span>
          <span className="font-black">{specs.quantity}</span>
        </div>
        <div className="flex items-center justify-between md:block">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500 md:block">Délais</span>
          <span className="text-sm font-bold text-slate-700">{productionDelay}</span>
        </div>
        <div className="flex items-center justify-between md:block md:text-right">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500 md:block">Prix</span>
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
        <TrackingTimelineCard events={trackingTimeline} />
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
    ['Quantité', `${specs.quantity}`],
    ['Matériau de base', specs.baseMaterial],
    ['Épaisseur', specs.thickness],
    ['Masque de soudure', specs.solderMaskColor],
    ['Finition de surface', specs.surfaceFinish],
    ['Assemblage', specs.assemblyRequired ? 'Requis' : 'Non requis'],
  ];

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Spécifications PCB</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Résumé de fabrication</h2>
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
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Gerber téléversé</p>
        <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
          <p><span className="font-black text-ink">Fichier :</span> {gerberFile.fileName}</p>
          <p><span className="font-black text-ink">Taille :</span> {gerberFile.fileSize}</p>
          <p><span className="font-black text-ink">Téléversé :</span> {formatDate(gerberFile.uploadedAt)}</p>
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
      <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Détail du prix</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Résumé des coûts</h2>
      <div className="mt-5 divide-y divide-slate-100">
        {pricingBreakdown.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 py-3 text-sm">
            <span className="font-bold text-slate-600">{item.label}</span>
            <span className="font-black text-ink">{formatMoney(item.amount, order.currency)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-sm bg-deepblue p-4 text-white">
        <span className="text-sm font-black">{order.paymentStatus === 'paid' ? 'Total payé' : 'Total à payer'}</span>
        <span className="text-xl font-black">{formatMoney(order.totalPrice, order.currency)}</span>
      </div>
    </Card>
  );
}

function TrackingTimelineCard({ events }: { events: TrackingTimelineItem[] }) {
  return (
    <Card className="mt-4 p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Suivi commande</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Historique</h2>
      <div className="mt-5 space-y-3">
        {events.map((event) => (
          <div key={event.id} className="border-l-4 border-[#0f8f6b] bg-white px-4 py-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black text-ink">{event.title}</p>
                {event.description ? <p className="mt-1 text-sm leading-6 text-slate-600">{event.description}</p> : null}
                {event.location ? <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{event.location}</p> : null}
              </div>
              <p className="text-xs font-bold text-slate-500">{event.occurredAt ? formatDate(event.occurredAt) : 'Date à confirmer'}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SupportCard({ supportHref, orderNumber }: { supportHref: string; orderNumber: string }) {
  return (
    <Card className="p-6">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Besoin d’aide ?</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Contacter le support</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Ouvrez un ticket avec {orderNumber} attaché afin que le support puisse vérifier la timeline client de la commande.
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
  const label = status === 'validated' ? 'Gerber valide' : status === 'pending_review' ? 'Revue en attente' : 'Revue refusée';
  const classes =
    status === 'validated'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
      : status === 'pending_review'
        ? 'bg-amber-50 text-amber-700 ring-amber-100'
        : 'bg-red-50 text-red-700 ring-red-100';

  return <span className={`rounded-full px-3 py-2 text-xs font-black ring-1 ${classes}`}>{label}</span>;
}

function buildOrderDetail(orderPayload: CustomerOrderSummary, trackingPayload: unknown): OrderDetailResponse {
  const quote = orderPayload.quoteSnapshot;
  const config = quote?.configSnapshot ?? {};
  const fallbackStatus = isCustomerTrackingStatus(orderPayload.status) ? orderPayload.status : 'awaiting_payment';
  const timeline = Array.isArray(trackingPayload)
    ? trackingPayload
        .filter((event): event is Record<string, string> => Boolean(event && typeof event === 'object'))
        .map((event) => ({
          id: event.id ?? `${orderPayload.id}-${event.status ?? 'event'}`,
          status: isCustomerTrackingStatus(event.status) ? event.status : fallbackStatus,
          title: event.title ?? statusLabels[fallbackStatus],
          description: event.description,
          location: event.location,
          occurredAt: event.occurredAt,
        }))
    : [];

  return {
    order: {
      ...orderPayload,
      status: fallbackStatus,
      paymentStatus: orderPayload.paymentStatus ?? (fallbackStatus === 'paid' ? 'paid' : 'pending'),
      totalPrice: orderPayload.totalPrice ?? quote?.finalTotal ?? 0,
      currency: orderPayload.currency ?? quote?.currency ?? 'EUR',
    },
    pcbSpecs: {
      productType: productLabel(stringValue(config.productType) ?? quote?.productType ?? 'PCB'),
      layers: numberValue(config.layers) ?? quote?.layers ?? 0,
      dimensions: `${numberValue(config.lengthMm) ?? quote?.lengthMm ?? numberValue(config.length) ?? 0} x ${numberValue(config.widthMm) ?? quote?.widthMm ?? numberValue(config.width) ?? 0} mm`,
      quantity: numberValue(config.quantity) ?? quote?.quantity ?? 0,
      baseMaterial: stringValue(config.baseMaterial) ?? 'Non renseigné',
      thickness: stringValue(config.thickness) ?? 'Non renseigné',
      solderMaskColor: stringValue(config.solderMaskColor) ?? 'Non renseigné',
      surfaceFinish: stringValue(config.surfaceFinish) ?? 'Non renseigné',
      assemblyRequired: booleanValue(config.assemblyRequired) ?? quote?.productType === 'pcb_assembly',
    },
    gerberFile: {
      fileName: stringValue(config.gerberFileName) ?? 'Fichier rattaché au devis',
      fileSize: 'Archive privée',
      uploadedAt: quote?.createdAt ?? new Date().toISOString(),
      validationStatus: 'pending_review',
    },
    pricingBreakdown: quote ? breakdownLines(quote.breakdown) : [],
    trackingTimeline: timeline.length > 0 ? timeline : [{
      id: `${orderPayload.id}-created`,
      status: fallbackStatus,
      title: statusLabels[fallbackStatus],
      occurredAt: quote?.createdAt,
    }],
  };
}

function breakdownLines(breakdown: Record<string, number>): PricingLineItem[] {
  const labels: Record<string, string> = {
    partnerManufacturingCost: 'Prix fournisseur estimé',
    partnerHandlingCost: 'Traitement fournisseur',
    ChinaToFranceLogistics: 'Logistique fournisseur',
    FranceProcessingFee: 'Traitement fournisseur',
    FranceToAfricaDelivery: 'Livraison choisie',
    customsRiskBuffer: 'Buffer intelligent',
    paymentProcessingFee: 'Frais paiement',
    KendronicsServiceFee: 'Service Kendronics',
    taxesIfApplicable: 'Taxes applicables',
  };

  return Object.entries(labels)
    .map(([key, label]) => ({ label, amount: Number(breakdown[key] ?? 0) }))
    .filter((item) => item.amount > 0);
}

function productLabel(value: string): string {
  return {
    standard_pcb: 'PCB standard',
    advanced_pcb: 'PCB avancé',
    fpc_rigid_flex: 'FPC / Rigid-Flex',
    pcb_assembly: 'Assemblage PCB',
    smt_stencil: 'Stencil SMT',
    cnc_3d: 'CNC / 3D',
  }[value] ?? value;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function formatMoney(amount: number, currency: CustomerOrderSummary['currency']): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
}
