'use client';

import { use, useEffect, useState } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Card } from '../../../components/ui/Card';
import { getApiBaseUrl } from '../../../lib/api-base-url';
import { readAuthSession } from '../../../lib/auth-session';
import {
  customerTrackingStatuses,
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

type PageStatus = 'loading' | 'ready' | 'demo' | 'error';
const apiBaseUrl = getApiBaseUrl();

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
  const [detail, setDetail] = useState<OrderDetailResponse>(() => buildDemoOrderDetail(orderId));
  const [status, setStatus] = useState<PageStatus>('loading');

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
          throw new Error('Order detail unavailable.');
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
  const supportHref = `/support?orderId=${encodeURIComponent(detail.order.id)}`;

  return (
    <main className="min-h-screen bg-cloud">
      <Navbar />
      <section className="relative overflow-hidden bg-ink pb-28 pt-32 text-white">
        <img
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2200&q=85"
          alt="Macro view of a printed circuit board"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.34]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.84] to-deepblue/[0.6]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-100">Order detail</p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                {detail.order.orderNumber}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
                Customer-safe progress, payment, pricing, and logistics timeline for this Kendronics PCB order.
              </p>
            </div>
            <StatusBadge status={detail.order.status} />
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-16 max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {status === 'demo' && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
            Showing customer-safe preview data because the authenticated order API is unavailable in this environment.
          </div>
        )}
        {status === 'error' && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            We could not load this order. Please refresh or contact support.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
          <div className="space-y-6">
            <OverviewCards order={detail.order} destination={destination} />
            <PcbSpecsCard specs={detail.pcbSpecs} gerberFile={detail.gerberFile} />
            <PricingBreakdownCard order={detail.order} pricingBreakdown={detail.pricingBreakdown} />
          </div>

          <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <TrackingTimeline currentStatus={detail.order.status} items={detail.trackingTimeline} />
            <SupportCard supportHref={supportHref} orderNumber={detail.order.orderNumber} />
          </div>
        </div>
      </section>
    </main>
  );
}

function OverviewCards({ order, destination }: { order: CustomerOrderSummary; destination: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryTile label="Order ID" value={order.id} />
      <SummaryTile label="Total price" value={formatMoney(order.totalPrice, order.currency)} />
      <SummaryTile label="Payment" value={capitalize(order.paymentStatus)} />
      <SummaryTile label="Destination" value={destination} />
      <SummaryTile
        label="Estimated delivery"
        value={order.estimatedDeliveryAt ? formatDate(order.estimatedDeliveryAt) : 'Pending confirmation'}
        className="md:col-span-2 xl:col-span-4"
      />
    </div>
  );
}

function SummaryTile({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <Card className={`p-5 ${className}`}>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-lg font-black text-ink">{value}</p>
    </Card>
  );
}

function PcbSpecsCard({ specs, gerberFile }: { specs: PcbSpecs; gerberFile: GerberFileInfo }) {
  const rows = [
    ['Product type', specs.productType],
    ['Layers', `${specs.layers}`],
    ['Dimensions', specs.dimensions],
    ['Quantity', `${specs.quantity}`],
    ['Base material', specs.baseMaterial],
    ['Thickness', specs.thickness],
    ['Solder mask', specs.solderMaskColor],
    ['Surface finish', specs.surfaceFinish],
    ['Assembly', specs.assemblyRequired ? 'Required' : 'Not required'],
  ];

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">PCB specs</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Manufacturing snapshot</h2>
        </div>
        <FileBadge status={gerberFile.validationStatus} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-2 text-sm font-black text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Uploaded Gerber</p>
        <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
          <p><span className="font-black text-ink">File:</span> {gerberFile.fileName}</p>
          <p><span className="font-black text-ink">Size:</span> {gerberFile.fileSize}</p>
          <p><span className="font-black text-ink">Uploaded:</span> {formatDate(gerberFile.uploadedAt)}</p>
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
    <Card className="p-6">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Pricing breakdown</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Cost summary</h2>
      <div className="mt-5 divide-y divide-slate-100">
        {pricingBreakdown.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 py-3 text-sm">
            <span className="font-bold text-slate-600">{item.label}</span>
            <span className="font-black text-ink">{formatMoney(item.amount, order.currency)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-deepblue p-4 text-white">
        <span className="text-sm font-black">Total paid</span>
        <span className="text-xl font-black">{formatMoney(order.totalPrice, order.currency)}</span>
      </div>
    </Card>
  );
}

function TrackingTimeline({
  currentStatus,
  items,
}: {
  currentStatus: CustomerTrackingStatus;
  items: TrackingTimelineItem[];
}) {
  const completedStatuses = new Set(
    customerTrackingStatuses.slice(0, customerTrackingStatuses.indexOf(currentStatus) + 1),
  );
  const itemByStatus = new Map(items.map((item) => [item.status, item]));

  return (
    <Card className="p-6">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Tracking timeline</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Progress</h2>
      <div className="mt-6 space-y-0">
        {customerTrackingStatuses.map((status, index) => {
          const event = itemByStatus.get(status);
          const isComplete = completedStatuses.has(status);
          const isCurrent = status === currentStatus;

          return (
            <div key={status} className="relative grid grid-cols-[2rem_1fr] gap-3 pb-6 last:pb-0">
              {index < customerTrackingStatuses.length - 1 && (
                <div className="absolute left-[0.94rem] top-8 h-full w-px bg-slate-200" />
              )}
              <div
                className={`relative z-10 grid h-8 w-8 place-items-center rounded-full border text-xs font-black ${
                  isComplete
                    ? 'border-sky-200 bg-sky-50 text-deepblue'
                    : 'border-slate-200 bg-white text-slate-400'
                }`}
              >
                {isComplete ? index + 1 : ''}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-ink">{event?.title ?? statusLabels[status]}</p>
                  {isCurrent && <span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-black text-deepblue">Current</span>}
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {event?.description ?? defaultTimelineDescription(status)}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {event?.occurredAt ? formatDate(event.occurredAt) : isComplete ? 'Completed' : 'Pending'}
                  {event?.location ? ` - ${event.location}` : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SupportCard({ supportHref, orderNumber }: { supportHref: string; orderNumber: string }) {
  return (
    <Card className="p-6">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Need help?</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Contact support</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Open a ticket with {orderNumber} attached so the support team can review the customer-safe order timeline.
      </p>
      <a
        href={supportHref}
        className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-deepblue px-5 text-sm font-black text-white transition hover:bg-deepblue-dark"
      >
        Open support ticket
      </a>
    </Card>
  );
}

function StatusBadge({ status }: { status: CustomerTrackingStatus }) {
  return (
    <span className="inline-flex h-12 items-center rounded-xl border border-white/[0.18] bg-white/10 px-5 text-sm font-black text-sky-100 backdrop-blur-xl">
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

function defaultTimelineDescription(status: CustomerTrackingStatus): string {
  const descriptions: Record<CustomerTrackingStatus, string> = {
    paid: 'Payment is confirmed.',
    supplier_order_pending: 'Kendronics is preparing the external partner order.',
    supplier_ordered: 'The partner production order has been placed.',
    supplier_in_production: 'The boards are being produced by an approved external partner.',
    received_at_france_hub: 'The shipment has reached the France coordination hub.',
    shipped_to_africa: 'The order has left the France hub for the destination region.',
    customs_processing: 'The shipment is being processed by customs.',
    out_for_delivery: 'The package is with the local delivery partner.',
    delivered: 'The order has been delivered.',
  };

  return descriptions[status];
}

function formatMoney(amount: number, currency: CustomerOrderSummary['currency']): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
