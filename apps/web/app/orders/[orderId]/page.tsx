'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../../components/layout/Navbar';
import { Card } from '../../../components/ui/Card';
import { getApiBaseUrl } from '../../../lib/api-base-url';
import { africanCountries } from '../../../lib/african-countries';
import { readAuthSession, readFreshAuthSession } from '../../../lib/auth-session';
import { readScopedLocalStorage, writeScopedLocalStorage } from '../../../lib/user-scoped-storage';
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
  PaymentStatus,
  PcbSpecs,
  PricingLineItem,
  TrackingTimelineItem,
} from '../../../lib/order-detail-contract';

type PageStatus = 'loading' | 'ready' | 'error';
type CheckoutStatus = 'idle' | 'loading' | 'error';
type MobileMoneyStatus = 'idle' | 'loading' | 'pending' | 'error';
type DeleteStatus = 'idle' | 'deleting' | 'error';
type PaymentMethod = 'stripe' | 'mobile_money';
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [mobileMoneyStatus, setMobileMoneyStatus] = useState<MobileMoneyStatus>('idle');
  const [mobileMoneyError, setMobileMoneyError] = useState('');
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState('');
  const [mobileMoneyCountryIso2, setMobileMoneyCountryIso2] = useState('');
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>('idle');
  const [deleteError, setDeleteError] = useState('');
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [shippingConfirmed, setShippingConfirmed] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<'direct' | 'review_first'>('direct');

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
  const canCheckout = status === 'ready' && detail?.order.paymentStatus === 'pending';
  const checkoutAddress = detail ? readCheckoutAddress(destination) : null;
  const shippingLabel = detail ? shippingMethodLabel(detail.order.quoteSnapshot?.shippingMode) : 'Livraison a confirmer';
  const shippingDelay = detail?.order.quoteSnapshot?.configSnapshot?.liveShippingTransitTime
    ? String(detail.order.quoteSnapshot.configSnapshot.liveShippingTransitTime)
    : detail?.order.quoteSnapshot?.configSnapshot?.estimatedShippingTime
      ? String(detail.order.quoteSnapshot.configSnapshot.estimatedShippingTime)
      : detail?.order.estimatedDeliveryAt
        ? formatDate(detail.order.estimatedDeliveryAt)
        : 'Delai a confirmer';

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

  async function startMobileMoneyPayment() {
    if (!detail) return;
    setMobileMoneyStatus('loading');
    setMobileMoneyError('');

    try {
      const session = await readFreshAuthSession();
      if (!session) {
        throw new Error('Connectez-vous avant de payer cette commande.');
      }

      const response = await fetch(`${apiBaseUrl}/api/payments/mobile-money`, {
        method: 'POST',
        headers: {
          Authorization: `${session.tokenType} ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: detail.order.id,
          phoneNumber: mobileMoneyPhone,
          countryIso2: mobileMoneyCountryIso2 || detail.order.destinationCountryIso2 || 'SN',
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(Array.isArray(error?.message) ? error.message.join(' ') : error?.message ?? 'Impossible de lancer le paiement Mobile Money.');
      }

      const payment = (await response.json()) as { checkoutUrl?: string };
      if (payment.checkoutUrl) {
        window.location.assign(payment.checkoutUrl);
        return;
      }

      setMobileMoneyStatus('pending');
    } catch (error) {
      setMobileMoneyStatus('error');
      setMobileMoneyError(error instanceof Error ? error.message : 'Impossible de lancer le paiement Mobile Money.');
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
    <main className="min-h-screen bg-[#eef1f5] text-[#111827]">
      <header className="border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1360px] items-center gap-8 px-5">
          <a href="/" aria-label="Kendronics accueil" className="shrink-0">
            <img src="/images/kendronics-logo.png" alt="Kendronics" className="h-11 w-auto" />
          </a>
          <div>
            <h1 className="text-base uppercase text-black">Caisse s&eacute;curis&eacute;e SSL</h1>
            <p className="mt-2 text-sm text-[#8b929b]">Vos informations sont prot&eacute;g&eacute;es</p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1360px] px-5 py-8">
        <a href="/profile?view=orders" className="mb-4 inline-flex items-center gap-2 text-sm text-black hover:text-[#0877ff]">
          <span aria-hidden="true">&larr;</span>
          Retour au panier
        </a>
        {status === 'error' && (
          <div className="mb-5 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Impossible de charger cette commande. Connectez-vous avec le bon compte ou cr&eacute;ez un nouveau devis.
            <a href="/quote" className="ml-2 underline">Ouvrir le devis</a>
          </div>
        )}
        {status === 'loading' || !detail ? (
          <div className="border border-line bg-white p-6 text-sm text-slate-600">
            {status === 'loading' ? 'Chargement de la commande...' : 'Aucune donnee de commande a afficher.'}
          </div>
        ) : (
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <CheckoutAddressCard
              address={checkoutAddress}
              confirmed={addressConfirmed}
              onConfirm={() => setAddressConfirmed(true)}
              onChange={() => setAddressConfirmed(false)}
            />
            <CheckoutShippingCard
              confirmed={shippingConfirmed}
              shippingLabel={shippingLabel}
              shippingDelay={shippingDelay}
              onConfirm={() => setShippingConfirmed(true)}
              onChange={() => setShippingConfirmed(false)}
            />
            <CheckoutSubmitCard
              mode={submissionMode}
              onModeChange={setSubmissionMode}
            />
          </div>

          <div className="xl:sticky xl:top-6 xl:self-start">
            <SummaryCard
              order={detail.order}
              canCheckout={canCheckout}
              checkoutStatus={checkoutStatus}
              checkoutError={checkoutError}
              submissionMode={submissionMode}
              addressConfirmed={addressConfirmed}
              shippingConfirmed={shippingConfirmed}
              onCheckout={submissionMode === 'direct' ? startStripeCheckout : () => router.push(`/contact?orderId=${encodeURIComponent(detail.order.id)}&topic=review-before-payment`)}
            />
          </div>
          <div className="fixed bottom-16 right-8 hidden h-[62px] w-[62px] place-items-center rounded-full bg-white text-xs text-[#0f8f6b] shadow-sm ring-1 ring-[#dbe4ee] xl:grid">
            K
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
  submissionMode,
  addressConfirmed,
  shippingConfirmed,
  onCheckout,
}: {
  order: CustomerOrderSummary;
  canCheckout: boolean;
  checkoutStatus: CheckoutStatus;
  checkoutError: string;
  submissionMode: 'direct' | 'review_first';
  addressConfirmed: boolean;
  shippingConfirmed: boolean;
  onCheckout: () => void;
}) {
  const quote = order.quoteSnapshot;
  const shipping = quote ? lineAmount(quote.breakdown, ['FranceToAfricaDelivery', 'franceToAfricaDelivery']) : 0;
  const taxes = quote ? lineAmount(quote.breakdown, ['taxesIfApplicable', 'customsRiskBuffer']) : 0;
  const merchandise = Math.max(0, order.totalPrice - shipping - taxes);
  const canSubmit = canCheckout && addressConfirmed && shippingConfirmed && checkoutStatus !== 'loading';

  return (
    <aside className="bg-white p-8 shadow-sm ring-1 ring-[#e3e7ec]">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl uppercase text-black">R&eacute;sum&eacute;</h2>
        <a href="/profile?view=orders" className="text-sm text-[#0877ff]">1 articles &gt;</a>
      </div>

      <div className="mt-7 space-y-6 text-[15px]">
        <SummaryLine label="Total marchandises" value={formatMoney(merchandise, order.currency)} />
        <SummaryLine label="Estimation de la livraison" value={shipping > 0 ? formatMoney(shipping, order.currency) : 'A confirmer'} />
        <SummaryLine label="Droits de douane et taxes" value={taxes > 0 ? formatMoney(taxes, order.currency) : 'A confirmer'} />
        <div className="flex items-center justify-between border-t border-[#dfe5ec] pt-6 text-lg">
          <span className="text-[#ff7a00]">Total g&eacute;n&eacute;ral</span>
          <span className="text-[#ff7a00]">{formatMoney(order.totalPrice, order.currency)}</span>
        </div>
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={onCheckout}
        className={`mt-8 inline-flex h-[42px] w-full items-center justify-center rounded-full px-5 text-base text-white transition ${
          canSubmit ? 'bg-[#0877ff] hover:bg-[#0068e8]' : 'cursor-not-allowed bg-slate-300'
        }`}
      >
        {submissionMode === 'direct' ? stripeButtonLabel(order.paymentStatus, checkoutStatus) : 'Soumettre la commande'}
      </button>

      {checkoutStatus === 'error' ? <p className="mt-3 text-sm font-bold text-red-700">{checkoutError}</p> : null}
      {!addressConfirmed || !shippingConfirmed ? (
        <p className="mt-3 text-xs leading-5 text-[#8b929b]">Confirmez l'adresse et la livraison pour continuer.</p>
      ) : null}
    </aside>
  );

}

type CheckoutAddress = {
  name: string;
  phone: string;
  line: string;
};

function CheckoutAddressCard({
  address,
  confirmed,
  onConfirm,
  onChange,
}: {
  address: CheckoutAddress | null;
  confirmed: boolean;
  onConfirm: () => void;
  onChange: () => void;
}) {
  return (
    <section className="bg-white p-5 shadow-sm ring-1 ring-[#e3e7ec]">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl text-black">1. Adresse de livraison</h2>
        {confirmed ? (
          <button type="button" onClick={onChange} className="text-sm text-[#8b929b] hover:text-[#0877ff]">Changer</button>
        ) : null}
      </div>

      {confirmed ? (
        <div className="mt-6 space-y-4 text-sm text-black">
          <p>Informations de livraison</p>
          <p>{address?.name || 'Adresse a completer'} {address?.phone || ''}</p>
          <p>{address?.line || 'Ajoutez une adresse de livraison dans votre profil.'}</p>
          <span className="inline-block text-xl leading-none text-[#64748b]">v</span>
        </div>
      ) : (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-black">Informations de livraison</p>
            <a href="/profile?view=shipping-address" className="text-sm text-[#0877ff]">+Ajouter une nouvelle adresse de livraison</a>
          </div>
          <div className="mt-5 max-h-[132px] space-y-5 overflow-y-auto pr-3">
            {[0, 1, 2].map((item) => (
              <label key={item} className="flex items-center gap-3 text-sm text-[#8b929b]">
                <input
                  type="radio"
                  name="shipping-address"
                  checked={item === 0}
                  onChange={onConfirm}
                  className="h-4 w-4 accent-[#0877ff]"
                />
                <span className={item === 0 ? 'text-black' : ''}>{address?.line || 'Adresse de livraison a completer'}</span>
                {item === 0 ? <span className="ml-auto bg-[#f0f2f5] px-3 py-2 text-xs text-[#4b5563]">D&eacute;faut</span> : null}
              </label>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-sm text-black">Informations de facturation</p>
            <a href="/profile?view=billing" className="text-sm text-[#0877ff]">+Ajouter une nouvelle adresse de facturation</a>
          </div>
          <div className="mt-5 space-y-5">
            <label className="flex items-center gap-3 text-sm text-black">
              <input type="radio" name="billing-address" defaultChecked className="h-4 w-4 accent-[#0877ff]" />
              Identique a l'adresse de livraison
            </label>
            <label className="flex items-center gap-3 text-sm text-black">
              <input type="radio" name="billing-address" className="h-4 w-4 accent-[#0877ff]" />
              Choisir une adresse de facturation
            </label>
          </div>

          <button type="button" onClick={onConfirm} className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-[#0877ff] px-8 text-sm text-white">
            Continuer
          </button>
        </div>
      )}
    </section>
  );
}

function CheckoutShippingCard({
  confirmed,
  shippingLabel,
  shippingDelay,
  onConfirm,
  onChange,
}: {
  confirmed: boolean;
  shippingLabel: string;
  shippingDelay: string;
  onConfirm: () => void;
  onChange: () => void;
}) {
  return (
    <section className="bg-white p-5 shadow-sm ring-1 ring-[#e3e7ec]">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl text-black">2. M&eacute;thode d'exp&eacute;dition</h2>
        {confirmed ? <button type="button" onClick={onChange} className="text-sm text-[#8b929b] hover:text-[#0877ff]">Changer</button> : null}
      </div>
      {confirmed ? (
        <div className="mt-6 flex gap-12 text-sm text-black">
          <span>{shippingLabel}</span>
          <span>{shippingDelay}</span>
        </div>
      ) : (
        <div className="mt-5">
          <label className="flex items-center gap-4 text-sm text-black">
            <input type="radio" name="shipping-method" defaultChecked className="h-4 w-4 accent-[#0877ff]" />
            <span>{shippingLabel}</span>
            <span>{shippingDelay}</span>
          </label>
          <button type="button" onClick={onConfirm} className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-[#0877ff] px-8 text-sm text-white">
            Continuer
          </button>
        </div>
      )}
    </section>
  );
}

function CheckoutSubmitCard({
  mode,
  onModeChange,
}: {
  mode: 'direct' | 'review_first';
  onModeChange: (mode: 'direct' | 'review_first') => void;
}) {
  return (
    <section className="bg-white p-5 shadow-sm ring-1 ring-[#e3e7ec]">
      <h2 className="text-2xl text-black">3. Soumettre la commande</h2>
      <div className="mt-7 space-y-5 text-sm">
        <label className="flex items-start gap-3 text-black">
          <input
            type="radio"
            name="submission-mode"
            checked={mode === 'direct'}
            onChange={() => onModeChange('direct')}
            className="mt-1 h-4 w-4 accent-[#0877ff]"
          />
          <span>
            <span className="block">Payer directement (recommande)</span>
            <span className="mt-3 block leading-6 text-[#8b929b]">
              Nous vous sugg&eacute;rons de payer avant la r&eacute;vision des fichiers pour assurer une production efficace. Si votre fichier ne peut pas &ecirc;tre approuv&eacute; pour la production apr&egrave;s r&eacute;vision, vous recevrez un remboursement.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 text-black">
          <input
            type="radio"
            name="submission-mode"
            checked={mode === 'review_first'}
            onChange={() => onModeChange('review_first')}
            className="mt-1 h-4 w-4 accent-[#0877ff]"
          />
          <span>
            <span className="block">R&eacute;vision avant paiement</span>
            <span className="mt-3 block leading-6 text-[#8b929b]">
              Vous pouvez demander une r&eacute;vision de fichier avant paiement. La production ne d&eacute;marre pas avant validation du fichier et r&eacute;ception du paiement.
            </span>
          </span>
        </label>
      </div>
    </section>
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
    const current = JSON.parse(readScopedLocalStorage(customerOrdersStorageKey) ?? '[]') as string[];
    const next = Array.isArray(current) ? current.filter((id) => id !== orderId) : [];
    writeScopedLocalStorage(customerOrdersStorageKey, JSON.stringify(next));
    window.dispatchEvent(new Event('kendronics:orders-updated'));
  } catch {
    writeScopedLocalStorage(customerOrdersStorageKey, JSON.stringify([]));
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
        <span className="text-sm font-black">{paymentTotalLabel(order.paymentStatus)}</span>
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

function readCheckoutAddress(destination: string): CheckoutAddress | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = JSON.parse(readScopedLocalStorage('kendronics.customer.profile') ?? '{}') as {
      name?: string;
      phone?: string;
      shippingAddress?: Partial<{
        firstName: string;
        lastName: string;
        street: string;
        apartment: string;
        city: string;
        region: string;
        country: string;
        postalCode: string;
        phone: string;
      }>;
    };
    const address = stored.shippingAddress ?? {};
    const name = [address.firstName, address.lastName].filter(Boolean).join(' ') || stored.name || 'Client Kendronics';
    const phone = address.phone || stored.phone || '';
    const line = [
      address.street,
      address.apartment,
      address.city,
      address.region,
      address.postalCode,
      address.country || destination,
    ].filter(Boolean).join(', ');

    return {
      name,
      phone,
      line: line || `Adresse de livraison ${destination || 'a completer'}`,
    };
  } catch {
    return {
      name: 'Client Kendronics',
      phone: '',
      line: `Adresse de livraison ${destination || 'a completer'}`,
    };
  }
}

function shippingMethodLabel(mode?: string): string {
  if (mode === 'express') return 'DHL Express';
  if (mode === 'economy') return 'Livraison economique';
  if (mode === 'standard') return 'Livraison standard';
  return 'Livraison a confirmer';
}

function lineAmount(breakdown: Record<string, number>, keys: string[]): number {
  return keys.reduce((total, key) => total + Number(breakdown[key] ?? 0), 0);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function stripeButtonLabel(paymentStatus: PaymentStatus, checkoutStatus: CheckoutStatus): string {
  if (checkoutStatus === 'loading') return 'Ouverture de Stripe...';
  return paymentActionLabel(paymentStatus, 'Payer par carte');
}

function mobileMoneyButtonLabel(paymentStatus: PaymentStatus, mobileMoneyStatus: MobileMoneyStatus): string {
  if (mobileMoneyStatus === 'loading') return 'Demande en cours...';
  return paymentActionLabel(paymentStatus, 'Payer par Mobile Money');
}

function paymentActionLabel(paymentStatus: PaymentStatus, defaultLabel: string): string {
  if (paymentStatus === 'paid') return 'Paiement confirme';
  if (paymentStatus === 'authorized') return 'Paiement autorise';
  if (paymentStatus === 'canceled') return 'Autorisation annulee';
  if (paymentStatus === 'expired') return 'Autorisation expiree';
  if (paymentStatus === 'failed') return 'Paiement refuse';
  return defaultLabel;
}

function paymentTotalLabel(paymentStatus: PaymentStatus): string {
  if (paymentStatus === 'paid') return 'Total paye';
  if (paymentStatus === 'authorized') return 'Montant autorise';
  return 'Total a payer';
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
