'use client';

import { useMemo, useState } from 'react';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';

type OrderSectionId =
  | 'review'
  | 'payment-pending'
  | 'payment-unfinished'
  | 'production'
  | 'shipping'
  | 'completed'
  | 'comments'
  | 'refunds'
  | 'wishlist';

type OrderSection = {
  id: OrderSectionId;
  label: string;
  shortLabel: string;
  count: number;
  icon: string;
  panelTitle: string;
  panelIcon: string;
  variant: 'review' | 'table';
};

const orderSections: OrderSection[] = [
  {
    id: 'review',
    label: 'Verification en cours',
    shortLabel: 'Verification en cours',
    count: 0,
    icon: '▧',
    panelTitle: 'Panier / Examen de votre commande',
    panelIcon: '✓',
    variant: 'review',
  },
  {
    id: 'payment-pending',
    label: 'Paiement en attente',
    shortLabel: 'Paiement en attente',
    count: 0,
    icon: '▭',
    panelTitle: 'Panier / Examen de votre commande',
    panelIcon: '✓',
    variant: 'review',
  },
  {
    id: 'payment-unfinished',
    label: 'Paiement inachevé',
    shortLabel: 'Paiement inachevé',
    count: 0,
    icon: '▧',
    panelTitle: 'Paiement inachevé',
    panelIcon: '$',
    variant: 'table',
  },
  {
    id: 'production',
    label: 'Statut de production',
    shortLabel: 'Statut de production',
    count: 0,
    icon: '⚙',
    panelTitle: 'Progrès de la Fabrication',
    panelIcon: '⚙',
    variant: 'table',
  },
  {
    id: 'shipping',
    label: 'Livraison',
    shortLabel: 'Livraison',
    count: 0,
    icon: '♞',
    panelTitle: 'Livraison / Suivi de votre envoi',
    panelIcon: '⚙',
    variant: 'table',
  },
  {
    id: 'completed',
    label: 'Terminé',
    shortLabel: 'Terminé',
    count: 0,
    icon: '✓',
    panelTitle: 'Commande complétée',
    panelIcon: '⚙',
    variant: 'table',
  },
  {
    id: 'comments',
    label: 'Gérer les commentaires',
    shortLabel: 'Commentaires en attente',
    count: 0,
    icon: '☆',
    panelTitle: 'Commentaires en attente',
    panelIcon: '✓',
    variant: 'table',
  },
  {
    id: 'refunds',
    label: 'Remboursements&Litiges',
    shortLabel: 'Remboursements',
    count: 0,
    icon: '□',
    panelTitle: 'Remboursements & Litiges',
    panelIcon: '✓',
    variant: 'table',
  },
  {
    id: 'wishlist',
    label: 'Liste des souhaits',
    shortLabel: 'Liste des souhaits',
    count: 0,
    icon: '♡',
    panelTitle: 'Liste des souhaits',
    panelIcon: '✓',
    variant: 'table',
  },
];

const topStatuses = [
  { id: 'all', label: 'Toutes commandes', count: 0, icon: '' },
  { id: 'review', label: 'Vérification en cours', count: 0, icon: '' },
  { id: 'payment-pending', label: 'Paiement en attente', count: 0, icon: '' },
  { id: 'payment-unfinished', label: 'Paiement inachevé', count: 0, icon: '' },
  { id: 'production', label: 'Statut de production', count: 0, icon: '' },
  { id: 'engineering', label: "Questions d'ingénierie", count: 0, icon: '▣' },
  { id: 'shipping', label: 'Livraison', count: 0, icon: '' },
  { id: 'comments', label: 'Commentaires en attente', count: 0, icon: '' },
] satisfies Array<{ id: OrderSectionId | 'all' | 'engineering'; label: string; count: number; icon: string }>;

const promotionItems = ['Centre de Message', 'Notifications', 'Boutique cadeaux', 'Mes coupons', 'Récompenses de PCBWay'];

