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
  href: string;
  image: string;
  color: string;
  shape?: 'circle' | 'square';
};

const quickProducts: QuickProduct[] = [
  { title: 'Prototype PCB', href: '/quote', image: '/images/quote-product-standard-pcb.png', color: '#22c55e' },
  { title: 'FPC / Rigid-Flex', href: '/quote', image: '/images/quote-product-fpc-rigid-flex.png', color: '#ff7a1a' },
  { title: 'Assemblage PCB', href: '/quote', image: '/images/quote-product-assembly.png', color: '#3b82f6' },
  { title: 'SMD-Stencil', href: '/quote', image: '/images/quote-product-smd-stencil.png', color: '#a855f7' },
  { title: 'CNC / Impression 3D', href: '/services', image: '', color: '#06b6d4', shape: 'circle' },
  { title: 'Conception PCB', href: '/services', image: '', color: '#facc15', shape: 'square' },
];

const orderLinks = ['Verification en cours (0)', 'Paiement en attente (0)', 'Paiement inacheve (0)', 'Statut de production (0)', 'Livraison (0)', 'Termine (0)', 'Remboursements & Litiges (0)'];
const promoLinks = ['Centre de Message', 'Notifications', 'Mes coupons', 'Connexion', 'Inviter', 'Projets partages'];
const profileLinks = ['Adresse de livraison', 'Parametres', 'Compte de collecte', 'Informations de facturation', 'Solde du compte'];

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
  const lastName = lastNameOf(profile.name || 'KENDONG');
  const userId = formatUserId(accountId);

  return (
    <main className="min-h-screen overflow-x-auto bg-[#eeeeee] text-[#25364a]">
      <div className="min-w-[1180px]">
        <ProfileNavbar firstName={firstName} avatarDataUrl={avatarDataUrl} />

        <div className="mx-auto grid max-w-[1368px] grid-cols-[260px_minmax(0,1fr)] gap-5 px-4 pb-8 pt-6">
          <ProfileSidebar />

          <section className="min-w-0">
            <ProductQuickGrid />

            <div className="mt-5 grid grid-cols-[minmax(0,1fr)_320px] gap-5">
            <div className="border border-[#d8d8d8] bg-white">
              <div className="grid grid-cols-[240px_minmax(0,1fr)] gap-0">
                <ProfileIdentity firstName={firstName} lastName={lastName} userId={userId} avatarDataUrl={avatarDataUrl} />
                <div className="border-l border-t-0 border-[#e5e5e5] p-5">
                  <AccountSummary />
                  <RewardsBanner />
                </div>
              </div>
            </div>

            <aside className="grid gap-5">
              <PromoCard />
              <NewsCard />
            </aside>
          </div>

            <StatusStrip />
            <RecentOrders />
          </section>
        </div>
        <Footer />
      </div>
    </main>
  );
}

function ProfileNavbar({ firstName, avatarDataUrl }: { firstName: string; avatarDataUrl: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#d7d7d7] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.16)]">
      <div className="mx-auto flex h-[70px] max-w-[1368px] items-center gap-4 px-5">
        <a href="/" className="mr-3 shrink-0" aria-label="Kendronics accueil">
          <img src="/images/kendronics-logo.png" alt="Kendronics" className="h-12 w-auto" />
        </a>
        <nav className="flex min-w-0 flex-1 items-center justify-between gap-2 text-[15px] text-[#111827]">
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
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-pink-500 px-1 text-[11px] font-semibold leading-none text-white">0</span>
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
    <a href={href} className="grid min-h-[54px] min-w-[92px] place-items-center px-2 text-center leading-6 hover:text-[#00a651]">
      {label}
    </a>
  );
}

function ProfileSidebar() {
  return (
    <aside className="block border border-[#d8d8d8] bg-white">
      <SidebarGroup title="Commandes" items={orderLinks} />
      <SidebarGroup title="Promotions" items={promoLinks} />
      <SidebarGroup title="Mon profil" items={profileLinks} />
    </aside>
  );
}

function SidebarGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="border-b border-[#e4e4e4] last:border-b-0">
      <h2 className="bg-[#f7f7f7] px-5 py-5 text-sm font-black uppercase text-[#263446]">{title}</h2>
      <div className="grid gap-0 py-2">
        {items.map((item) => (
          <a key={item} href="#" className="flex min-h-[45px] items-center gap-3 px-5 py-3 text-sm text-[#334155] hover:bg-[#f6fbff] hover:text-[#00a651]">
            <span className="text-xs text-[#8a9bab]">▣</span>
            {item}
          </a>
        ))}
      </div>
    </section>
  );
}

