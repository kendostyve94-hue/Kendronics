'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { readAuthSession } from '../../lib/auth-session';

const profileStorageKey = 'kendronics.customer.profile';
const accountNumber = '12490265A';

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  country: string;
};

const emptyProfile: ProfileForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  country: '',
};

const orderStatusItems: Array<[string, ReactNode]> = [
  ['En attente de paiement', <PaymentIcon key="payment" />],
  ['Action requise', <ActionIcon key="action" />],
  ['En production', <FactoryIcon key="factory" />],
  ['Expedie', <TruckIcon key="truck" />],
];

const profileMenuItems: Array<[string, string, ReactNode, string?]> = [
  ['Mes coupons', '/pricing', <CouponIcon key="coupon" />],
  ["Carnet d'adresses", '/contact', <PinIcon key="pin" />],
  ['Envoyez a', '/quote', <GlobeIcon key="globe" />, 'EUR'],
  ["Centre d'aide", '/centre-aide', <HelpIcon key="help" />],
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [view, setView] = useState<'home' | 'settings'>('home');

  useEffect(() => {
    const storedProfile = readStoredProfile();
    const sessionEmail = readSessionEmail();
    setProfile({
      ...emptyProfile,
      ...storedProfile,
      email: storedProfile.email || sessionEmail,
    });
  }, []);

  const username = profile.name.trim() || emailName(profile.email) || 'client Kendronics';
  const maskedEmail = maskEmail(profile.email);

  return (
    <main className="min-h-screen bg-[#f2f4f8] pb-24 text-[#202226]">
      <Navbar hideMobileHeader />

      <section className="mx-auto max-w-5xl lg:px-8 lg:pt-32">
        <div className="lg:hidden">
          {view === 'home' ? (
            <ProfileHome username={username} onSettings={() => setView('settings')} />
          ) : (
            <ProfileSettings username={username} email={maskedEmail} onBack={() => setView('home')} />
          )}
        </div>

        <div className="hidden lg:block">
          <div className="rounded-sm border border-line bg-white p-8 shadow-sm">
            <ProfileHome username={username} onSettings={() => setView('settings')} />
          </div>
        </div>
      </section>
    </main>
  );
}

function ProfileHome({ username, onSettings }: { username: string; onSettings: () => void }) {
  return (
    <div className="min-h-screen bg-[#f2f4f8]">
      <div className="bg-[linear-gradient(135deg,#d9f0ff_0%,#e9f7ff_52%,#f7fbff_100%)] px-4 pb-5 pt-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[#d3ebff] text-[#5ba9ee]">
              <UserAvatarIcon />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-3xl font-black leading-tight">Salut, {username}</h1>
              <p className="mt-2 text-lg font-medium text-slate-500">Numero de compte : {accountNumber}</p>
            </div>
          </div>
          <button type="button" onClick={onSettings} className="grid h-11 w-11 shrink-0 place-items-center text-slate-800" aria-label="Parametres">
            <SettingsIcon />
          </button>
        </div>

        <section className="mt-7 rounded-2xl border border-white/80 bg-white/78 px-4 pb-4 pt-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black">Historique des commandes</h2>
            <a href="/orders/demo" className="inline-flex items-center gap-2 text-base font-medium text-slate-400">
              Afficher tout
              <ChevronIcon />
            </a>
          </div>
          <div className="mt-5 grid grid-cols-4 gap-2 text-center">
            {orderStatusItems.map(([label, icon]) => (
              <a key={label} href="/orders/demo" className="grid min-h-24 place-items-center gap-2 rounded-sm text-slate-700">
                <span className="grid h-10 place-items-center text-[#3398ee]">{icon}</span>
                <span className="text-sm font-medium leading-5">{label}</span>
              </a>
            ))}
          </div>
        </section>
      </div>

      <section className="mx-4 mt-5 rounded-2xl bg-white py-4 shadow-sm">
        {profileMenuItems.map(([label, href, icon, suffix]) => (
          <a key={label} href={href as string} className="flex min-h-20 items-center gap-5 px-5 text-2xl font-medium">
            <span className="grid h-9 w-9 shrink-0 place-items-center text-slate-900">{icon}</span>
            <span className="min-w-0 flex-1">{label}</span>
            {suffix ? <span className="text-lg text-slate-400">{suffix}</span> : null}
            <ChevronIcon />
          </a>
        ))}
      </section>
    </div>
  );
}