const topStatusToSection: Partial<Record<(typeof topStatuses)[number]['id'], OrderSectionId>> = {
  review: 'review',
  'payment-pending': 'payment-pending',
  'payment-unfinished': 'payment-unfinished',
  production: 'production',
  shipping: 'shipping',
  comments: 'comments',
};

export default function ProfilePage() {
  const [activeSectionId, setActiveSectionId] = useState<OrderSectionId>('review');
  const activeSection = useMemo(
    () => orderSections.find((section) => section.id === activeSectionId) ?? orderSections[0],
    [activeSectionId],
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef0f3] text-[#111827]">
      <Navbar />
      <div className="w-full pt-[70px]">
        <div className="mx-auto grid min-w-[1328px] max-w-[1368px] grid-cols-[234px_minmax(0,1fr)] gap-4 bg-[#eef0f3] pr-0">
          <ProfileSidebar activeSectionId={activeSectionId} onSelect={setActiveSectionId} />
          <section className="min-h-[720px] bg-white">
            <OrdersHeader activeSectionId={activeSectionId} onSelect={setActiveSectionId} />
            <OrderSectionPanel section={activeSection} />
          </section>
        </div>
        <Footer forceDesktop />
      </div>
    </main>
  );
}

function ProfileSidebar({
  activeSectionId,
  onSelect,
}: {
  activeSectionId: OrderSectionId;
  onSelect: (sectionId: OrderSectionId) => void;
}) {
  return (
    <aside className="sticky top-[70px] block h-[calc(100vh-70px)] self-start overflow-y-auto border-r border-[#e5e7eb] bg-white">
      <section className="border-b border-[#e5e7eb] px-0 pb-4 pt-6">
        <h2 className="px-[18px] text-xs font-black uppercase text-[#1f2937]">Commandes</h2>
        <div className="mt-3 grid gap-0">
          {orderSections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(section.id)}
              className={`relative flex min-h-[32px] items-center gap-2 px-[18px] py-2 text-left text-[13px] transition ${
                activeSectionId === section.id ? 'font-black text-[#009a38]' : 'font-normal text-[#111827] hover:text-[#009a38]'
              }`}
            >
              <span className={`grid h-4 w-4 shrink-0 place-items-center text-[15px] ${activeSectionId === section.id ? 'text-[#24ad5d]' : 'text-[#6b7280]'}`}>
                {section.icon}
              </span>
              <span className="min-w-0 truncate">
                {section.label}
                {section.id === 'comments' ? null : `(${section.count})`}
              </span>
              {activeSectionId === section.id ? <span className="absolute right-0 top-0 h-full w-[5px] bg-[#27a35a]" /> : null}
            </button>
          ))}
        </div>
      </section>
      <section className="px-0 pb-6 pt-7">
        <h2 className="px-[18px] text-xs font-black uppercase text-[#1f2937]">Promotions</h2>
        <div className="mt-3 grid">
          {promotionItems.map((item, index) => (
            <a key={item} href="#" className="flex min-h-[32px] items-center gap-2 px-[18px] py-2 text-[13px] text-[#111827] transition hover:text-[#009a38]">
              <span className="grid h-4 w-4 place-items-center text-[15px] text-[#6b7280]">{['▱', '▢', '▦', '▭', '◎'][index]}</span>
              <span className="truncate">{item}</span>
            </a>
          ))}
        </div>
      </section>
    </aside>
  );
}

