'use client';

import { useEffect, useState } from 'react';
import { Footer } from '../../components/layout/Footer';
import { clearAuthSession, readAuthSession } from '../../lib/auth-session';

const profileStorageKey = 'kendronics.customer.profile';
const avatarStorageKey = 'kendronics.customer.avatar';

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  country: string;
};

type QuickProduct = {
  title: string;
  subtitle: string;
  href: string;
  image: string;
  color: string;
};

const quickProducts: QuickProduct[] = [
  { title: 'Prototype PCB', subtitle: 'Commander maintenant', href: '/quote', image: '/images/quote-product-standard-pcb.png', color: '#22c55e' },
  { title: 'FPC/Rigid-Flex', subtitle: 'Commander maintenant', href: '/quote', image: '/images/quote-product-fpc-rigid-flex.png', color: '#ff7a1a' },
  { title: 'Assemblage PCB', subtitle: 'Commander maintenant', href: '/quote', image: '/images/quote-product-assembly.png', color: '#3b82f6' },
  { title: 'SMD-Stencil', subtitle: 'Commander maintenant', href: '/quote', image: '/images/quote-product-smd-stencil.png', color: '#a855f7' },
  { title: 'CNC | Impression 3D', subtitle: 'Commander maintenant', href: '/services', image: '', color: '#06b6d4' },
  { title: 'Conception PCB', subtitle: 'Commander maintenant', href: '/services', image: '', color: '#facc15' },
];

const sidebarGroups = [
  {
    title: 'Commandes',
    items: ['Verification en cours (2)', 'Paiement en attente (1)', 'Paiement inacheve (0)', 'Statut de production (3)', 'Livraison (1)', 'Termine (8)', 'Gerer les commentaires', 'Remboursements & Litiges (0)', 'Liste des souhaits (3)'],
  },
  {
    title: 'Services',
    items: ['Prototype PCB', 'Petites series', 'PCB avance', 'Assemblage PCB', 'CNC | Impression 3D', 'Conception PCB', 'Assistance Gerber'],
  },
  {
    title: 'Promotions',
    items: ['Centre de Message', 'Notifications', 'Boutique cadeaux', 'Mes coupons', 'Recompenses de Kendronics', 'Connexion', 'Inviter', 'Projets partages'],
  },
  {
    title: 'Mon profil',
    items: ['Adresse de livraison', 'Parametres', 'Compte de collecte', 'Informations de facturation', 'Solde du compte', 'Reclamations des employes'],
  },
];

const orderRows = [
  ['KD-250516-001', 'PCB Prototype', '2025-05-16', '5 pcs', 'Verification', '$23.50'],
  ['KD-250515-008', 'PCB Assembly', '2025-05-15', '10 pcs', 'Production', '$129.00'],
  ['KD-250514-002', 'FPC Flexible PCB', '2025-05-14', '5 pcs', 'Production', '$85.40'],
  ['KD-250513-011', 'PCB Prototype', '2025-05-13', '5 pcs', 'Livraison', '$23.50'],
  ['KD-250511-007', 'CNC Machining', '2025-05-11', '1 pcs', 'Termine', '$56.00'],
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileForm>({ name: '', email: '', phone: '', company: '', country: '' });
  const [accountId, setAccountId] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState('');

  useEffect(() => {
    const storedProfile = readStoredProfile();
    const sessionProfile = readSessionProfile();

    setProfile({
      name: storedProfile.name || emailName(sessionProfile.email) || '',
      email: sessionProfile.email || storedProfile.email || '',
      phone: storedProfile.phone || '',
      company: storedProfile.company || '',
      country: storedProfile.country || '',
    });
    setAccountId(sessionProfile.id || storedProfile.email || sessionProfile.email || 'kendronics');
    setAvatarDataUrl(window.localStorage.getItem(avatarStorageKey) ?? '');
  }, []);

  const firstName = firstNameOf(profile.name || emailName(profile.email) || 'Rafale');
  const userId = formatUserId(accountId);
  return (
    <main className="min-h-screen overflow-x-auto bg-[#f3f6fa] text-[#1f2f43]">
      <ProfileNavbar firstName={firstName} avatarDataUrl={avatarDataUrl} />
      <div className="w-full">
        <div className="mx-auto grid min-w-[1328px] max-w-[1368px] grid-cols-[250px_minmax(0,1fr)] gap-4 px-5 py-4">
          <ProfileSidebar />

          <section className="min-w-0">
            <ProductQuickGrid />

            <div className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)_330px] gap-4">
              <div className="min-w-0">
                <DashboardPanel firstName={firstName} userId={userId} avatarDataUrl={avatarDataUrl} />
                <ReferralBanner />
                <StatusStrip />
                <OrdersTable />
                <GiftExchange />
                <ReviewsPanel />
              </div>

              <RightRail />
            </div>
          </section>
        </div>

        <Footer forceDesktop />
      </div>
    </main>
  );
}