function ProfileSettings({ username, email, onBack }: { username: string; email: string; onBack: () => void }) {
  const accountRows = [
    ['Compte #', accountNumber],
    ["Nom d'utilisateur", username],
    ['E-mail', email || 'Non renseigne'],
  ];

  const legalRows = [
    ['politique de confidentialite', '/privacy'],
    ['Conditions generales', '/terms'],
    ['Liste de collecte de renseignements personnels', '/privacy'],
    ['Liste de partage de renseignements personnels avec des tiers', '/privacy'],
  ];

  return (
    <div className="min-h-screen bg-[#f2f4f8]">
      <header className="relative flex h-20 items-center justify-center bg-white">
        <button type="button" onClick={onBack} className="absolute left-5 grid h-11 w-11 place-items-center" aria-label="Retour">
          <BackIcon />
        </button>
        <h1 className="text-3xl font-black">Parametres</h1>
      </header>

      <section className="mt-5 bg-white px-4">
        {accountRows.map(([label, value]) => (
          <div key={label} className="flex min-h-20 items-center justify-between gap-4 border-b border-slate-100 text-2xl">
            <span>{label}</span>
            <span className="truncate text-right text-slate-400">{value}</span>
          </div>
        ))}
        <a href="/contact" className="flex min-h-20 items-center justify-between border-b border-slate-100 text-2xl">
          Supprimer le compte
          <ChevronIcon />
        </a>
      </section>

      <section className="mt-5 bg-white px-4">
        {legalRows.map(([label, href]) => (
          <a key={label} href={href} className="flex min-h-20 items-center justify-between gap-4 border-b border-slate-100 text-2xl leading-tight">
            <span>{label}</span>
            <ChevronIcon />
          </a>
        ))}
      </section>

      <a href="/login" className="mt-5 flex min-h-20 items-center gap-5 bg-white px-4 text-2xl">
        <PowerIcon />
        se deconnecter
      </a>
    </div>
  );
}

function readStoredProfile(): Partial<ProfileForm> {
  try {
    return JSON.parse(window.localStorage.getItem(profileStorageKey) ?? '{}') as Partial<ProfileForm>;
  } catch {
    return {};
  }
}

function readSessionEmail(): string {
  const session = readAuthSession();
  if (!session?.accessToken) return '';

  try {
    const payload = JSON.parse(window.atob(session.accessToken.split('.')[1] ?? '')) as { email?: string };
    return payload.email ?? '';
  } catch {
    return '';
  }
}

function emailName(email: string) {
  return email.includes('@') ? email.split('@')[0] : '';
}

function maskEmail(email: string) {
  if (!email.includes('@')) return email;
  const [name, domain] = email.split('@');
  return `${name.slice(0, Math.min(6, name.length))}****@${domain}`;
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 4.8 7.1v9.8L12 21l7.2-4.1V7.1L12 3Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

function UserAvatarIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-16 w-16" fill="currentColor" aria-hidden="true">
      <path d="M24 25.5c7.1 0 13 5.3 13.9 12.2A21 21 0 0 1 10.1 37.7C11 30.8 16.9 25.5 24 25.5Z" />
      <circle cx="24" cy="16.5" r="10" />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-11 w-11" fill="currentColor" aria-hidden="true">
      <rect x="3" y="7" width="24" height="17" rx="2" />
      <rect x="6" y="11" width="17" height="2.4" rx="1" fill="white" />
      <rect x="6" y="16" width="8" height="2.4" rx="1" fill="white" />
      <circle cx="25" cy="23" r="5" fill="#9fd1ff" />
      <path d="M25 20v3h2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function ActionIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-11 w-11" fill="currentColor" aria-hidden="true">
      <rect x="7" y="4" width="16" height="24" rx="2" />
      <rect x="10" y="8" width="10" height="2.4" rx="1" fill="white" />
      <rect x="10" y="14" width="7" height="2.4" rx="1" fill="white" />
      <path d="M21 17h8l-2.7 4L29 25h-8l2.7-4L21 17Z" fill="#9fd1ff" />
    </svg>
  );
}

function FactoryIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-11 w-11" fill="currentColor" aria-hidden="true">
      <path d="M5 26V13l7 5v-6l7 5v-5h4v14H5Z" />
      <rect x="24" y="18" width="4" height="8" rx="1" fill="#9fd1ff" />
      <circle cx="26" cy="21" r="1" fill="white" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-11 w-11" fill="currentColor" aria-hidden="true">
      <path d="M4 12h15v11H4z" />
      <path d="M19 15h5l4 4v4h-9z" />
      <circle cx="10" cy="24" r="2.5" fill="#9fd1ff" />
      <circle cx="23" cy="24" r="2.5" fill="#9fd1ff" />
      <path d="M25 17v3h2" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function CouponIcon() {
  return iconPath('M4 8h16v4a3 3 0 0 0 0 6v4H4v-4a3 3 0 0 0 0-6V8Zm6 5h5M10 17h3');
}

function PinIcon() {
  return iconPath('M12 21s7-5.4 7-11a7 7 0 0 0-14 0c0 5.6 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z');
}

function GlobeIcon() {
  return iconPath('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-20c3 2.7 4.5 6 4.5 10S15 19.3 12 22m0-20C9 4.7 7.5 8 7.5 12S9 19.3 12 22M2 12h20');
}

function HelpIcon() {
  return iconPath('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-6v.1M9.5 9a2.5 2.5 0 1 1 3.7 2.2c-.8.5-1.2 1-1.2 2');
}

function PowerIcon() {
  return iconPath('M12 3v8m5.7-4.1A8 8 0 1 1 6.3 6.9', 'h-9 w-9 text-slate-400');
}

function iconPath(path: string, className = 'h-9 w-9') {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