function OrdersHeader({
  activeSectionId,
  onSelect,
}: {
  activeSectionId: OrderSectionId;
  onSelect: (sectionId: OrderSectionId) => void;
}) {
  return (
    <header className="border-b-[14px] border-[#eef0f3] bg-white px-5 pt-4">
      <div className="flex h-11 items-center gap-3 border-b border-[#e5e7eb]">
        <span className="grid h-6 w-6 place-items-center text-xl text-[#b8b8b8]">▤</span>
        <h1 className="text-xl font-normal text-[#111827]">Mes commandes</h1>
      </div>
      <nav className="grid h-[110px] grid-cols-8 items-start px-1 pt-5">
        {topStatuses.map((status) => {
          const targetSection = topStatusToSection[status.id];
          const isActive = targetSection === activeSectionId;
          return (
            <button
              key={status.id}
              type="button"
              disabled={!targetSection}
              onClick={() => targetSection && onSelect(targetSection)}
              className={`grid min-h-[72px] place-items-center border-r border-[#e5e7eb] px-3 text-center last:border-r-0 ${
                targetSection ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <span className={`text-[28px] font-black leading-7 ${isActive ? 'text-[#ff5a00]' : 'text-[#1f2937]'}`}>
                {status.count}
                {status.icon ? <span className="ml-1 align-middle text-[20px] text-[#20b99a]">{status.icon}</span> : null}
              </span>
              <span className={`mt-1 text-[14px] leading-4 ${isActive ? 'text-[#ff5a00]' : 'text-[#8a8f98]'}`}>{status.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}

function OrderSectionPanel({ section }: { section: OrderSection }) {
  return (
    <section className="bg-white px-5 pb-24 pt-5">
      <div className="flex h-12 items-center gap-2 border-b border-[#e5e7eb]">
        <span className="grid h-[22px] w-[22px] place-items-center bg-[#61bd00] text-[18px] font-black leading-none text-white">{section.panelIcon}</span>
        <h2 className="text-xl font-normal text-black">{section.panelTitle}</h2>
      </div>
      {section.variant === 'review' ? <ReviewPanel /> : <TableStatusPanel />}
    </section>
  );
}

function ReviewPanel() {
  return (
    <>
      <div className="flex items-center justify-between py-8 text-xs text-[#8a8f98]">
        <a href="#" className="text-sm text-[#8a8f98] hover:text-[#009a38]">&lt; Ajouter un nouvel article</a>
        <p>Fuseau horaire de Chine (GMT+8):&nbsp; 11/05/2026 21:11:33(Mise à jour dans 5 mins)</p>
      </div>
      <SearchBox compact />
      <EmptyState className="pt-14" />
    </>
  );
}

function TableStatusPanel() {
  return (
    <>
      <SearchBox />
      <div className="mt-3 grid h-9 grid-cols-[2fr_1.35fr_1.15fr_1.25fr] items-center bg-[#f0f0f0] px-3 text-center text-xs text-black">
        <span>Produit</span>
        <span>Action du Produit</span>
        <span>Status de la commande</span>
        <span>Action de la commande</span>
      </div>
      <EmptyState className="pt-16" />
      <div className="mt-20 h-10 bg-[#f5f5f5]" />
    </>
  );
}

function SearchBox({ compact = false }: { compact?: boolean }) {
  return (
    <form className={`border border-[#e1e1e1] bg-white px-4 ${compact ? 'py-3' : 'py-4'}`}>
      <div className={`flex items-center gap-4 text-[13px] text-black ${compact ? '' : 'flex-wrap'}`}>
        <label className="flex items-center gap-2">
          <span>{compact ? 'Numéro de produit:' : 'ID Commande:'}</span>
          <input className="h-6 w-[142px] border border-[#cfcfcf] bg-white px-2 outline-none focus:border-[#ff8a00]" />
        </label>
        <label className="flex items-center gap-2">
          <span>Nom du fichier PCB:</span>
          <input className="h-6 w-[142px] border border-[#cfcfcf] bg-white px-2 outline-none focus:border-[#ff8a00]" />
        </label>
        <label className="flex items-center gap-2">
          <span>Numéros de PO:</span>
          <input className="h-6 w-[142px] border border-[#cfcfcf] bg-white px-2 outline-none focus:border-[#ff8a00]" />
        </label>
        <button type="submit" className="ml-1 h-[27px] min-w-[108px] bg-[#ff8a13] px-5 text-sm font-black text-white ring-1 ring-[#f07800] transition hover:bg-[#f07800]">
          Recherche
        </button>
      </div>
    </form>
  );
}

function EmptyState({ className = '' }: { className?: string }) {
  return (
    <p className={`text-center text-base font-black text-[#92979d] ${className}`}>
      Votre recherche ne correspond à aucune liste.
    </p>
  );
}
