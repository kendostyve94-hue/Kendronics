'use client';

import { use, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
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
type PaymentMethod = 'stripe' | 'mobile_money' | 'paypal';
type CheckoutShippingMethod = {
  id: string;
  carrier: string;
  service: string;
  amount: number;
  currency: CustomerOrderSummary['currency'];
  transitTime: string;
  deliveryDate: string;
};
const apiBaseUrl = getApiBaseUrl();
const customerOrdersStorageKey = 'kendronics.customer.orders';
const profileStorageKey = 'kendronics.customer.profile';
const savedShippingAddressesKey = 'kendronics.customer.shipping-addresses';

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [mobileMoneyStatus, setMobileMoneyStatus] = useState<MobileMoneyStatus>('idle');
  const [mobileMoneyError, setMobileMoneyError] = useState('');
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState('');
  const [mobileMoneyCountryIso2, setMobileMoneyCountryIso2] = useState('');
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>('idle');
  const [deleteError, setDeleteError] = useState('');
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [shippingConfirmed, setShippingConfirmed] = useState(false);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState('');
  const [paymentMethodConfirmed, setPaymentMethodConfirmed] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<'direct' | 'review_first'>('direct');
  const [paymentTermsAccepted, setPaymentTermsAccepted] = useState(false);
  const [accountAddress, setAccountAddress] = useState<AccountAddress | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      setStatus('loading');

      try {
        const session = await readFreshAuthSession();
        const headers: HeadersInit = session
          ? { Authorization: `Bearer ${session.accessToken}` }
          : {};

        const orderResponse = await fetch(`${apiBaseUrl}${orderDetailApiContract.order.path.replace(':orderId', orderId)}`, {
          credentials: 'include',
          headers,
        });

        if (!orderResponse.ok) {
          throw new Error('Détails de commande indisponibles.');
        }

        const orderPayload = await orderResponse.json();
        const trackingResponse = await fetch(`${apiBaseUrl}${orderDetailApiContract.tracking.path.replace(':orderId', orderId)}`, {
          credentials: 'include',
          headers,
        }).catch(() => null);
        const trackingPayload = trackingResponse?.ok ? await trackingResponse.json().catch(() => []) : [];
        const accountPayload = session
          ? await fetch(`${apiBaseUrl}/api/users/me`, {
              credentials: 'include',
              headers,
            })
              .then((response) => (response.ok ? response.json() : null))
              .catch(() => null)
          : null;

        if (!cancelled) {
          setDetail(buildOrderDetail(orderPayload, trackingPayload));
          setAccountAddress(buildCheckoutAddressFromAccount(accountPayload, orderPayload));
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
  const checkoutAddress = useMemo(() => (detail ? accountAddress ?? readCheckoutAddress(destination) : normalizeAddress()), [accountAddress, detail?.order.id, destination]);
  const shippingMethods = useMemo(() => (detail ? buildCheckoutShippingMethods(detail.order) : []), [detail?.order.id]);

  useEffect(() => {
    if (!detail) return;
    setSelectedShippingMethodId((current) => (shippingMethods.some((method) => method.id === current) ? current : shippingMethods[0]?.id ?? ''));
  }, [detail?.order.id, shippingMethods]);

  useEffect(() => {
    if (!detail) return;
    setMobileMoneyPhone((current) => current || checkoutAddress.phone);
    setMobileMoneyCountryIso2((current) => current || detail.order.destinationCountryIso2 || 'SN');
  }, [checkoutAddress.phone, detail?.order.destinationCountryIso2]);

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
    if (!mobileMoneyPhone.trim()) {
      setMobileMoneyStatus('error');
      setMobileMoneyError('Renseignez un numero Mobile Money avant de continuer.');
      setCheckoutStatus('error');
      setCheckoutError('Renseignez un numero Mobile Money avant de continuer.');
      return;
    }
    setCheckoutStatus('loading');
    setCheckoutError('');
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
      setCheckoutStatus('idle');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de lancer le paiement Mobile Money.';
      setCheckoutStatus('error');
      setCheckoutError(message);
      setMobileMoneyStatus('error');
      setMobileMoneyError(message);
    }
  }

  async function startPaypalPayment() {
    setCheckoutStatus('error');
    setCheckoutError('PayPal n est pas encore branche a une route de paiement production. Activez une API PayPal avant de proposer ce mode au client.');
  }

  function startSelectedPayment() {
    if (paymentMethod === 'mobile_money') {
      void startMobileMoneyPayment();
      return;
    }

    if (paymentMethod === 'paypal') {
      void startPaypalPayment();
      return;
    }

    void startStripeCheckout();
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
    <main className="mobile-free-page min-h-screen bg-white text-[#111827]">
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
              methods={shippingMethods}
              selectedMethodId={selectedShippingMethodId}
              onSelectedMethodChange={(methodId) => {
                setSelectedShippingMethodId(methodId);
                if (shippingConfirmed) setShippingConfirmed(false);
              }}
              onConfirm={() => setShippingConfirmed(true)}
              onChange={() => setShippingConfirmed(false)}
            />
            <CheckoutPaymentMethodCard
              method={paymentMethod}
              confirmed={paymentMethodConfirmed}
              mobileMoneyPhone={mobileMoneyPhone}
              mobileMoneyCountryIso2={mobileMoneyCountryIso2}
              mobileMoneyStatus={mobileMoneyStatus}
              mobileMoneyError={mobileMoneyError}
              destinationCountryIso2={detail.order.destinationCountryIso2}
              onMethodChange={(nextMethod) => {
                setPaymentMethod(nextMethod);
                setPaymentMethodConfirmed(false);
                setCheckoutStatus('idle');
                setCheckoutError('');
                setMobileMoneyStatus('idle');
                setMobileMoneyError('');
              }}
              onMobileMoneyPhoneChange={setMobileMoneyPhone}
              onMobileMoneyCountryIso2Change={setMobileMoneyCountryIso2}
              onConfirm={() => setPaymentMethodConfirmed(true)}
              onChange={() => {
                setPaymentMethod('');
                setPaymentMethodConfirmed(false);
              }}
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
              paymentMethodConfirmed={paymentMethodConfirmed}
              paymentMethod={paymentMethod}
              termsAccepted={paymentTermsAccepted}
              onCheckout={submissionMode === 'direct' ? startSelectedPayment : () => router.push(`/contact?orderId=${encodeURIComponent(detail.order.id)}&topic=review-before-payment`)}
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
  paymentMethodConfirmed,
  paymentMethod,
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
  paymentMethodConfirmed: boolean;
  paymentMethod: PaymentMethod | '';
  termsAccepted: boolean;
  onCheckout: () => void;
}) {
  const quote = order.quoteSnapshot;
  const shipping = quote ? lineAmount(quote.breakdown, ['FranceToAfricaDelivery', 'franceToAfricaDelivery']) : 0;
  const taxes = quote ? lineAmount(quote.breakdown, ['taxesIfApplicable', 'customsRiskBuffer']) : 0;
  const merchandise = Math.max(0, order.totalPrice - shipping - taxes);
  const canSubmit = canCheckout && addressConfirmed && shippingConfirmed && paymentMethodConfirmed && termsAccepted && checkoutStatus !== 'loading';

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
        {submissionMode === 'direct' ? paymentButtonLabel(paymentMethod, order.paymentStatus, checkoutStatus) : 'Soumettre la commande'}
      </button>

      {checkoutStatus === 'error' ? <p className="mt-3 text-sm font-bold text-red-700">{checkoutError}</p> : null}
      {!addressConfirmed || !shippingConfirmed || !paymentMethodConfirmed || !termsAccepted ? (
        <p className="mt-3 text-xs leading-5 text-[#8b929b]">Confirmez l'adresse, la livraison, le moyen de paiement et les conditions pour continuer.</p>
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

type SavedAddress = AccountAddress & {
  id: string;
  isDefault: boolean;
};

type AccountPayload = {
  fullName?: string;
  companyName?: string;
  phone?: string;
  country?: string;
  shippingAddress?: Partial<AccountAddress>;
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
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(() => readCheckoutSavedAddresses(address));
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const selectedAddress = savedAddresses.find((item) => item.id === selectedAddressId) ?? null;
  const canContinue = Boolean(selectedAddress && isCompleteShippingAddress(selectedAddress));

  useEffect(() => {
    const nextAddresses = readCheckoutSavedAddresses(address);
    setSavedAddresses(nextAddresses);
    setSelectedAddressId((current) => (nextAddresses.some((item) => item.id === current) ? current : ''));
  }, [address]);

  function selectAddress(addressId: string) {
    const nextAddresses = savedAddresses.map((item) => ({ ...item, isDefault: item.id === addressId }));
    const nextSelected = nextAddresses.find((item) => item.id === addressId);
    setSelectedAddressId(addressId);
    setSavedAddresses(nextAddresses);
    writeScopedLocalStorage(savedShippingAddressesKey, JSON.stringify(nextAddresses));
    if (nextSelected) writeCheckoutAddress(nextSelected);
    if (confirmed) onChange();
  }

  return (
    <section className="bg-white p-0 sm:p-5 sm:shadow-sm sm:ring-1 sm:ring-[#e3e7ec]">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl text-black">1. Adresse de livraison</h2>
        {confirmed ? (
          <button
            type="button"
            onClick={() => {
              setSelectedAddressId('');
              onChange();
            }}
            className="text-sm text-[#0f8f6b] hover:text-[#0877ff]"
          >
            Modifier
          </button>
        ) : null}
      </div>

      <div className="mt-6">
        {savedAddresses.length > 0 ? (
          <div className="space-y-2">
            {savedAddresses.map((savedAddress) => (
              <label key={savedAddress.id} className="grid cursor-pointer gap-3 border border-slate-200 bg-white p-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                <span className="flex min-w-0 items-start gap-2">
                  <input
                    type="radio"
                    checked={selectedAddressId === savedAddress.id}
                    onChange={() => selectAddress(savedAddress.id)}
                    className="mt-1 h-4 w-4 accent-[#0877ff]"
                  />
                  <span className="min-w-0 text-slate-700">
                    <span className="font-semibold text-slate-900">{addressDisplayName(savedAddress)}</span>
                    <span> / {formatAddressLine(savedAddress)}</span>
                  </span>
                </span>
                {savedAddress.isDefault ? <span className="text-xs font-semibold text-[#0f8f6b]">Defaut</span> : null}
              </label>
            ))}
          </div>
        ) : (
          <div className="border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            Aucune adresse de livraison enregistree. Ajoutez une adresse dans votre profil avant de finaliser la commande.
          </div>
        )}
        {!confirmed ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => {
                if (selectedAddress) writeCheckoutAddress(selectedAddress);
                onConfirm();
              }}
              className="inline-flex h-10 items-center justify-center rounded-sm bg-[#0877ff] px-8 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Continuer
            </button>
            <a href="/profile?view=shipping-address" className="inline-flex h-10 items-center justify-center rounded-sm border border-[#cfd8e3] px-7 text-sm text-[#334155] hover:border-[#0877ff] hover:text-[#0877ff]">
              Modifier une adresse
            </a>
          </div>
        ) : null}
        {!confirmed && !canContinue ? (
          <p className="mt-3 text-xs leading-5 text-red-600">Enregistrez une adresse de livraison complete dans votre profil avant de continuer.</p>
        ) : null}
      </div>
    </section>
  );
}

function CheckoutShippingCard({
  confirmed,
  methods,
  selectedMethodId,
  onSelectedMethodChange,
  onConfirm,
  onChange,
}: {
  confirmed: boolean;
  methods: CheckoutShippingMethod[];
  selectedMethodId: string;
  onSelectedMethodChange: (methodId: string) => void;
  onConfirm: () => void;
  onChange: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const selectedMethod = methods.find((method) => method.id === selectedMethodId) ?? null;
  const canContinue = Boolean(selectedMethod);

  return (
    <section className="bg-white p-0 sm:p-5 sm:shadow-sm sm:ring-1 sm:ring-[#e3e7ec]">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl text-black">2. M&eacute;thode d'exp&eacute;dition</h2>
        {confirmed ? (
          <button
            type="button"
            onClick={() => {
              onSelectedMethodChange('');
              onChange();
              setDialogOpen(true);
            }}
            className="text-sm text-[#0f8f6b] hover:text-[#0877ff]"
          >
            Modifier
          </button>
        ) : null}
      </div>

      {selectedMethod ? (
        <div className="mt-6 grid gap-3 text-sm text-black sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Agence</p>
            <p className="mt-1 font-semibold">{selectedMethod.carrier}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Mode</p>
            <p className="mt-1 font-semibold">{selectedMethod.service}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Livraison estimee</p>
            <p className="mt-1 font-semibold">{selectedMethod.deliveryDate}</p>
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <p className="text-sm text-amber-700">Selectionnez une methode d'expedition pour continuer.</p>
        </div>
      )}

      {!confirmed ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!canContinue}
            onClick={onConfirm}
            className="inline-flex h-10 items-center justify-center rounded-sm bg-[#0877ff] px-8 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Continuer
          </button>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="inline-flex h-10 items-center justify-center rounded-sm border border-[#cfd8e3] px-7 text-sm text-[#334155] hover:border-[#0877ff] hover:text-[#0877ff]"
          >
            Voir les options
          </button>
        </div>
      ) : null}

      {dialogOpen ? (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/45 px-3 py-12 sm:py-16">
          <div className="mx-auto mt-14 max-w-[760px] bg-white p-5 shadow-xl sm:mt-10 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[#0f8f6b]">Livraison</p>
                <h3 className="mt-1 text-2xl text-black">Choisir le mode de livraison</h3>
              </div>
              <button type="button" onClick={() => setDialogOpen(false)} className="text-3xl leading-none text-[#0f172a]">&times;</button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#dfe5ec] text-left text-xs uppercase tracking-[0.12em] text-[#64748b]">
                    <th className="w-10 py-3" />
                    <th className="py-3">Mode de livraison</th>
                    <th className="py-3">Couts</th>
                    <th className="py-3">Date de livraison</th>
                  </tr>
                </thead>
                <tbody>
                  {methods.map((method) => (
                    <tr key={method.id} className="border-b border-[#eef2f7]">
                      <td className="py-3">
                        <input
                          type="radio"
                          name="checkout-shipping-method"
                          checked={selectedMethodId === method.id}
                          onChange={() => onSelectedMethodChange(method.id)}
                          className="h-4 w-4 accent-[#0f8f6b]"
                        />
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex min-w-[64px] justify-center border border-[#f0c200] bg-[#ffd73a] px-3 py-1 text-xs italic text-red-600">{method.carrier}</span>
                          <span>{method.service}</span>
                        </div>
                      </td>
                      <td className="py-3">{formatMoney(method.amount, method.currency)}</td>
                      <td className="py-3">{method.deliveryDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-7 flex justify-center">
              <button
                type="button"
                disabled={!selectedMethodId}
                onClick={() => setDialogOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-sm bg-[#0f8f6b] px-10 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CheckoutPaymentMethodCard({
  method,
  confirmed,
  mobileMoneyPhone,
  mobileMoneyCountryIso2,
  mobileMoneyStatus,
  mobileMoneyError,
  destinationCountryIso2,
  onMethodChange,
  onMobileMoneyPhoneChange,
  onMobileMoneyCountryIso2Change,
  onConfirm,
  onChange,
}: {
  method: PaymentMethod | '';
  confirmed: boolean;
  mobileMoneyPhone: string;
  mobileMoneyCountryIso2: string;
  mobileMoneyStatus: MobileMoneyStatus;
  mobileMoneyError: string;
  destinationCountryIso2: string;
  onMethodChange: (method: PaymentMethod) => void;
  onMobileMoneyPhoneChange: (phone: string) => void;
  onMobileMoneyCountryIso2Change: (countryIso2: string) => void;
  onConfirm: () => void;
  onChange: () => void;
}) {
  const canContinue = Boolean(method) && (method !== 'mobile_money' || Boolean(mobileMoneyPhone.trim()));

  return (
    <section className="bg-white p-0 sm:p-5 sm:shadow-sm sm:ring-1 sm:ring-[#e3e7ec]">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl text-black">3. Mode de paiement</h2>
        {confirmed ? <button type="button" onClick={onChange} className="text-sm text-[#0f8f6b] hover:text-[#0877ff]">Modifier</button> : null}
      </div>

      <div className="mt-6 grid gap-3">
        {(!confirmed || method === 'mobile_money') ? (
          <PaymentMethodOption
            value="mobile_money"
            selected={method === 'mobile_money'}
            locked={confirmed}
            title="Mobile Money"
            description="Paiement mobile compatible avec les operateurs actifs par pays."
            badges={['Orange Money', 'Wave', 'Moov Money', 'MTN Mobile Money']}
            onSelect={onMethodChange}
          >
            {method === 'mobile_money' && !confirmed ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr]">
                <select
                  value={mobileMoneyCountryIso2 || destinationCountryIso2}
                  onChange={(event) => onMobileMoneyCountryIso2Change(event.target.value)}
                  className="h-11 border border-[#cfd8e3] bg-white px-3 text-sm outline-none focus:border-[#0f8f6b]"
                >
                  {africanCountries.map((country) => (
                    <option key={country.iso2} value={country.iso2}>{country.name}</option>
                  ))}
                </select>
                <input
                  value={mobileMoneyPhone}
                  onChange={(event) => onMobileMoneyPhoneChange(event.target.value)}
                  placeholder="Numero Mobile Money"
                  className="h-11 border border-[#cfd8e3] bg-white px-4 text-sm outline-none focus:border-[#0f8f6b]"
                />
              </div>
            ) : null}
          </PaymentMethodOption>
        ) : null}

        {(!confirmed || method === 'stripe') ? (
          <PaymentMethodOption
            value="stripe"
            selected={method === 'stripe'}
            locked={confirmed}
            title="Carte et virement securise"
            description="Paiement via Stripe avec carte bancaire et moyens compatibles configures."
            badges={['Visa', 'Mastercard', 'American Express', 'Apple Pay', 'Google Pay', 'Virement bancaire']}
            onSelect={onMethodChange}
          />
        ) : null}

        {(!confirmed || method === 'paypal') ? (
          <PaymentMethodOption
            value="paypal"
            selected={method === 'paypal'}
            locked={confirmed}
            title="PayPal"
            description="Paiement PayPal lorsque le module marchand est active."
            badges={['PayPal']}
            onSelect={onMethodChange}
          />
        ) : null}
      </div>

      {!confirmed ? (
        <button
          type="button"
          disabled={!canContinue}
          onClick={onConfirm}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-sm bg-[#0877ff] px-8 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Continuer
        </button>
      ) : null}
      {mobileMoneyStatus === 'error' && mobileMoneyError ? <p className="mt-3 text-sm font-semibold text-red-700">{mobileMoneyError}</p> : null}
      {method === 'paypal' ? <p className="mt-3 text-xs leading-5 text-amber-700">PayPal doit etre branche cote backend avant activation production.</p> : null}
    </section>
  );
}

function PaymentMethodOption({
  value,
  selected,
  title,
  description,
  badges,
  onSelect,
  locked = false,
  children,
}: {
  value: PaymentMethod;
  selected: boolean;
  title: string;
  description: string;
  badges: string[];
  onSelect: (method: PaymentMethod) => void;
  locked?: boolean;
  children?: ReactNode;
}) {
  return (
    <label className={`block border p-4 transition ${locked ? 'cursor-default' : 'cursor-pointer'} ${selected ? 'border-[#0f8f6b] bg-[#eefbf4]' : 'border-[#dbe4ee] bg-white hover:border-[#0f8f6b]'}`}>
      <div className="flex items-start gap-3">
        <input
          type="radio"
          name="checkout-payment-method"
          checked={selected}
          disabled={locked}
          onChange={() => {
            if (!locked) onSelect(value);
          }}
          className="mt-1 h-4 w-4 accent-[#0f8f6b]"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-black">{title}</p>
          <p className="mt-1 text-sm leading-5 text-[#64748b]">{description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <PaymentBrandBadge key={badge} label={badge} />
            ))}
          </div>
          {children}
        </div>
      </div>
    </label>
  );
}

function PaymentBrandBadge({ label }: { label: string }) {
  const asset = paymentBrandAssets[label];
  if (asset) {
    return (
      <span className="inline-flex min-h-12 min-w-[74px] items-center justify-center border border-[#dbe4ee] bg-white px-3 py-1">
        <img src={asset.src} alt={asset.alt} className={asset.className} loading="lazy" />
      </span>
    );
  }

  return <span className="inline-flex min-h-8 items-center border border-[#dbe4ee] bg-white px-3 text-xs font-semibold text-[#0f172a]">{label}</span>;
}

const paymentBrandAssets: Record<string, { src: string; alt: string; className: string }> = {
  Visa: {
    src: '/payments/visa-brandmark-blue.png',
    alt: 'Visa',
    className: 'h-4 w-auto',
  },
  PayPal: {
    src: '/payments/paypal-logo-black.png',
    alt: 'PayPal',
    className: 'h-5 w-auto',
  },
  Mastercard: {
    src: '/payments/mastercard-mark.svg',
    alt: 'Mastercard',
    className: 'h-7 w-auto',
  },
  'American Express': {
    src: '/payments/amex-mark.svg',
    alt: 'American Express',
    className: 'h-7 w-auto',
  },
  'Apple Pay': {
    src: '/payments/apple-pay-mark.svg',
    alt: 'Apple Pay',
    className: 'h-8 w-auto',
  },
  'Google Pay': {
    src: '/payments/google-pay-mark.svg',
    alt: 'Google Pay',
    className: 'h-7 w-auto',
  },
  'Virement bancaire': {
    src: '/payments/bank-transfer-mark.svg',
    alt: 'Virement bancaire',
    className: 'h-7 w-auto',
  },
  'Orange Money': {
    src: '/payments/orange-money-mark.svg',
    alt: 'Orange Money',
    className: 'h-10 w-auto',
  },
  Wave: {
    src: '/payments/wave-source.png',
    alt: 'Wave',
    className: 'h-10 w-auto rounded-full',
  },
  'Moov Money': {
    src: '/payments/moov-money-source.png',
    alt: 'Moov Money',
    className: 'h-10 w-auto',
  },
  'MTN Mobile Money': {
    src: '/payments/mtn-mobile-money-source.png',
    alt: 'MTN Mobile Money',
    className: 'h-10 w-auto',
  },
};

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
      <h2 className="text-2xl text-black">4. Soumettre ma commande</h2>
      <div className="mt-6 space-y-5 text-sm leading-6 text-[#334155]">
        <p>
          En continuant, votre commande passe vers le moyen de paiement selectionne. Le montant est d'abord autorise, sans capture immediate. Les fichiers et les parametres techniques sont controles avant le lancement de la production.
        </p>
        <p>
          Si les fichiers sont acceptes, le paiement est capture et la production demarre. Si une anomalie bloque le lancement, vous pouvez corriger une fois ou abandonner. Apres un second refus, l'autorisation est annulee automatiquement et le montant est libere.
        </p>
        <input type="hidden" name="submission-mode" value={mode} onChange={() => onModeChange('direct')} />
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

function buildCheckoutAddressFromAccount(payload: unknown, order: CustomerOrderSummary): AccountAddress | null {
  if (!payload || typeof payload !== 'object') return null;
  const account = payload as AccountPayload;
  const fallbackName = splitName(account.fullName ?? '');
  const destination = countryNames[order.destinationCountryIso2] ?? order.destinationCountryIso2;
  return normalizeAddress({
    ...account.shippingAddress,
    firstName: account.shippingAddress?.firstName || fallbackName.firstName,
    lastName: account.shippingAddress?.lastName || fallbackName.lastName,
    company: account.shippingAddress?.company || account.companyName || '',
    phone: account.shippingAddress?.phone || account.phone || '',
    country: account.shippingAddress?.country || account.country || destination,
  });
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

function readCheckoutSavedAddresses(fallbackAddress: AccountAddress): SavedAddress[] {
  if (typeof window === 'undefined') return [];

  try {
    const parsed = JSON.parse(readScopedLocalStorage(savedShippingAddressesKey) ?? '[]') as Array<Partial<SavedAddress>>;
    const addresses = parsed
      .map((item, index) => ({
        ...normalizeAddress(item),
        id: typeof item.id === 'string' ? item.id : `addr-${index}`,
        isDefault: Boolean(item.isDefault) || index === 0,
      }))
      .filter((item) => isCompleteShippingAddress(item));
    if (addresses.length > 0) return addresses.map((item, index) => ({ ...item, isDefault: item.isDefault || index === 0 }));
  } catch {
    // Ignore corrupted local address cache.
  }

  const normalizedFallback = normalizeAddress(fallbackAddress);
  if (!isCompleteShippingAddress(normalizedFallback)) return [];
  return [{ ...normalizedFallback, id: 'default-shipping-address', isDefault: true }];
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
  const baseComplete = Boolean(
    address.firstName.trim() &&
    address.lastName.trim() &&
    address.street.trim() &&
    address.country.trim() &&
    address.city.trim() &&
    address.phone.trim(),
  );
  if (address.accountType === 'company') return Boolean(baseComplete && address.company.trim() && address.postalCode.trim());
  return baseComplete;
}

function addressDisplayName(address: AccountAddress): string {
  const fullName = `${address.firstName} ${address.lastName}`.trim();
  return address.accountType === 'company' && address.company ? `${address.company} - ${fullName}` : fullName;
}

function formatAddressLine(address: AccountAddress): string {
  return [address.street, address.apartment, address.city, address.postalCode, address.country, address.phone].filter(Boolean).join(', ');
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

function buildCheckoutShippingMethods(order: CustomerOrderSummary): CheckoutShippingMethod[] {
  const quote = order.quoteSnapshot;
  const config = quote?.configSnapshot ?? {};
  const currency = order.currency;
  const baseShipping = quote ? lineAmount(quote.breakdown, ['FranceToAfricaDelivery', 'franceToAfricaDelivery']) : 0;
  const liveAmount = numberValue(config.liveShippingAmount) ?? baseShipping;
  const liveCarrier = stringValue(config.liveShippingCarrier) ?? shippingCarrierFromMode(quote?.shippingMode);
  const liveService = stringValue(config.liveShippingService) ?? shippingMethodLabel(quote?.shippingMode);
  const liveTransit = stringValue(config.liveShippingTransitTime) ?? stringValue(config.estimatedShippingTime) ?? '2-4 jours ouvres';
  const selectedMethod: CheckoutShippingMethod = {
    id: 'quote-selected',
    carrier: liveCarrier,
    service: liveService,
    amount: liveAmount,
    currency,
    transitTime: liveTransit,
    deliveryDate: deliveryDateLabel(order, liveTransit),
  };

  const candidates: CheckoutShippingMethod[] = [
    selectedMethod,
    {
      id: 'dhl-express',
      carrier: 'DHL',
      service: 'DHL Express',
      amount: liveAmount || baseShipping,
      currency,
      transitTime: '2-4 jours ouvres',
      deliveryDate: deliveryDateLabel(order, '2-4 jours ouvres'),
    },
    {
      id: 'dhl-dtp',
      carrier: 'DHL',
      service: 'DHL(DTP)',
      amount: liveAmount || baseShipping,
      currency,
      transitTime: '2-4 jours ouvres',
      deliveryDate: deliveryDateLabel(order, '2-4 jours ouvres'),
    },
    {
      id: 'global-standard',
      carrier: 'Global',
      service: 'Livraison standard internationale',
      amount: Math.max(0, Math.round((liveAmount || baseShipping) * 0.72 * 100) / 100),
      currency,
      transitTime: '7-12 jours ouvres',
      deliveryDate: deliveryDateLabel(undefined, '7-12 jours ouvres'),
    },
  ];

  const seen = new Set<string>();
  return candidates.filter((method) => {
    const key = `${method.carrier}-${method.service}-${method.transitTime}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function shippingCarrierFromMode(mode?: string): string {
  if (mode === 'express') return 'DHL';
  if (mode === 'standard') return 'Global';
  if (mode === 'economy') return 'Global';
  return 'Transporteur';
}

function deliveryDateLabel(order: CustomerOrderSummary | undefined, transitTime: string): string {
  if (order?.estimatedDeliveryAt) return `${formatDate(order.estimatedDeliveryAt)} (${transitTime})`;
  const days = maxTransitDays(transitTime);
  if (!days) return transitTime;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${formatDate(date.toISOString())} (${transitTime})`;
}

function maxTransitDays(transitTime: string): number | null {
  const numbers = transitTime.match(/\d+/g)?.map(Number).filter(Number.isFinite) ?? [];
  if (numbers.length === 0) return null;
  return Math.max(...numbers);
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

function paymentButtonLabel(method: PaymentMethod | '', paymentStatus: PaymentStatus, checkoutStatus: CheckoutStatus): string {
  if (method === 'mobile_money') return paymentActionLabel(paymentStatus, 'Autoriser par Mobile Money');
  if (method === 'paypal') return paymentActionLabel(paymentStatus, 'Autoriser avec PayPal');
  return stripeButtonLabel(paymentStatus, checkoutStatus);
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