function ProductQuickGrid() {
  return (
    <div className="grid grid-cols-6 gap-4">
      {quickProducts.map((product) => (
        <a
          key={product.title}
          href={product.href}
          className="overflow-hidden border bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
          style={{ borderColor: product.color }}
        >
          <div className="grid h-20 place-items-center bg-[#f8fafc]" style={{ backgroundColor: product.image ? '#f8fafc' : product.color }}>
            {product.image ? <img src={product.image} alt="" className="h-full w-full object-cover" /> : <span className="h-10 w-10" style={{ backgroundColor: product.color, borderRadius: product.shape === 'circle' ? '999px' : '0' }} />}
          </div>
          <div className="p-4">
            <h3 className="text-xl font-black leading-6 text-[#1f2937]">{product.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">Commander &gt;</p>
          </div>
        </a>
      ))}
    </div>
  );
}

function ProfileIdentity({ firstName, lastName, userId, avatarDataUrl }: { firstName: string; lastName: string; userId: string; avatarDataUrl: string }) {
  return (
    <div className="grid place-items-center px-6 py-8 text-center">
      <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-[#e7e7e7]">
        {avatarDataUrl ? <img src={avatarDataUrl} alt="Avatar client" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0">
        <h1 className="mt-6 text-2xl font-black text-[#5f6368]">Bonjour, {firstName}</h1>
        <p className="mt-2 text-sm uppercase text-[#6b7280]">{lastName}</p>
        <p className="mt-6 text-sm text-[#6b7280]">ID utilisateur : {userId}</p>
      </div>
    </div>
  );
}

function AccountSummary() {
  const cells = [
    ['Solde (USD)', '$0.00', 'text-[#3f3f46]'],
    ['Recemment ajoute', '+0.00', 'text-[#ff5a00]'],
    ['Mes coupons', '5', 'text-[#3f3f46]'],
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cells.map(([label, value, color]) => (
        <div key={label} className="min-h-[136px] border border-[#e5e7eb] bg-[#fafafa] p-6">
          <p className="text-sm text-[#64748b]">{label}</p>
          <p className={`mt-5 text-4xl font-black ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}

function RewardsBanner() {
  return (
    <div className="mt-5 flex min-h-[96px] items-center justify-between gap-5 overflow-hidden bg-gradient-to-r from-[#ff6b00] via-[#ff9f00] to-[#ffd400] px-8 text-white">
      <div>
        <p className="-mt-2 text-4xl font-black italic leading-9">Kendronics</p>
        <p className="text-4xl font-black italic leading-9">Rewards</p>
        <p className="mt-2 text-sm">Partagez vos projets PCB.</p>
      </div>
      <a href="#" className="shrink-0 rounded-full bg-white px-8 py-3 text-sm font-black text-[#ff6b00]">
        Rejoindre
      </a>
    </div>
  );
}

function PromoCard() {
  return (
    <article className="border border-[#d8d8d8] bg-white p-5">
      <h2 className="text-3xl font-black text-[#1f2937]">PCB Prototype</h2>
      <p className="mt-4 text-lg text-[#52525b]">Seulement $5</p>
      <div className="mt-5 h-24 bg-gradient-to-r from-[#0fe36f] to-[#03b7e8]" />
    </article>
  );
}

function NewsCard() {
  const news = ['Comment preparer vos fichiers Gerber', "Reduction sur l'assemblage PCB", 'Delais de livraison Afrique', 'Mise a jour du moteur de pricing'];

  return (
    <article className="border border-[#d8d8d8] bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-[#1f2937]">Dernieres nouvelles</h2>
        <a href="/blog" className="text-sm text-blue-600">Plus</a>
      </div>
      <ul className="mt-5 grid gap-4 text-sm text-[#475569]">
        {news.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </article>
  );
}

function StatusStrip() {
  const statuses = ['Verification en cours', 'Paiement en attente', 'Statut de production', "Questions d'ingenierie", 'Livraison', 'Commentaires en attente'];

  return (
    <section className="mt-5 grid grid-cols-6 border border-[#d8d8d8] bg-white py-6">
      {statuses.map((status) => (
        <div key={status} className="grid min-h-[120px] place-items-center border-r border-[#e5e7eb] px-4 text-center last:border-r-0">
          <div>
            <p className="text-5xl font-light text-[#475569]">0</p>
            <p className="mt-3 text-sm leading-5 text-[#475569]">{status}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

function RecentOrders() {
  return (
    <section className="mt-5 border border-[#d8d8d8] bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-3xl font-black text-[#1f2937]">Ma commande</h2>
        <a href="/orders" className="text-sm text-blue-600">Afficher plus &gt;</a>
      </div>
      <div className="mt-8 grid min-h-[128px] place-items-center border border-dashed border-[#d1d5db] text-lg text-[#9ca3af]">
        Aucune commande recente
      </div>
      <div className="mt-6 flex justify-end">
        <button type="button" onClick={logout} className="text-sm text-[#64748b] hover:text-red-600">
          Se deconnecter
        </button>
      </div>
    </section>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M3 4h2l2.3 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6.2" />
    </svg>
  );
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

function lastNameOf(value: string) {
  const parts = value.trim().split(/[\s._-]+/).filter(Boolean);
  return parts.length > 1 ? parts.slice(1).join(' ').toUpperCase() : 'KENDONG';
}

function formatUserId(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return `W${hash.toString().padStart(7, '0').slice(0, 7)}A`;
}

function logout() {
  clearAuthSession();
  window.localStorage.removeItem('kendronics.customer.orders');
  window.dispatchEvent(new Event('kendronics:orders-updated'));
  window.location.assign('/login');
}
