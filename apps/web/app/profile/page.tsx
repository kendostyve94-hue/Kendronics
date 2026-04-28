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

  return (
    <main className="min-h-screen bg-cloud">
      <Navbar />

      <section className="border-b border-line bg-white pt-36">
        <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8">
          <p className="label-caps text-deepblue">Repertoire utilisateur</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-ink sm:text-5xl">Mon profil</h1>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Card className="overflow-hidden p-0">
          <div className="grid gap-0 divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
            <InfoCell label="Numero de compte" value={accountNumber} />
            <InfoCell label="Nom d'utilisateur" value={displayName} />
            <InfoCell label="E-mail" value={displayEmail} />
          </div>

          <details className="border-t border-line">
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
        </Card>
      </section>

      <Footer />
    </main>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-lg font-black text-ink">{value}</p>
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
