'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Card } from '../../components/ui/Card';
import {
  isPublicTrackingStatus,
  publicStatusLabels,
  publicTrackingApiContract,
  publicTrackingStatuses,
} from '../../lib/public-tracking-contract';
import type { PublicTrackingLookupRequest, PublicTrackingStatus, PublicTrackingTimeline } from '../../lib/public-tracking-contract';

type LookupState = 'idle' | 'loading' | 'ready' | 'not_found' | 'invalid_email' | 'error';

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');

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

export default function TrackingPage() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<LookupState>('idle');
  const [timeline, setTimeline] = useState<PublicTrackingTimeline | null>(null);

  async function submitLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('loading');
    setTimeline(null);

    const payload: PublicTrackingLookupRequest = {
      orderId: orderId.trim(),
      email: email.trim(),
    };

    try {
      const response = await fetch(`${apiBaseUrl}${publicTrackingApiContract.lookup.path}`, {
        method: publicTrackingApiContract.lookup.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 404) {
        setState('not_found');
        return;
      }

      if (response.status === 403) {
        setState('invalid_email');
        return;
      }

      if (!response.ok) {
        throw new Error('Tracking lookup failed.');
      }

      setTimeline(await response.json());
      setState('ready');
    } catch {
      setState('error');
    }
  }

  const destination = timeline
    ? countryNames[timeline.destinationCountryIso2] ?? timeline.destinationCountryIso2
    : 'Destination country';

  return (
    <main className="min-h-screen bg-cloud">
      <Navbar />

      <section className="relative overflow-hidden bg-ink pt-32 text-white">
        <img
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2200&q=85"
          alt="Warehouse conveyor with parcels ready for shipment"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.32]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.88] to-deepblue/[0.68]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-20 sm:px-6 lg:grid-cols-[1fr_28rem] lg:px-8">
          <div className="self-end">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-100">Public tracking</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Suivez votre commande Kendronics.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
              Enter the order ID and account email to view customer-safe shipping progress without exposing pricing,
              supplier, or admin data.
            </p>
          </div>

          <Card glass className="self-end p-5 text-ink sm:p-6">
            <form onSubmit={submitLookup} className="space-y-4">
              <TrackingField
                label="ID commande"
                value={orderId}
                placeholder="UUID de commande"
                autoComplete="off"
                onChange={setOrderId}
              />
              <TrackingField
                label="Email"
                value={email}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                onChange={setEmail}
              />
              <button
                type="submit"
                disabled={state === 'loading' || !orderId.trim() || !email.trim()}
                className="h-12 w-full rounded-xl bg-signal px-5 text-sm font-black text-white shadow-lg shadow-sky-950/20 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {state === 'loading' ? 'Verification du suivi...' : 'Suivre la commande'}
              </button>
            </form>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <LookupMessage state={state} />

        {timeline ? (
          <PublicTimeline timeline={timeline} destination={destination} />
        ) : (
          <Card className="p-8 text-center">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-signal">Ready when you are</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Enter your order details to start.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Public tracking only returns logistics milestones, delivery estimates, destination, and carrier details
              when they are available.
            </p>
          </Card>
        )}
      </section>

      <Footer />
    </main>
  );
}

function TrackingField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
      />
    </label>
  );
}

function LookupMessage({ state }: { state: LookupState }) {
  if (state === 'loading') {
    return <Alert tone="info" title="Loading" message="Checking the order and email match..." />;
  }

  if (state === 'not_found') {
    return <Alert tone="error" title="Commande introuvable" message="Aucune commande publique ne correspond a cet ID." />;
  }

  if (state === 'invalid_email') {
    return <Alert tone="error" title="Invalid email" message="That email does not match the order owner." />;
  }

  if (state === 'error') {
    return <Alert tone="error" title="Suivi indisponible" message="Reessayez ou contactez le support si le probleme continue." />;
  }

  return null;
}

