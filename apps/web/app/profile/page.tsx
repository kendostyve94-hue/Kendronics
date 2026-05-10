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
  const email = profile.email || 'kendostyve94@gmail.com';

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f3f6fa] text-[#1f2f43]">
      <div className="w-full">
        <ProfileHero firstName={firstName} email={email} userId={userId} avatarDataUrl={avatarDataUrl} />
        <ProfileNav />

        <div className="mx-auto grid w-full max-w-[1180px] gap-3 px-3 py-3 lg:grid-cols-[220px_minmax(0,1fr)_300px] lg:gap-4 lg:px-5 lg:py-5">
          <ProfileSidebar />

          <section className="min-w-0">
            <ProductQuickGrid />
            <DashboardPanel firstName={firstName} userId={userId} avatarDataUrl={avatarDataUrl} />
            <ReferralBanner />
            <StatusStrip />
            <OrdersTable />
            <GiftExchange />
            <ReviewsPanel />
          </section>

          <RightRail />
        </div>

        <Footer />
      </div>
    </main>
  );
}

function ProfileHero({ firstName, email, userId, avatarDataUrl }: { firstName: string; email: string; userId: string; avatarDataUrl: string }) {
  return (
    <header className="bg-[#07182c] text-white">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-3 py-3 lg:h-[100px] lg:px-5 lg:py-0">
        <div className="flex min-w-0 items-center gap-3 lg:gap-8">
          <a href="/" aria-label="Kendronics accueil">
            <img src="/images/kendronics-logo.png" alt="Kendronics" className="h-9 w-auto sm:h-11 lg:h-14" />
          </a>
          <div className="min-w-0 border-l border-white/20 pl-3 lg:pl-8">
            <p className="truncate text-xs font-black text-[#22c55e] sm:text-sm lg:text-lg">Prototype de PCB en toute simplicite</p>
            <p className="mt-1 hidden text-xs text-slate-200 sm:block lg:text-sm">Service complet de prototype de PCB personnalise.</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:gap-4">
          <Avatar avatarDataUrl={avatarDataUrl} size="large" />
          <div className="hidden min-w-[210px] text-sm sm:block">
            <div className="flex items-center gap-2">
              <strong>Bonjour, {firstName}</strong>
              <span className="rounded bg-[#22c55e] px-2 py-0.5 text-[10px] font-black uppercase text-white">Client</span>
            </div>
            <p className="mt-2 text-xs text-slate-200">Email: {email}</p>
            <p className="mt-1 text-xs text-slate-200">ID Client: {userId}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function ProfileNav() {
  return (
    <nav className="border-b border-[#d7dce3] bg-white">
      <div className="mx-auto grid max-w-[1180px] gap-2 px-3 py-2 lg:flex lg:h-[86px] lg:items-end lg:justify-between lg:px-5 lg:py-0">
        <div className="grid grid-cols-4 gap-1 text-[11px] text-[#334155] sm:grid-cols-7 lg:flex lg:h-full lg:items-end lg:gap-8 lg:text-sm">
          {['Mon compte', 'Devis immediat', "Obtenir un devis d'assemblage", 'CNC | Impression 3D', 'Conception de circuits imprimes', 'Mes commandes', 'Parametres'].map((item, index) => (
            <a key={item} href={index === 0 ? '/profile' : index === 1 ? '/quote' : '#'} className={`flex min-h-10 items-center border-b-2 px-1 leading-4 lg:h-[54px] ${index === 0 ? 'border-[#0f9f6e] font-black text-[#0f9f6e]' : 'border-transparent hover:text-[#0f9f6e]'}`}>
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center justify-end gap-4 text-xs lg:h-full lg:gap-5 lg:text-sm">
          <a href="/cart" className="relative inline-flex h-10 w-10 items-center justify-center text-[#111827]" aria-label="Panier">
            <CartIcon />
            <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#14c469] px-1 text-[11px] font-black leading-none text-white">2</span>
          </a>
          <span className="relative inline-flex h-10 w-10 items-center justify-center text-[#111827]">
            <BellIcon />
            <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-black leading-none text-white">3</span>
          </span>
          <a href="/profile" className="flex items-center gap-2 text-[#0f9f6e]">
            <UserIcon />
            Mon compte
          </a>
        </div>
      </div>
    </nav>
  );
}

function ProfileSidebar() {
  return (
    <aside className="grid gap-3 lg:block lg:bg-white lg:shadow-sm lg:ring-1 lg:ring-slate-200">
      {sidebarGroups.map((group) => (
        <section key={group.title} className="bg-white shadow-sm ring-1 ring-slate-200 lg:border-b lg:border-slate-200 lg:shadow-none lg:ring-0 lg:last:border-b-0">
          <h2 className="px-3 py-3 text-xs font-black uppercase text-[#1f2f43] lg:px-4 lg:py-4 lg:text-sm">{group.title}</h2>
          <div className="grid grid-cols-2 gap-1 px-2 pb-3 sm:grid-cols-4 lg:block lg:px-0">
            {group.items.map((item, index) => (
              <a key={item} href="#" className="flex min-h-[30px] items-center gap-2 rounded bg-[#f8fafc] px-2 text-[11px] text-[#475569] hover:bg-[#f1f8f4] hover:text-[#0f9f6e] lg:gap-3 lg:rounded-none lg:bg-transparent lg:px-4 lg:text-[13px]">
                <span className="hidden h-4 w-4 place-items-center rounded border border-slate-300 text-[9px] text-slate-400 lg:grid">{index + 1}</span>
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">
      {quickProducts.map((product) => (
        <a key={product.title} href={product.href} className="min-h-[118px] bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md lg:min-h-[165px] lg:p-4">
          <div className="flex min-h-[54px] items-start justify-between gap-2 lg:min-h-[70px]">
            <h3 className="text-[13px] font-black leading-4 text-[#111827] lg:text-sm lg:leading-5">{product.title}</h3>
            {product.image ? (
              <img src={product.image} alt="" className="h-12 w-12 rounded object-cover lg:h-16 lg:w-16" />
            ) : (
              <span className="grid h-11 w-11 place-items-center rounded-full lg:h-14 lg:w-14" style={{ backgroundColor: product.color }} />
            )}
          </div>
          <p className="mt-3 text-[11px] leading-4 text-[#64748b] lg:mt-5 lg:text-xs lg:leading-5">{product.subtitle} &gt;</p>
        </a>
      ))}
    </div>
  );
}

function DashboardPanel({ firstName, userId, avatarDataUrl }: { firstName: string; userId: string; avatarDataUrl: string }) {
  return (
    <section className="mt-3 grid bg-white shadow-sm ring-1 ring-slate-200 sm:grid-cols-[140px_minmax(0,1fr)] lg:mt-4 lg:grid-cols-[170px_minmax(0,1fr)]">
      <div className="grid place-items-center border-b border-slate-200 px-3 py-4 text-center sm:border-b-0 sm:border-r lg:px-4 lg:py-8">
        <Avatar avatarDataUrl={avatarDataUrl} size="medium" />
        <div>
          <h1 className="mt-4 text-lg font-black text-[#475569]">{firstName}</h1>
          <p className="mt-2 text-xs text-slate-500">ID Client: {userId}</p>
          <a href="#" className="mt-4 inline-flex text-xs font-semibold text-blue-600">Ma communaute</a>
        </div>
      </div>

      <div className="p-3 lg:p-4">
        <h2 className="text-sm font-black text-[#1f2f43]">Tableau de bord</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_150px] lg:mt-4 lg:grid-cols-[1fr_180px] lg:gap-4">
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
    <section className="mt-3 flex min-h-[68px] items-center justify-between gap-3 bg-gradient-to-r from-[#ff6233] via-[#ff8a18] to-[#ffb000] px-3 py-3 text-white lg:mt-4 lg:h-[74px] lg:px-5 lg:py-0">
      <div>
        <p className="text-lg font-black italic leading-none lg:text-2xl">Looking For New Referral Opportunities?</p>
        <p className="mt-2 text-xs">Refer others and explore the benefits of sharing our services.</p>
      </div>
      <a href="#" className="shrink-0 rounded-full bg-white px-4 py-2 text-[11px] font-black text-[#ff5a00] lg:px-6 lg:py-3 lg:text-xs">Sign Up Now</a>
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
    <section className="mt-3 grid grid-cols-3 bg-white py-3 shadow-sm ring-1 ring-slate-200 sm:grid-cols-6 lg:mt-4 lg:py-5">
      {statuses.map(([value, label]) => (
        <div key={label} className="border-r border-slate-200 px-3 text-center last:border-r-0">
          <p className="text-2xl font-light text-[#111827] lg:text-3xl">{value}</p>
          <p className="mt-2 text-xs leading-4 text-[#475569]">{label}</p>
        </div>
      ))}
    </section>
  );
}

function OrdersTable() {
  return (
    <section className="mt-3 bg-white p-3 shadow-sm ring-1 ring-slate-200 lg:mt-4 lg:p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-[#1f2937]">Ma commande</h2>
        <a href="/orders" className="text-xs font-semibold text-blue-600">Plus &gt;</a>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-b border-slate-200 text-[11px] sm:flex sm:gap-8 sm:text-xs">
        {['Toutes (8)', 'Verification (2)', 'Production (3)', 'Livraison (1)', 'Termine (8)'].map((tab, index) => (
          <span key={tab} className={`pb-3 ${index === 0 ? 'border-b-2 border-blue-500 font-black text-blue-600' : 'text-slate-500'}`}>{tab}</span>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:hidden">
        {orderRows.map((row) => (
          <a key={row[0]} href="/orders" className="grid gap-2 rounded border border-slate-200 bg-[#f8fafc] p-3 text-xs">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-[#0f5f88]">{row[0]}</strong>
              <span className={statusColor(row[4])}>{row[4]}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[#475569]">
              <span>{row[1]}</span>
              <span>{row[5]}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[#64748b]">
              <span>{row[2]}</span>
              <span>{row[3]}</span>
            </div>
          </a>
        ))}
      </div>
      <table className="mt-2 hidden w-full text-left text-xs sm:table">
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
    <section className="mt-3 bg-white p-3 shadow-sm ring-1 ring-slate-200 lg:mt-4 lg:p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">Echanger des cadeaux</h2>
        <a href="#" className="text-xs font-semibold text-blue-600">Afficher plus &gt;</a>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:gap-4">
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
    <section className="mt-3 bg-white p-3 shadow-sm ring-1 ring-slate-200 lg:mt-4 lg:p-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-8 text-sm font-black">
          <span className="border-b-2 border-[#22c55e] pb-2 text-[#16a34a]">Show client</span>
          <span>Programme Partenaire</span>
        </div>
        <a href="#" className="rounded bg-[#0f9f6e] px-5 py-2 text-xs font-black text-white">Laisser un commentaire</a>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:gap-4">
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
    <aside className="grid content-start gap-3 lg:gap-4">
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

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
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