function ProfileNavbar({ firstName, avatarDataUrl }: { firstName: string; avatarDataUrl: string }) {
  return (
    <header className="sticky top-0 z-40 min-w-[1328px] border-b border-[#d7d7d7] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.16)]">
      <div className="mx-auto flex h-[70px] max-w-[1368px] items-center gap-3 px-5">
        <a href="/" className="shrink-0 lg:mr-3" aria-label="Kendronics accueil">
          <img src="/images/kendronics-logo.png" alt="Kendronics" className="h-12 w-auto" />
        </a>
        <nav className="flex min-w-0 flex-1 snap-x items-center justify-between gap-2 text-[15px] text-[#111827]">
          <ProfileNavLink href="/profile" label="Mon compte" />
          <ProfileNavLink href="/quote" label="Devis immediat" />
          <ProfileNavLink href="/quote" label="Assemblage PCB" />
          <ProfileNavLink href="/services" label="Impression 3D" />
          <ProfileNavLink href="/services" label="Conception PCB" />
          <ProfileNavLink href="/orders" label="Mes commandes" />
          <ProfileNavLink href="/profile" label="Parametres" />
        </nav>
        <a href="/cart" className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center text-[#0f8f6b] transition hover:text-[#0b7558]" aria-label="Panier">
          <CartIcon />
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#14c469] px-1 text-[11px] font-black leading-none text-white">0</span>
        </a>
        <a href="/profile" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-[#d1d5db] bg-[#f4f4f4]">
            {avatarDataUrl ? <img src={avatarDataUrl} alt="Avatar client" className="h-full w-full object-cover" /> : null}
          </span>
          <span className="text-xs leading-5 text-[#64748b]">
            Bonjour, {firstName}
            <strong className="block text-sm font-black text-[#00a651]">Mon Kendronics</strong>
          </span>
        </a>
      </div>
    </header>
  );
}

function ProfileNavLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="grid min-h-[54px] min-w-[92px] snap-start place-items-center px-2 text-center leading-6 hover:text-[#00a651]">
      {label}
    </a>
  );
}