function Alert({ tone, title, message }: { tone: 'info' | 'error'; title: string; message: string }) {
  const classes =
    tone === 'info'
      ? 'border-sky-200 bg-sky-50 text-deepblue'
      : 'border-red-200 bg-red-50 text-red-700';

  return (
    <div className={`mb-6 rounded-2xl border p-4 text-sm font-bold ${classes}`}>
      <span className="font-black">{title}:</span> {message}
    </div>
  );
}

function PublicTimeline({ timeline, destination }: { timeline: PublicTrackingTimeline; destination: string }) {
  const currentStatus = timeline.status;
  const events = timeline.events;
  const currentTrackingStatus = isPublicTrackingStatus(currentStatus) ? currentStatus : null;
  const completedStatuses = useMemo(
    () =>
      new Set<PublicTrackingStatus>(
        currentTrackingStatus
          ? publicTrackingStatuses.slice(0, publicTrackingStatuses.indexOf(currentTrackingStatus) + 1)
          : [],
      ),
    [currentTrackingStatus],
  );
  const eventByStatus = new Map(events.map((event) => [event.status, event]));
  const delivery = timeline.status === 'delivered'
    ? 'Livree'
    : timeline.estimatedDeliveryAt
      ? formatDate(timeline.estimatedDeliveryAt)
      : 'Confirmation en attente';

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-line p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Timeline de suivi</p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-ink">{timeline.orderNumber}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Destination {destination} - Transporteur {timeline.carrierName || 'non assigne'} - Suivi {timeline.trackingNumber || 'pas encore disponible'}
            </p>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-3 lg:min-w-[30rem]">
            <MiniMetric label="Statut" value={publicStatusLabels[timeline.status]} />
            <MiniMetric label="Livraison" value={delivery} />
            <MiniMetric label="Pays" value={destination} />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto p-5">
        <div className="grid min-w-[980px] grid-cols-9 gap-3">
          {publicTrackingStatuses.map((status, index) => {
            const event = eventByStatus.get(status);
            const isComplete = completedStatuses.has(status);
            const isCurrent = status === currentTrackingStatus;

            return (
              <div key={status} className="relative">
                {index < publicTrackingStatuses.length - 1 && <div className="absolute left-8 right-[-1rem] top-4 h-px bg-slate-200" />}
                <div
                  className={`relative z-10 grid h-8 w-8 place-items-center rounded-full border text-xs font-black ${
                    isComplete ? 'border-sky-200 bg-sky-50 text-deepblue' : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {isComplete ? index + 1 : ''}
                </div>
                <div className={`mt-3 min-h-44 rounded-sm border p-3 ${isCurrent ? 'border-signal bg-sky-50' : 'border-line bg-white'}`}>
                  <p className="text-sm font-black text-ink">{event?.title ?? publicStatusLabels[status]}</p>
                  {isCurrent ? <span className="mt-2 inline-flex rounded-full bg-deepblue px-2 py-1 text-[10px] font-black text-white">Actuel</span> : null}
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {event?.description ?? defaultTimelineDescription(status)}
                  </p>
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    {event?.occurredAt ? formatDate(event.occurredAt) : isComplete ? 'Termine' : 'En attente'}
                    {event?.location ? ` - ${event.location}` : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {events.length === 0 ? (
          <p className="mt-4 text-sm font-bold text-slate-600">
            Aucun evenement public detaille n est encore publie, mais le statut courant est affiche ci-dessus.
          </p>
        ) : null}
      </div>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-line bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-ink">{value}</p>
    </div>
  );
}

function defaultTimelineDescription(status: PublicTrackingStatus): string {
  const descriptions: Record<PublicTrackingStatus, string> = {
    paid: 'Payment is confirmed and fulfillment can begin.',
    supplier_order_pending: 'Kendronics is preparing the production order.',
    supplier_ordered: 'The production order has been placed with an approved partner.',
    supplier_in_production: 'The boards are being produced. Supplier identifiers remain private.',
    received_at_france_hub: 'The shipment has reached the France coordination hub.',
    shipped_to_africa: 'The order has left the France hub for the destination region.',
    customs_processing: 'The shipment is being processed by customs.',
    out_for_delivery: 'The package is with the local delivery partner.',
    delivered: 'The order has been delivered.',
  };

  return descriptions[status];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}
