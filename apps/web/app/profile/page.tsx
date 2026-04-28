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

type ConfirmationAction = 'account' | 'contacts' | 'delete';

type ConfirmationState = {
  action: ConfirmationAction;
  code: string;
  email: string;
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
  const [accountDraft, setAccountDraft] = useState<Omit<ProfileForm, 'email'>>({
    name: '',
    phone: '',
    company: '',
    country: '',
  });
  const [contactDraft, setContactDraft] = useState({ currentEmail: '', nextEmail: '', nextPhone: '' });
  const [saved, setSaved] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [deleteEmail, setDeleteEmail] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [openSection, setOpenSection] = useState<'account' | 'contacts' | 'delete' | null>(null);

  useEffect(() => {
    const storedProfile = readStoredProfile();
    const sessionProfile = readSessionProfile();
    const nextProfile = {
      ...emptyProfile,
      ...storedProfile,
      email: sessionProfile.email || storedProfile.email || '',
    };
    setProfile(nextProfile);
    setAccountDraft({
      name: nextProfile.name,
      phone: nextProfile.phone,
      company: nextProfile.company,
      country: nextProfile.country,
    });
    setAccountId(sessionProfile.id || storedProfile.email || sessionProfile.email);
  }, []);

  function updateAccountDraft<K extends keyof Omit<ProfileForm, 'email'>>(key: K, value: Omit<ProfileForm, 'email'>[K]) {
    setSaved(false);
    setAccountDraft((current) => ({ ...current, [key]: value }));
  }

  function saveProfile(nextProfile: ProfileForm) {
    window.localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setSaved(true);
  }

  function requestConfirmation(action: ConfirmationAction) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setConfirmation({
      action,
      code,
      email: profile.email,
    });
    setConfirmationInput('');
  }

  function validateConfirmation() {
    if (!confirmation || confirmationInput.trim() !== confirmation.code) return;

    if (confirmation.action === 'account') {
      saveProfile({ ...profile, ...accountDraft });
    }

    if (confirmation.action === 'contacts') {
      saveProfile({
        ...profile,
        email: contactDraft.nextEmail.trim() || profile.email,
        phone: contactDraft.nextPhone.trim() || profile.phone,
      });
      setContactDraft({ currentEmail: '', nextEmail: '', nextPhone: '' });
    }

    if (confirmation.action === 'delete') {
      window.localStorage.removeItem(profileStorageKey);
      window.localStorage.removeItem('kendronics.auth.session');
      setProfile(emptyProfile);
      setAccountDraft({ name: '', phone: '', company: '', country: '' });
      setDeleteEmail('');
    }

    setConfirmation(null);
    setConfirmationInput('');
  }

  function toggleSection(section: 'account' | 'contacts' | 'delete') {
    setOpenSection((current) => (current === section ? null : section));
  }

  const displayName = profile.name.trim() || emailName(profile.email) || 'Non renseigne';
  const displayEmail = profile.email.trim() || 'Connectez-vous pour afficher votre e-mail';
  const accountNumber = accountId ? formatAccountNumber(accountId) : 'Connexion requise';
  const hasAccountDraftValue = Object.values(accountDraft).some((value) => value.trim().length > 0);
  const hasEmailContactChange =
    isValidEmail(contactDraft.currentEmail) &&
    isValidEmail(contactDraft.nextEmail) &&
    contactDraft.currentEmail.trim().toLowerCase() === profile.email.trim().toLowerCase();
  const hasPhoneOnlyContactChange =
    contactDraft.nextPhone.trim().length > 0 &&
    !contactDraft.currentEmail.trim() &&
    !contactDraft.nextEmail.trim();
  const hasFullContactChange = hasEmailContactChange && contactDraft.nextPhone.trim().length > 0;
  const canSaveContacts = hasEmailContactChange || hasPhoneOnlyContactChange || hasFullContactChange;
  const canConfirmDelete = profile.email.trim().length > 0 && deleteEmail.trim().toLowerCase() === profile.email.trim().toLowerCase();
  const canSaveAccount = hasAccountDraftValue && Boolean(profile.email);

  return (
    <main className="min-h-screen bg-cloud">
      <Navbar />

      <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-8 pt-36 sm:px-6 sm:py-10 lg:px-8">
        <Card className="p-4 sm:p-6">
          <div className="flex items-start gap-4 sm:gap-6">
            <KendronicsAvatar />
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
          <div className="border-b border-line">
            <button type="button" className="flex min-h-14 w-full items-center justify-between px-4 text-left text-sm font-black text-ink sm:px-6" aria-expanded={openSection === 'account'} onClick={() => toggleSection('account')}>
              Modifier le compte
              <span className="text-xl leading-none text-deepblue">+</span>
            </button>
            {openSection === 'account' ? (
            <div className="grid gap-4 border-t border-line bg-slate-50 p-4 sm:grid-cols-2 sm:p-6">
              <TextField label="Nom complet" value={accountDraft.name} onChange={(value) => updateAccountDraft('name', value)} />
              <TextField label="Telephone" value={accountDraft.phone} onChange={(value) => updateAccountDraft('phone', value)} />
              <TextField label="Entreprise ou ecole" value={accountDraft.company} onChange={(value) => updateAccountDraft('company', value)} />
              <TextField label="Pays" value={accountDraft.country} onChange={(value) => updateAccountDraft('country', value)} />
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => requestConfirmation('account')}
                  disabled={!canSaveAccount}
                  className={`h-11 w-full rounded-sm px-5 text-sm font-black text-white transition sm:w-auto ${
                    canSaveAccount ? 'bg-deepblue hover:bg-signal' : 'cursor-not-allowed bg-slate-300'
                  }`}
                >
                  Enregistrer
                </button>
              </div>
              {saved ? <p className="text-sm font-black text-deepblue sm:col-span-2">Informations enregistrees sur cet appareil.</p> : null}
            </div>
            ) : null}
          </div>
          <div className="border-b border-line">
            <button type="button" className="flex min-h-14 w-full items-center justify-between px-4 text-left text-sm font-black text-ink sm:px-6" aria-expanded={openSection === 'contacts'} onClick={() => toggleSection('contacts')}>
              Changer mes contacts
              <span className="text-xl leading-none text-deepblue">+</span>
            </button>
            {openSection === 'contacts' ? (
            <div className="grid gap-4 border-t border-line bg-slate-50 p-4 sm:grid-cols-3 sm:p-6">
              <TextField label="Ancien email" value={contactDraft.currentEmail} onChange={(value) => setContactDraft((current) => ({ ...current, currentEmail: value }))} />
              <TextField label="Nouveau email" value={contactDraft.nextEmail} onChange={(value) => setContactDraft((current) => ({ ...current, nextEmail: value }))} />
              <TextField label="Nouveau numero" value={contactDraft.nextPhone} onChange={(value) => setContactDraft((current) => ({ ...current, nextPhone: value }))} />
              <div className="flex items-end sm:col-span-3">
                <button
                  type="button"
                  onClick={() => requestConfirmation('contacts')}
                  disabled={!canSaveContacts || !profile.email}
                  className={`h-11 w-full rounded-sm px-5 text-sm font-black text-white transition sm:w-auto ${
                    canSaveContacts && profile.email ? 'bg-deepblue hover:bg-signal' : 'cursor-not-allowed bg-slate-300'
                  }`}
                >
                  Enregistrer
                </button>
              </div>
            </div>
            ) : null}
          </div>
          <div>
            <button type="button" className="flex min-h-14 w-full items-center justify-between px-4 text-left text-sm font-black text-ink sm:px-6" aria-expanded={openSection === 'delete'} onClick={() => toggleSection('delete')}>
              Supprimer le compte
              <span className="text-xl leading-none text-red-500">+</span>
            </button>
            {openSection === 'delete' ? (
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
                  onClick={() => requestConfirmation('delete')}
                  className="h-11 rounded-sm bg-red-600 px-5 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Confirmer
                </button>
              </div>
            </div>
            ) : null}
          </div>
        </Card>

        <Card className="p-0">
          <a href="/login" className="flex min-h-14 items-center gap-3 px-4 text-sm font-black text-ink sm:px-6">
            <PowerIcon />
            Se deconnecter
          </a>
        </Card>
      </section>

      <Footer />
      {confirmation ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 px-5">
          <div className="w-full max-w-[19rem] rounded-sm bg-white p-4 shadow-premium">
            <h2 className="text-base font-black text-ink">Code de confirmation</h2>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Un code de confirmation a ete prepare pour {confirmation.email}. Entrez ce code pour valider l'action.
            </p>
            <p className="mt-2 text-xs font-bold text-slate-500">Code temporaire: {confirmation.code}</p>
            <input
              value={confirmationInput}
              onChange={(event) => setConfirmationInput(event.target.value)}
              inputMode="numeric"
              maxLength={6}
              className="mt-3 h-10 w-full rounded-sm border border-slate-200 px-3 text-center text-base font-black tracking-[0.24em] outline-none focus:border-deepblue focus:ring-2 focus:ring-sky-100"
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="h-10 rounded-sm border border-line text-sm font-black text-slate-600" onClick={() => setConfirmation(null)}>
                Annuler
              </button>
              <button
                type="button"
                disabled={!confirmationInput.trim()}
                onClick={validateConfirmation}
                className="h-10 rounded-sm bg-deepblue text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      ) : null}
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

function KendronicsAvatar() {
  return (
    <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-[#0b1724] shadow-[0_10px_24px_rgba(8,20,32,0.18)] ring-2 ring-white sm:h-24 sm:w-24" aria-hidden="true">
      <svg viewBox="0 0 96 96" className="h-full w-full">
        <defs>
          <radialGradient id="avatarGlow" cx="34%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#ffd76a" />
            <stop offset="38%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#0f8f6b" />
            <stop offset="100%" stopColor="#0b1724" />
          </radialGradient>
          <linearGradient id="avatarTrace" x1="18" y1="12" x2="78" y2="86">
            <stop offset="0%" stopColor="#fff4c4" />
            <stop offset="100%" stopColor="#56e0b2" />
          </linearGradient>
        </defs>
        <circle cx="48" cy="48" r="48" fill="url(#avatarGlow)" />
        <circle cx="48" cy="48" r="39" fill="#0b1724" opacity="0.72" />
        <path d="M18 30h15l8 9h14l8-9h15M18 66h14l9-10h14l9 10h14" fill="none" stroke="url(#avatarTrace)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        <path d="M25 49h16M55 49h16M48 20v15M48 61v15" fill="none" stroke="#ffd76a" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
        {[18, 78, 48, 25, 71].map((x, index) => (
          <circle key={`${x}-${index}`} cx={x} cy={[30, 30, 20, 49, 49][index]} r="3.4" fill="#fff4c4" />
        ))}
        <circle cx="48" cy="48" r="22" fill="#f4f7fa" opacity="0.95" />
        <path d="M37 63V33h7v12l13-12h9L51 47l16 16H57L44 50v13h-7Z" fill="#0f8f6b" />
        <circle cx="73" cy="68" r="6" fill="#ffd76a" stroke="#0b1724" strokeWidth="3" />
      </svg>
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

function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value.trim());
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
