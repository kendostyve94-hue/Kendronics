'use client';

import { use, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../../components/layout/Navbar';
import { Card } from '../../../components/ui/Card';
import { getApiBaseUrl } from '../../../lib/api-base-url';
import { africanCountries } from '../../../lib/african-countries';
import { readFreshAuthSession } from '../../../lib/auth-session';
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
const profileStorageKey = 'kendronics.customer.profile';

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
  const [paymentTermsAccepted, setPaymentTermsAccepted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      setStatus('loading');

      try {
        const session = await readFreshAuthSession();
        const headers: HeadersInit = session
          ? { Authorization: `Bearer ${session.accessToken}` }
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
  const checkoutAddress = useMemo(() => (detail ? readCheckoutAddress(destination) : normalizeAddress()), [detail?.order.id, destination]);
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
          Authorization: `Bearer ${session.accessToken}`,
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
        throw new Error(paymentErrorMessage(error, 'Impossible de lancer le paiement Stripe.'));
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
          Authorization: `Bearer ${session.accessToken}`,
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
            Authorization: `Bearer ${session.accessToken}`,
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
        <div className="mx-auto flex min-h-[72px] max-w-[1360px] items-center gap-5 px-4 py-3 sm:gap-8 sm:px-5 sm:py-0">
          <a href="/" aria-label="Kendronics accueil" className="shrink-0">
            <img src="/images/kendronics-logo.png" alt="Kendronics" className="h-10 w-auto sm:h-11" />
          </a>
          <div className="min-w-0">
            <h1 className="text-sm uppercase text-black sm:text-base">Caisse s&eacute;curis&eacute;e SSL</h1>
            <p className="mt-1 text-xs leading-5 text-[#8b929b] sm:mt-2 sm:text-sm">Vos informations sont prot&eacute;g&eacute;es</p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1360px] px-4 py-5 sm:px-5 sm:py-8">
        <a href="/profile?view=orders" className="mb-5 inline-flex items-center gap-2 text-sm text-black hover:text-[#0877ff]">
          <span aria-hidden="true">&larr;</span>
          Retour au panier
        </a>
        {status === 'error' && (
          <div className="mb-4 bg-red-50 p-3 text-sm leading-6 text-red-700 sm:border sm:border-red-200 sm:p-4">
            Impossible de charger cette commande. Connectez-vous avec le bon compte ou cr&eacute;ez un nouveau devis.
            <a href="/quote" className="ml-2 underline">Ouvrir le devis</a>
          </div>
        )}
        {status === 'loading' ? (
          <div className="bg-white p-0 text-sm text-slate-600 sm:border sm:border-line sm:p-6">
            Chargement de la commande...
          </div>
        ) : status === 'error' ? null : !detail ? (
          <div className="bg-white p-0 text-sm text-slate-600 sm:border sm:border-line sm:p-6">
            Aucune donnee de commande a afficher.
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
              accepted={paymentTermsAccepted}
              onAcceptedChange={setPaymentTermsAccepted}
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
              termsAccepted={paymentTermsAccepted}
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
  termsAccepted,
  onCheckout,
}: {
  order: CustomerOrderSummary;
  canCheckout: boolean;
  checkoutStatus: CheckoutStatus;
  checkoutError: string;
  submissionMode: 'direct' | 'review_first';
  addressConfirmed: boolean;
  shippingConfirmed: boolean;
  termsAccepted: boolean;
  onCheckout: () => void;
}) {
  const quote = order.quoteSnapshot;
  const shipping = quote ? lineAmount(quote.breakdown, ['FranceToAfricaDelivery', 'franceToAfricaDelivery']) : 0;
  const taxes = quote ? lineAmount(quote.breakdown, ['taxesIfApplicable', 'customsRiskBuffer']) : 0;
  const merchandise = Math.max(0, order.totalPrice - shipping - taxes);
  const canSubmit = canCheckout && addressConfirmed && shippingConfirmed && termsAccepted && checkoutStatus !== 'loading';

  return (
    <aside className="bg-white p-0 sm:p-8 sm:shadow-sm sm:ring-1 sm:ring-[#e3e7ec]">
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
      {!addressConfirmed || !shippingConfirmed || !termsAccepted ? (
        <p className="mt-3 text-xs leading-5 text-[#8b929b]">Enregistrez l'adresse, confirmez la livraison et acceptez les conditions de paiement pour continuer.</p>
      ) : null}
    </aside>
  );

}

type AccountAddress = {
  accountType: string;
  firstName: string;
  lastName: string;
  company: string;
  street: string;
  apartment: string;
  country: string;
  region: string;
  city: string;
  postalCode: string;
  taxId: string;
  phone: string;
};

function CheckoutAddressCard({
  address,
  confirmed,
  onConfirm,
  onChange,
}: {
  address: AccountAddress;
  confirmed: boolean;
  onConfirm: () => void;
  onChange: () => void;
}) {
  const [formAddress, setFormAddress] = useState<AccountAddress>(() => normalizeAddress(address));
  const [editing, setEditing] = useState(!isCompleteShippingAddress(address));
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const canContinue = isCompleteShippingAddress(formAddress);
  const fieldsDisabled = !editing && canContinue;

  useEffect(() => {
    setFormAddress(normalizeAddress(address));
    setEditing(!isCompleteShippingAddress(address));
  }, [address]);

  function updateAddress<K extends keyof AccountAddress>(key: K, value: AccountAddress[K]) {
    setFormAddress((current) => ({ ...current, [key]: value }));
    setSaveStatus('idle');
    if (confirmed) onChange();
  }

  async function submitAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isCompleteShippingAddress(formAddress)) {
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');
    try {
      const session = await readFreshAuthSession();
      if (!session) {
        throw new Error('Session manquante');
      }

      const response = await fetch(`${apiBaseUrl}/api/users/me/shipping-address`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: formAddress }),
      });

      if (!response.ok) throw new Error(`Address update failed: ${response.status}`);
      const user = (await response.json()) as { shippingAddress?: AccountAddress };
      const savedAddress = normalizeAddress(user.shippingAddress ?? formAddress);
      setFormAddress(savedAddress);
      writeCheckoutAddress(savedAddress);
      setEditing(false);
      setSaveStatus('saved');
      onConfirm();
    } catch {
      setSaveStatus('error');
    }
  }

  return (
    <section className="bg-white p-0 sm:p-5 sm:shadow-sm sm:ring-1 sm:ring-[#e3e7ec]">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl text-black">1. Adresse de livraison</h2>
      </div>

      <form onSubmit={submitAddress} className="mt-6">
        <CheckoutAddressFields address={formAddress} disabled={fieldsDisabled} onUpdate={updateAddress} />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {editing ? (
            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#0f8f6b] px-7 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {saveStatus === 'saving' ? 'Enregistrement...' : 'Enregistrer l\'adresse'}
            </button>
          ) : null}
          <button
            type="button"
            disabled={!canContinue}
            onClick={onConfirm}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#0877ff] px-8 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Continuer
          </button>
          {canContinue && !editing ? (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                onChange();
              }}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#cfd8e3] px-7 text-sm text-[#334155] hover:border-[#0877ff] hover:text-[#0877ff]"
            >
              Modifier
            </button>
          ) : null}
          <a href="/profile?view=shipping-address" className="text-sm text-[#0877ff]">Gerer mes adresses dans le profil</a>
        </div>
        {!canContinue ? (
          <p className="mt-3 text-xs leading-5 text-red-600">Enregistrez une adresse de livraison complete avant de continuer.</p>
        ) : null}
        {saveStatus === 'saved' ? <p className="mt-3 text-xs leading-5 text-[#0f8f6b]">Adresse de livraison enregistree.</p> : null}
        {saveStatus === 'error' ? <p className="mt-3 text-xs leading-5 text-red-600">Impossible d'enregistrer cette adresse. Verifiez les champs obligatoires.</p> : null}
      </form>
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
    <section className="bg-white p-0 sm:p-5 sm:shadow-sm sm:ring-1 sm:ring-[#e3e7ec]">
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

function CheckoutAddressFields({
  address,
  disabled,
  onUpdate,
}: {
  address: AccountAddress;
  disabled: boolean;
  onUpdate: <K extends keyof AccountAddress>(key: K, value: AccountAddress[K]) => void;
}) {
  const fieldClassName = `h-[46px] border border-[#cfd8e3] bg-white px-5 text-sm outline-none placeholder:text-[#7b8794] focus:border-[#0f8f6b] disabled:bg-[#f8fafc] disabled:text-[#64748b]`;

  return (
    <div className="grid gap-x-7 gap-y-4 md:grid-cols-2">
      <CheckoutChoiceBox label="Societe" active={address.accountType === 'company'} disabled={disabled} onClick={() => onUpdate('accountType', 'company')} />
      <CheckoutChoiceBox label="Particulier" active={address.accountType !== 'company'} disabled={disabled} onClick={() => onUpdate('accountType', 'individual')} />
      <input required disabled={disabled} value={address.firstName} onChange={(event) => onUpdate('firstName', event.target.value)} placeholder="Prenom *" className={fieldClassName} />
      <input required disabled={disabled} value={address.lastName} onChange={(event) => onUpdate('lastName', event.target.value)} placeholder="Nom de famille *" className={fieldClassName} />
      <input required disabled={disabled} value={address.street} onChange={(event) => onUpdate('street', event.target.value)} placeholder="Adresse de la rue *" className={fieldClassName} />
      <input disabled={disabled} value={address.apartment} onChange={(event) => onUpdate('apartment', event.target.value)} placeholder="Appartement, chambre, batiment, etage, etc. (facultatif)" className={fieldClassName} />
      <select required disabled={disabled} value={address.country} onChange={(event) => onUpdate('country', event.target.value)} className={fieldClassName}>
        <option value="">Pays/Region *</option>
        {africanCountries.map((country) => (
          <option key={country.iso2} value={country.name}>{country.name}</option>
        ))}
      </select>
      <input disabled={disabled} value={address.region} onChange={(event) => onUpdate('region', event.target.value)} placeholder="Etat/Province/Region" className={fieldClassName} />
      <input required disabled={disabled} value={address.city} onChange={(event) => onUpdate('city', event.target.value)} placeholder="Ville *" className={fieldClassName} />
      <input disabled={disabled} value={address.postalCode} onChange={(event) => onUpdate('postalCode', event.target.value)} placeholder="Zip/Code postal" className={fieldClassName} />
      <input disabled={disabled} value={address.taxId} onChange={(event) => onUpdate('taxId', event.target.value)} placeholder="Numero TVA/identification fiscale" className={fieldClassName} />
      <input required disabled={disabled} value={address.phone} onChange={(event) => onUpdate('phone', event.target.value)} placeholder="Telephone mobile *" className={fieldClassName} />
    </div>
  );
}

function CheckoutChoiceBox({ label, active, disabled, onClick }: { label: string; active?: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-10 items-center gap-4 border px-4 text-sm disabled:cursor-default ${active ? 'border-[#0f8f6b] bg-[#eefbf4]' : 'border-[#cfd8e3] bg-white'}`}
    >
      <span className={`h-5 w-5 border ${active ? 'border-[#0f8f6b] bg-[#0f8f6b]' : 'border-[#cfd3d8] bg-white'}`} />
      {label}
    </button>
  );
}

function CheckoutSubmitCard({
  mode,
  onModeChange,
  accepted,
  onAcceptedChange,
}: {
  mode: 'direct' | 'review_first';
  onModeChange: (mode: 'direct' | 'review_first') => void;
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
}) {
  return (
    <section className="bg-white p-0 sm:p-5 sm:shadow-sm sm:ring-1 sm:ring-[#e3e7ec]">
      <h2 className="text-2xl text-black">3. Soumettre la commande</h2>
      <div className="mt-6 space-y-5 text-sm leading-6 text-[#334155]">
        <p>
          En continuant, votre commande passe au paiement securise par carte. Le montant est d'abord autorise, sans capture immediate. Les fichiers et les parametres techniques sont controles avant le lancement de la production.
        </p>
        <p>
          Si les fichiers sont acceptes, le paiement est capture et la production demarre. Si une anomalie bloque le lancement, vous pouvez corriger une fois ou abandonner. Apres un second refus, l'autorisation est annulee automatiquement et le montant est libere.
        </p>
        <div className="grid gap-3 border border-[#dfe5ec] bg-[#f8fafc] p-4">
          <label className="flex items-start gap-3 text-black">
            <input
              type="radio"
              name="submission-mode"
              checked={mode === 'direct'}
              onChange={() => onModeChange('direct')}
              className="mt-1 h-4 w-4 accent-[#0877ff]"
            />
            <span>Autoriser le paiement et lancer le controle technique.</span>
          </label>
        </div>
        <label className="flex items-start gap-3 border border-[#dfe5ec] p-4 text-black">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => onAcceptedChange(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[#0f8f6b]"
          />
          <span>
            J'accepte que le montant soit autorise avant le controle technique, puis capture uniquement si les fichiers sont acceptes. En cas de refus, je peux corriger une fois ou abandonner; apres un second refus, l'autorisation est annulee et le montant est libere.
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
    partnerManufacturingCost: 'Prix fabrication estime',
    partnerHandlingCost: 'Traitement fabrication',
    ChinaToFranceLogistics: 'Logistique fabrication',
    FranceProcessingFee: 'Traitement fabrication',
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

function readCheckoutAddress(destination: string): AccountAddress {
  if (typeof window === 'undefined') return normalizeAddress({ country: destination });

  try {
    const stored = JSON.parse(readScopedLocalStorage(profileStorageKey) ?? '{}') as {
      name?: string;
      phone?: string;
      shippingAddress?: Partial<AccountAddress>;
    };
    const fallbackName = splitName(stored.name ?? '');
    return normalizeAddress({
      ...stored.shippingAddress,
      firstName: stored.shippingAddress?.firstName || fallbackName.firstName,
      lastName: stored.shippingAddress?.lastName || fallbackName.lastName,
      phone: stored.shippingAddress?.phone || stored.phone || '',
      country: stored.shippingAddress?.country || destination,
    });
  } catch {
    return normalizeAddress({ country: destination });
  }
}

function writeCheckoutAddress(address: AccountAddress) {
  if (typeof window === 'undefined') return;

  try {
    const stored = JSON.parse(readScopedLocalStorage(profileStorageKey) ?? '{}') as Record<string, unknown>;
    writeScopedLocalStorage(profileStorageKey, JSON.stringify({ ...stored, shippingAddress: address }));
  } catch {
    writeScopedLocalStorage(profileStorageKey, JSON.stringify({ shippingAddress: address }));
  }
}

function normalizeAddress(address?: Partial<AccountAddress>): AccountAddress {
  return {
    accountType: address?.accountType === 'company' ? 'company' : 'individual',
    firstName: address?.firstName ?? '',
    lastName: address?.lastName ?? '',
    company: address?.company ?? '',
    street: address?.street ?? '',
    apartment: address?.apartment ?? '',
    country: address?.country ?? '',
    region: address?.region ?? '',
    city: address?.city ?? '',
    postalCode: address?.postalCode ?? '',
    taxId: address?.taxId ?? '',
    phone: address?.phone ?? '',
  };
}

function isCompleteShippingAddress(address?: AccountAddress): boolean {
  if (!address) return false;
  return Boolean(
    address.firstName.trim() &&
    address.lastName.trim() &&
    address.street.trim() &&
    address.country.trim() &&
    address.city.trim() &&
    address.phone.trim(),
  );
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
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
  return paymentActionLabel(paymentStatus, 'Autoriser le paiement');
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

function paymentErrorMessage(error: unknown, fallback: string): string {
  const payload = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  const message = payload.message;
  if (Array.isArray(message)) return message.join(' ');
  if (typeof message === 'string') return message;
  if (message && typeof message === 'object') {
    const nested = message as Record<string, unknown>;
    const missing = Array.isArray(nested.missing_steps) ? nested.missing_steps.map(String).join(', ') : '';
    if (typeof nested.message === 'string') {
      return missing ? `${nested.message} Etapes manquantes: ${missing}.` : nested.message;
    }
  }
  if (typeof payload.required_verification_level === 'string') {
    const missing = Array.isArray(payload.missing_steps) ? payload.missing_steps.map(String).join(', ') : '';
    return missing ? `Verification requise avant paiement. Etapes manquantes: ${missing}.` : 'Verification requise avant paiement.';
  }
  return fallback;
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
