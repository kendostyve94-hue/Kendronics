'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Card } from '../../components/ui/Card';
import { getApiBaseUrl } from '../../lib/api-base-url';
import { readFreshAuthSession } from '../../lib/auth-session';
import { statusLabels } from '../../lib/order-detail-contract';
import type { CustomerOrderSummary } from '../../lib/order-detail-contract';

const apiBaseUrl = getApiBaseUrl();
const customerOrdersStorageKey = 'kendronics.customer.orders';

type PageState = 'loading' | 'ready' | 'guest' | 'error';

export default function OrdersPage() {
  const [state, setState] = useState<PageState>('loading');
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      setState('loading');
      setMessage('');

      try {
        const session = await readFreshAuthSession();
        if (!session) {
          setOrders([]);
          setState('guest');
          return;
        }

        const response = await fetch(`${apiBaseUrl}/api/orders`, {
          headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
          cache: 'no-store',
        });

        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(Array.isArray(error?.message) ? error.message.join(' ') : error?.message ?? 'Impossible de charger le panier.');
        }

        const payload = (await response.json()) as CustomerOrderSummary[];
        if (cancelled) return;

        setOrders(payload);
        rememberOrders(payload.map((order) => order.id));
        setState('ready');
      } catch (error) {
        if (cancelled) return;
        setMessage(error instanceof Error ? error.message : 'Impossible de charger le panier.');
        setState('error');
      }
    }

    void loadOrders();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    return orders.reduce(
      (acc, order) => ({
        count: acc.count + 1,
        amount: acc.amount + Number(order.totalPrice ?? order.quoteSnapshot?.finalTotal ?? 0),
      }),
      { count: 0, amount: 0 },
    );
  }, [orders]);

  return (
    <main className="min-h-screen bg-cloud">
      <Navbar />
      <section className="border-b border-line bg-white pt-28">
        <div className="mx-auto max-w-[1180px] px-4 pb-6 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Panier</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">Mes commandes</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Retrouvez les commandes creees depuis vos devis sauvegardes avec votre compte connecte.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-8">
        <div className="space-y-4">
          {state === 'loading' ? <StateCard title="Chargement du panier..." body="Recherche des commandes liees a votre compte." /> : null}
          {state === 'guest' ? (
            <StateCard title="Connectez-vous pour voir le panier" body="Les commandes sont rattachees au compte client afin de proteger les devis, paiements et fichiers associes.">
              <a href="/login" className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#0f8f6b] px-5 text-sm font-black text-white">
                Connexion
              </a>
            </StateCard>
          ) : null}
          {state === 'error' ? <StateCard title="Panier indisponible" body={message} tone="error" /> : null}
          {state === 'ready' && orders.length === 0 ? (
            <StateCard title="Votre panier est vide" body="Creez un devis avec vos fichiers Gerber pour ouvrir une commande.">
              <a href="/quote" className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#0877ff] px-5 text-sm font-black text-white">
                Demander un devis
              </a>
            </StateCard>
          ) : null}
          {orders.map((order) => (
            <a
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-sm border border-line bg-white p-4 shadow-sm transition hover:border-[#0f8f6b] hover:shadow-md"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{order.orderNumber}</p>
                  <h2 className="mt-1 text-xl font-black text-ink">{productLabel(order.quoteSnapshot?.productType ?? 'PCB')}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {order.quoteSnapshot ? `${order.quoteSnapshot.lengthMm} x ${order.quoteSnapshot.widthMm} mm - ${order.quoteSnapshot.quantity} pieces` : 'Devis rattache a la commande'}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-lg font-black text-[#ff7a00]">{formatMoney(order.totalPrice ?? order.quoteSnapshot?.finalTotal ?? 0, order.currency ?? 'EUR')}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#0f8f6b]">{statusLabels[order.status]}</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        <Card className="h-fit p-5 lg:sticky lg:top-24">
          <h2 className="text-lg font-black text-ink">Resume panier</h2>
          <div className="mt-4 space-y-3 text-sm">
            <SummaryLine label="Commandes" value={`${totals.count}`} />
            <SummaryLine label="Total" value={formatMoney(totals.amount, 'EUR')} />
          </div>
          <a href="/quote" className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-deepblue px-5 text-sm font-black text-white">
            Nouveau devis
          </a>
        </Card>
      </section>
    </main>
  );
}

function StateCard({ title, body, tone = 'default', children }: { title: string; body: string; tone?: 'default' | 'error'; children?: ReactNode }) {
  return (
    <div className={`rounded-sm border p-5 shadow-sm ${tone === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-line bg-white text-slate-700'}`}>
      <h2 className="text-xl font-black text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6">{body}</p>
      {children}
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-600">{label}</span>
      <span className="font-black text-ink">{value}</span>
    </div>
  );
}

function rememberOrders(orderIds: string[]) {
  window.localStorage.setItem(customerOrdersStorageKey, JSON.stringify(orderIds.slice(0, 20)));
  window.dispatchEvent(new Event('kendronics:orders-updated'));
}

function productLabel(value: string): string {
  return {
    standard_pcb: 'PCB standard',
    advanced_pcb: 'PCB avance',
    pcb_assembly: 'Assemblage PCB',
    smt_stencil: 'Stencil SMT',
  }[value] ?? value;
}

function formatMoney(amount: number, currency: CustomerOrderSummary['currency']): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
}
