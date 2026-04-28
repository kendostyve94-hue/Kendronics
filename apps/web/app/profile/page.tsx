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

  useEffect(() => {
    const storedProfile = readStoredProfile();
    const sessionEmail = readSessionEmail();
    setProfile({
      ...emptyProfile,
      ...storedProfile,
      email: storedProfile.email || sessionEmail,
    });
  }, []);

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setSaved(false);
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function saveProfile() {
    window.localStorage.setItem(profileStorageKey, JSON.stringify(profile));
    setSaved(true);
  }

  return (
    <main className="min-h-screen bg-cloud">
      <Navbar />

      <section className="border-b border-line bg-white pt-36">
        <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8">
          <p className="label-caps text-deepblue">Repertoire utilisateur</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-ink sm:text-5xl">Mon profil</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            Modifiez les informations que Kendronics utilise pour pre-remplir vos demandes et faciliter le suivi support.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Nom complet" value={profile.name} onChange={(value) => update('name', value)} />
            <TextField label="Email" value={profile.email} onChange={(value) => update('email', value)} />
            <TextField label="Telephone" value={profile.phone} onChange={(value) => update('phone', value)} />
            <TextField label="Entreprise ou ecole" value={profile.company} onChange={(value) => update('company', value)} />
            <TextField label="Pays" value={profile.country} onChange={(value) => update('country', value)} />
          </div>

          <button type="button" onClick={saveProfile} className="mt-6 h-11 bg-deepblue px-5 text-sm font-black text-white transition hover:bg-signal">
            Enregistrer
          </button>
          {saved ? <p className="mt-4 text-sm font-black text-deepblue">Informations enregistrees sur cet appareil.</p> : null}
        </Card>
      </section>

      <Footer />
    </main>
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