function ProfileSidebar() {
  return (
    <aside className="sticky top-[86px] block self-start bg-white shadow-sm ring-1 ring-slate-200">
      {sidebarGroups.map((group) => (
        <section key={group.title} className="border-b border-slate-200 last:border-b-0">
          <h2 className="px-4 pb-2 pt-5 text-[12px] font-black uppercase text-[#1f2f43]">{group.title}</h2>
          <div className="block px-0 pb-4">
            {group.items.map((item, index) => (
              <a key={item} href="#" className="flex min-h-[34px] items-center gap-3 rounded-none bg-transparent px-4 text-[13px] text-[#475569] hover:bg-[#f1f8f4] hover:text-[#0f9f6e]">
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded border border-slate-300 text-[9px] text-slate-400">{index + 1}</span>
                <span className="min-w-0 truncate">{item}</span>
                {index === 0 && group.title === 'Promotions' ? <span className="ml-auto rounded bg-red-500 px-1.5 text-[10px] font-black text-white">2</span> : null}
              </a>
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
}

function ProductQuickGrid() {
  return (
    <div className="grid grid-cols-6 gap-4">
      {quickProducts.map((product) => (
        <a key={product.title} href={product.href} className="grid min-h-[180px] content-between bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="grid gap-2">
            <h3 className="text-[15px] font-black leading-5 text-[#111827]">{product.title}</h3>
            {product.image ? (
              <img src={product.image} alt="" className="mx-auto h-20 w-24 object-contain" />
            ) : (
              <span className="mx-auto grid h-20 w-24 place-items-center rounded-full" style={{ backgroundColor: `${product.color}22` }}>
                <span className="h-10 w-10 rounded-full" style={{ border: `4px solid ${product.color}` }} />
              </span>
            )}
          </div>
          <p className="text-xs leading-5 text-[#64748b]">{product.subtitle} &gt;</p>
        </a>
      ))}
    </div>
  );
}

function DashboardPanel({ firstName, userId, avatarDataUrl }: { firstName: string; userId: string; avatarDataUrl: string }) {
  return (
    <section className="grid grid-cols-[170px_minmax(0,1fr)] bg-white shadow-sm ring-1 ring-slate-200">
      <div className="grid place-items-center border-r border-slate-200 px-4 py-8 text-center">
        <Avatar avatarDataUrl={avatarDataUrl} size="medium" />
        <div>
          <h1 className="mt-4 text-lg font-black text-[#475569]">{firstName}</h1>
          <p className="mt-2 text-xs text-slate-500">ID Client: {userId}</p>
          <a href="#" className="mt-4 inline-flex text-xs font-semibold text-blue-600">Ma communaute</a>
        </div>
      </div>

      <div className="p-4">
        <h2 className="text-sm font-black text-[#1f2f43]">Tableau de bord</h2>
        <div className="mt-4 grid grid-cols-[1fr_180px] gap-4">
          <div className="grid grid-cols-2 border border-slate-200">
            <MetricCell label="Solde (USD)" value="$ 0.00" detail="(Non Retirable: $0.00)" />
            <MetricCell label="Recemment ajoute" value="+0.00" valueClass="text-[#ff5a00]" />
            <MetricCell label="Commission pour les circuits imprimes (PCBs) partages" value="$0.00" detail="(+0.00)" />
            <MetricCell label="Total des remises" value="$0.00" detail="(+0.00)" />
          </div>
          <div className="grid gap-2">
            <SmallInfo label="Mes coupons" value="5" />
            <SmallInfo label="Mes Points" value="320" action="Echanger" />
            <SmallInfo label="Messages non lus" value="2" danger />
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCell({ label, value, detail, valueClass = 'text-[#1f2937]' }: { label: string; value: string; detail?: string; valueClass?: string }) {
  return (
    <div className="min-h-[84px] border-b border-r border-slate-200 p-4 last:border-r-0">
      <p className="text-xs text-[#64748b]">{label}</p>
      <p className={`mt-2 text-2xl font-black ${valueClass}`}>{value}</p>
      {detail ? <p className="mt-1 text-xs text-[#475569]">{detail}</p> : null}
    </div>
  );
}

function SmallInfo({ label, value, action, danger }: { label: string; value: string; action?: string; danger?: boolean }) {
  return (
    <div className="flex min-h-[48px] items-center justify-between bg-[#f8fafc] px-4 text-xs text-[#475569]">
      <span>{label}</span>
      <span className={danger ? 'rounded bg-red-500 px-1.5 py-0.5 font-black text-white' : 'font-black text-[#ff5a00]'}>{value}</span>
      {action ? <a href="#" className="text-[#475569]">{action}</a> : null}
    </div>
  );
}

function ReferralBanner() {
  return (
    <section className="mt-4 flex h-[74px] min-h-[68px] items-center justify-between gap-3 bg-gradient-to-r from-[#ff6233] via-[#ff8a18] to-[#ffb000] px-5 py-0 text-white">
      <div>
        <p className="text-2xl font-black italic leading-none">Looking For New Referral Opportunities?</p>
        <p className="mt-2 text-xs">Refer others and explore the benefits of sharing our services.</p>
      </div>
      <a href="#" className="shrink-0 rounded-full bg-white px-6 py-3 text-xs font-black text-[#ff5a00]">Sign Up Now</a>
    </section>
  );
}

function StatusStrip() {
  const statuses = [
    ['2', 'Verification en cours'],
    ['1', 'Paiement en attente'],
    ['3', 'Statut de production'],
    ['0', "Questions d'ingenierie"],
    ['1', 'Livraison'],
    ['2', 'Commentaires en attente'],
  ];

  return (
    <section className="mt-4 grid grid-cols-6 bg-white py-5 shadow-sm ring-1 ring-slate-200">
      {statuses.map(([value, label]) => (
        <div key={label} className="border-r border-slate-200 px-3 text-center last:border-r-0">
          <p className="text-3xl font-light text-[#111827]">{value}</p>
          <p className="mt-2 text-xs leading-4 text-[#475569]">{label}</p>
        </div>
      ))}
    </section>
  );
}

function OrdersTable() {
  return (
    <section className="mt-4 bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-[#1f2937]">Ma commande</h2>
        <a href="/orders" className="text-xs font-semibold text-blue-600">Plus &gt;</a>
      </div>
      <div className="mt-4 flex gap-8 border-b border-slate-200 text-xs">
        {['Toutes (8)', 'Verification (2)', 'Production (3)', 'Livraison (1)', 'Termine (8)'].map((tab, index) => (
          <span key={tab} className={`pb-3 ${index === 0 ? 'border-b-2 border-blue-500 font-black text-blue-600' : 'text-slate-500'}`}>{tab}</span>
        ))}
      </div>
      <table className="mt-2 w-full text-left text-xs">
        <thead className="text-[#64748b]">
          <tr>
            {['N Commande', 'Produit', 'Date de commande', 'Quantite', 'Statut', 'Montant', 'Action'].map((head) => (
              <th key={head} className="py-3 font-black">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orderRows.map((row) => (
            <tr key={row[0]} className="border-t border-slate-100">
              {row.map((cell, index) => (
                <td key={`${row[0]}-${cell}`} className={`py-3 ${index === 4 ? statusColor(cell) : ''}`}>{cell}</td>
              ))}
              <td className="py-3"><a href="/orders" className="rounded-full border border-blue-400 px-3 py-1 text-blue-600">Voir</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function GiftExchange() {
  const gifts = ['Points: 2800', 'Points: 3200', 'Points: 1800', 'Points: 900', 'Points: 1200'];

  return (
    <section className="mt-4 bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">Echanger des cadeaux</h2>
        <a href="#" className="text-xs font-semibold text-blue-600">Afficher plus &gt;</a>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-4">
        {gifts.map((gift, index) => (
          <div key={gift} className="text-center">
            <div className="mx-auto h-16 w-24 rounded bg-gradient-to-br from-[#0f9f6e] to-[#07182c]" />
            <p className="mt-2 text-xs text-[#475569]">{gift}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewsPanel() {
  return (
    <section className="mt-4 bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex gap-8 text-sm font-black">
          <span className="border-b-2 border-[#22c55e] pb-2 text-[#16a34a]">Show client</span>
          <span>Programme Partenaire</span>
        </div>
        <a href="#" className="rounded bg-[#0f9f6e] px-5 py-2 text-xs font-black text-white">Laisser un commentaire</a>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-4">
        {['Engineer', 'Kain', 'COSTA'].map((name) => (
          <article key={name} className="min-h-[150px] rounded bg-[#f8fafc] p-4">
            <p className="text-xs font-black">{name}</p>
            <p className="mt-2 text-[#0f9f6e]">★★★★★</p>
            <p className="mt-3 text-xs leading-5 text-[#475569]">Tres bon suivi, devis clair et progression de commande facile a comprendre.</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RightRail() {
  return (
    <aside className="grid content-start gap-4">
      <PromoBanner title="PCB Assembly for 1-20 pcs" price="$29" dark />
      <PromoBanner title="PCB Prototype Only" price="$5" />
      <InfoList title="Dernieres nouvelles" items={['Mise a jour des options expedition', 'Impact du nouveau tarif douanier', 'Bonne fete du travail !']} />
      <InfoList title="Projets partages" items={['Carte mere industrielle v2.1', 'Alimentation 24V - 10A', 'Controleur moteur BLDC']} action="Partager" />
      <InfoList title="Nouvelles questions" items={["Comment modifier l'epaisseur du cuivre ?", "Quelle finition de surface pour l'ENIG ?", 'Quels fichiers Gerber sont necessaires ?']} action="Theme" />
      <InfoList title="Nouvelles solutions" items={['How to generate Gerber files from Eagle', 'How to Use Payoneer to Pay for Orders', 'How to Place an OEM Order?', 'Payoneer Payment Instructions']} numbered />
    </aside>
  );
}

function PromoBanner({ title, price, dark }: { title: string; price: string; dark?: boolean }) {
  return (
    <article className={`${dark ? 'bg-[#07184a] text-white' : 'bg-white text-[#1f2937]'} min-h-[112px] overflow-hidden p-4 shadow-sm ring-1 ring-slate-200`}>
      <p className="text-lg font-black">{title}</p>
      <p className="mt-2 text-sm">ONLY <span className="text-3xl font-black text-[#ff9f00]">{price}</span> IN TOTAL</p>
      <div className="mt-3 h-8 rounded bg-gradient-to-r from-[#0fe36f] to-[#03b7e8]" />
    </article>
  );
}

function InfoList({ title, items, action, numbered }: { title: string; items: string[]; action?: string; numbered?: boolean }) {
  return (
    <section className="bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black">{title}</h2>
        <a href="#" className="text-xs text-blue-600">Plus</a>
      </div>
      <ul className="mt-4 grid gap-3 text-xs text-[#475569]">
        {items.map((item, index) => (
          <li key={item} className="flex gap-2">
            <span className="shrink-0 text-slate-400">{numbered ? index + 1 : action || '-'}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Avatar({ avatarDataUrl, size }: { avatarDataUrl: string; size: 'medium' | 'large' }) {
  const className = size === 'large' ? 'h-16 w-16 border-2 border-[#d89b2b]' : 'h-20 w-20 border border-slate-200';

  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-slate-200 ${className}`}>
      {avatarDataUrl ? <img src={avatarDataUrl} alt="Avatar client" className="h-full w-full object-cover" /> : <span className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-400" />}
    </span>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M3 4h2l2.3 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6.2" />
    </svg>
  );
}

function statusColor(status: string) {
  if (status === 'Verification') return 'text-[#0f9f6e]';
  if (status === 'Production') return 'text-[#16a34a]';
  if (status === 'Livraison') return 'text-[#ff7a1a]';
  return 'text-[#f59e0b]';
}

function readStoredProfile(): Partial<ProfileForm> {
  try {
    return JSON.parse(window.localStorage.getItem(profileStorageKey) ?? '{}') as Partial<ProfileForm>;
  } catch {
    return {};
  }
}

function readSessionProfile(): { id: string; email: string } {
  const session = readAuthSession();
  if (!session?.accessToken) return { id: '', email: '' };

  try {
    const payload = JSON.parse(window.atob(session.accessToken.split('.')[1] ?? '')) as { sub?: string; email?: string };
    return { id: payload.sub ?? '', email: payload.email ?? '' };
  } catch {
    return { id: '', email: '' };
  }
}

function emailName(email: string) {
  return email.includes('@') ? email.split('@')[0] : '';
}

function firstNameOf(value: string) {
  return value.trim().split(/[\s._-]+/).filter(Boolean)[0] || 'Rafale';
}

function formatUserId(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return `KD-${hash.toString(16).toUpperCase().padStart(7, '0').slice(0, 7)}`;
}

function logout() {
  clearAuthSession();
  window.localStorage.removeItem('kendronics.customer.orders');
  window.dispatchEvent(new Event('kendronics:orders-updated'));
  window.location.assign('/login');
}
