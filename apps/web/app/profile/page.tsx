'use client';

import { useEffect, useState } from 'react';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Card } from '../../components/ui/Card';
import { readAuthSession } from '../../lib/auth-session';

const profileStorageKey = 'kendronics.customer.profile';

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

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [saved, setSaved] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [deleteEmail, setDeleteEmail] = useState('');

  useEffect(() => {
    const storedProfile = readStoredProfile();
    const sessionProfile = readSessionProfile();
    setProfile({
      ...emptyProfile,
      ...storedProfile,
      email: sessionProfile.email || storedProfile.email || '',
    });
    setAccountId(sessionProfile.id || storedProfile.email || sessionProfile.email);
  }, []);

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setSaved(false);
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function saveProfile() {
    window.localStorage.setItem(profileStorageKey, JSON.stringify(profile));
    setSaved(true);
  }

  const displayName = profile.name.trim() || emailName(profile.email) || 'Non renseigne';
  const displayEmail = profile.email.trim() || 'Connectez-vous pour afficher votre e-mail';
  const accountNumber = accountId ? formatAccountNumber(accountId) : 'Connexion requise';
  const canConfirmDelete = profile.email.trim().length > 0 && deleteEmail.trim().toLowerCase() === profile.email.trim().toLowerCase();

  return (
    <main className="min-h-screen bg-cloud">
      <Navbar />

      <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-8 pt-36 sm:px-6 sm:py-10 lg:px-8">
        <Card className="p-4 sm:p-6">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffd24a_0,#f59e0b_30%,#7c2d12_62%,#111827_100%)] text-xs font-black text-white shadow-sm sm:h-24 sm:w-24">
              <span className="text-center leading-tight">KEND<br />RONICS</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoCell label="Numero de compte" value={accountNumber} />
                <InfoCell label="Nom d'utilisateur" value={displayName} />
                <InfoCell label="E-mail" value={displayEmail} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <a href="/privacy" className="flex min-h-14 items-center justify-between border-b border-line px-4 text-sm font-black text-ink sm:px-6">
            Politique de confidentialite
            <ChevronIcon />
          </a>
          <a href="/terms" className="flex min-h-14 items-center justify-between border-b border-line px-4 text-sm font-black text-ink sm:px-6">
            Conditions generales
            <ChevronIcon />
          </a>
          <details className="border-b border-line">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-4 text-sm font-black text-ink sm:px-6">
              Modifier le compte
              <span className="text-xl leading-none text-deepblue">+</span>
            </summary>
            <div className="grid gap-4 border-t border-line bg-slate-50 p-4 sm:grid-cols-2 sm:p-6">
              <TextField label="Nom complet" value={profile.name} onChange={(value) => update('name', value)} />
              <TextField label="Email" value={profile.email} onChange={(value) => update('email', value)} />
              <TextField label="Telephone" value={profile.phone} onChange={(value) => update('phone', value)} />
              <TextField label="Entreprise ou ecole" value={profile.company} onChange={(value) => update('company', value)} />
              <TextField label="Pays" value={profile.country} onChange={(value) => update('country', value)} />
              <div className="flex items-end">
                <button type="button" onClick={saveProfile} className="h-11 w-full bg-deepblue px-5 text-sm font-black text-white transition hover:bg-signal sm:w-auto">
                  Enregistrer
                </button>
              </div>
              {saved ? <p className="text-sm font-black text-deepblue sm:col-span-2">Informations enregistrees sur cet appareil.</p> : null}
            </div>
          </details>
          <details>
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-4 text-sm font-black text-ink sm:px-6">
              Supprimer le compte
              <span className="text-xl leading-none text-red-500">+</span>
            </summary>
            <div className="border-t border-line bg-slate-50 p-4 sm:p-6">
              <p className="text-sm leading-6 text-slate-600">Entrez l'adresse e-mail du compte pour activer la confirmation.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  value={deleteEmail}
                  onChange={(event) => setDeleteEmail(event.target.value)}
                  placeholder={profile.email || 'adresse@email.com'}
                  className="h-11 w-full rounded-sm border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-deepblue focus:ring-2 focus:ring-sky-100"
                />
                <button
                  type="button"
                  disabled={!canConfirmDelete}
                  className="h-11 rounded-sm bg-red-600 px-5 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </details>
        </Card>

        <Card className="p-0">
          <a href="/login" className="flex min-h-14 items-center gap-3 px-4 text-sm font-black text-ink sm:px-6">
            <PowerIcon />
            Se deconnecter
          </a>
        </Card>
      </section>

      <Footer />
    </main>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-base font-black text-ink sm:text-lg">{value}</p>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-sm border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-deepblue focus:ring-2 focus:ring-sky-100"
      />
    </label>
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

function formatAccountNumber(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return `KD-${hash.toString(36).toUpperCase().padStart(7, '0').slice(0, 7)}`;
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v8" />
      <path d="M17.7 6.9a8 8 0 1 1-11.4 0" />
    </svg>
  );
}
