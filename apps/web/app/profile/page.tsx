'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Card } from '../../components/ui/Card';
import { getApiBaseUrl } from '../../lib/api-base-url';
import { clearAuthSession, readAuthSession, readFreshAuthSession } from '../../lib/auth-session';

const profileStorageKey = 'kendronics.customer.profile';
const avatarStorageKey = 'kendronics.customer.avatar';

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
  email: string;
};

const emptyProfile: ProfileForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  country: '',
};
const apiBaseUrl = getApiBaseUrl();

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
  const [avatarDataUrl, setAvatarDataUrl] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'sending' | 'verifying'>('idle');
  const [logoutStatus, setLogoutStatus] = useState<'idle' | 'signing_out'>('idle');

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
    setAvatarDataUrl(window.localStorage.getItem(avatarStorageKey) ?? '');
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

  async function requestConfirmation(action: ConfirmationAction) {
    setVerificationError('');
    setVerificationStatus('sending');

    try {
      const session = await readFreshAuthSession();
      if (!session?.accessToken) {
        throw new Error('Connectez-vous avant de demander un code.');
      }

      const response = await fetch(`${apiBaseUrl}/api/auth/profile-verification/request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(await responseErrorMessage(response, "Impossible d'envoyer le code de confirmation."));
      }

      setConfirmation({
        action,
        email: profile.email,
      });
      setConfirmationInput('');
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : "Impossible d'envoyer le code de confirmation.");
    } finally {
      setVerificationStatus('idle');
    }
  }

  async function validateConfirmation() {
    if (!confirmation || !confirmationInput.trim()) return;

    setVerificationError('');
    setVerificationStatus('verifying');

    try {
      const session = await readFreshAuthSession();
      if (!session?.accessToken) {
        throw new Error('Connectez-vous avant de valider le code.');
      }

      const response = await fetch(`${apiBaseUrl}/api/auth/profile-verification/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: confirmation.action,
          code: confirmationInput.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(await responseErrorMessage(response, 'Code de confirmation invalide ou expire.'));
      }

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
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : 'Code de confirmation invalide ou expire.');
    } finally {
      setVerificationStatus('idle');
    }
  }

  function toggleSection(section: 'account' | 'contacts' | 'delete') {
    setOpenSection((current) => (current === section ? null : section));
  }

  function updateAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setVerificationError('Choisissez un fichier image pour votre avatar.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : '';
      if (!value) return;
      window.localStorage.setItem(avatarStorageKey, value);
      setAvatarDataUrl(value);
      setVerificationError('');
      window.dispatchEvent(new Event('kendronics:avatar-updated'));
    };
    reader.onerror = () => setVerificationError("Impossible de charger l'image choisie.");
    reader.readAsDataURL(file);
  }

  function removeAvatar() {
    window.localStorage.removeItem(avatarStorageKey);
    setAvatarDataUrl('');
    window.dispatchEvent(new Event('kendronics:avatar-updated'));
  }

  async function logout() {
    if (logoutStatus === 'signing_out') return;

    setLogoutStatus('signing_out');
    const session = readAuthSession();

    try {
      if (session?.refreshToken) {
        await fetch(`${apiBaseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        }).catch(() => null);
      }
    } finally {
      clearAuthSession();
      window.localStorage.removeItem('kendronics.customer.orders');
      window.dispatchEvent(new Event('kendronics:orders-updated'));
      window.location.assign('/login');
    }
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

      <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-24 pt-28 sm:px-6 sm:pb-10 sm:pt-32 lg:px-8">
        <Card className="p-4 sm:p-6">
          <div className="grid gap-4 sm:flex sm:items-start sm:gap-6">
            <CustomerAvatar
              name={displayName}
              email={profile.email}
              avatarDataUrl={avatarDataUrl}
              onAvatarChange={updateAvatar}
              onAvatarRemove={removeAvatar}
            />
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
          <a href="/privacy" className="flex min-h-14 items-center justify-between gap-3 border-b border-line px-4 text-sm font-black text-ink sm:px-6">
            Politique de confidentialite
            <ChevronIcon />
          </a>
          <a href="/terms" className="flex min-h-14 items-center justify-between gap-3 border-b border-line px-4 text-sm font-black text-ink sm:px-6">
            Conditions generales
            <ChevronIcon />
          </a>
          <div className="border-b border-line">
            <button type="button" className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left text-sm font-black text-ink sm:px-6" aria-expanded={openSection === 'account'} onClick={() => toggleSection('account')}>
              Modifier le compte
              <span className="shrink-0 text-xl leading-none text-deepblue">{openSection === 'account' ? '-' : '+'}</span>
            </button>
            {openSection === 'account' ? (
            <div className="grid gap-4 border-t border-line bg-slate-50 p-4 sm:grid-cols-2 sm:p-6">
              <TextField label="Nom complet" value={accountDraft.name} onChange={(value) => updateAccountDraft('name', value)} />
              <TextField label="Telephone" value={accountDraft.phone} onChange={(value) => updateAccountDraft('phone', value)} />
              <TextField label="Entreprise ou ecole" value={accountDraft.company} onChange={(value) => updateAccountDraft('company', value)} />
              <TextField label="Pays" value={accountDraft.country} onChange={(value) => updateAccountDraft('country', value)} />
              <div className="flex items-end sm:col-span-2">
                <button
                  type="button"
                  onClick={() => void requestConfirmation('account')}
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
            <button type="button" className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left text-sm font-black text-ink sm:px-6" aria-expanded={openSection === 'contacts'} onClick={() => toggleSection('contacts')}>
              Changer mes contacts
              <span className="shrink-0 text-xl leading-none text-deepblue">{openSection === 'contacts' ? '-' : '+'}</span>
            </button>
            {openSection === 'contacts' ? (
            <div className="grid gap-4 border-t border-line bg-slate-50 p-4 sm:grid-cols-3 sm:p-6">
              <TextField label="Ancien email" value={contactDraft.currentEmail} onChange={(value) => setContactDraft((current) => ({ ...current, currentEmail: value }))} />
              <TextField label="Nouveau email" value={contactDraft.nextEmail} onChange={(value) => setContactDraft((current) => ({ ...current, nextEmail: value }))} />
              <TextField label="Nouveau numero" value={contactDraft.nextPhone} onChange={(value) => setContactDraft((current) => ({ ...current, nextPhone: value }))} />
              <div className="flex items-end sm:col-span-3">
                <button
                  type="button"
                  onClick={() => void requestConfirmation('contacts')}
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
            <button type="button" className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left text-sm font-black text-ink sm:px-6" aria-expanded={openSection === 'delete'} onClick={() => toggleSection('delete')}>
              Supprimer le compte
              <span className="shrink-0 text-xl leading-none text-red-500">{openSection === 'delete' ? '-' : '+'}</span>
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
                  onClick={() => void requestConfirmation('delete')}
                  className="h-11 w-full rounded-sm bg-red-600 px-5 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
                >
                  Confirmer
                </button>
              </div>
            </div>
            ) : null}
          </div>
        </Card>

        <Card className="p-0">
          <button type="button" onClick={() => void logout()} disabled={logoutStatus === 'signing_out'} className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-sm font-black text-ink transition hover:text-deepblue disabled:cursor-wait disabled:text-slate-500 sm:px-6">
            <PowerIcon />
            {logoutStatus === 'signing_out' ? 'Deconnexion...' : 'Se deconnecter'}
          </button>
        </Card>
      </section>

      <Footer />
      {confirmation ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 px-5">
          <div className="w-full max-w-[19rem] rounded-sm bg-white p-4">
            <h2 className="text-base font-black text-ink">Code de confirmation</h2>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Un code de confirmation vient d'etre envoye a {confirmation.email}. Entrez ce code pour valider l'action.
            </p>
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
                disabled={!confirmationInput.trim() || verificationStatus === 'verifying'}
                onClick={() => void validateConfirmation()}
                className="h-10 rounded-sm bg-deepblue text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {verificationStatus === 'verifying' ? 'Verification...' : 'Valider'}
              </button>
            </div>
            {verificationError ? <p className="mt-3 text-xs font-bold text-red-600">{verificationError}</p> : null}
          </div>
        </div>
      ) : null}
      {!confirmation && verificationError ? (
        <p className="fixed bottom-[calc(4.7rem+env(safe-area-inset-bottom)+0.75rem)] left-4 right-4 z-[70] mx-auto max-w-sm rounded-sm bg-red-50 px-4 py-3 text-sm font-bold text-red-700 sm:bottom-6">
          {verificationError}
        </p>
      ) : null}
    </main>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-sm border border-line bg-slate-50 p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-ink sm:text-base">{value}</p>
    </div>
  );
}

function CustomerAvatar({
  name,
  email,
  avatarDataUrl,
  onAvatarChange,
  onAvatarRemove,
}: {
  name: string;
  email: string;
  avatarDataUrl: string;
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onAvatarRemove: () => void;
}) {
  const initials = initialsFor(name, email);

  return (
    <div className="mx-auto grid justify-items-center gap-2 sm:mx-0">
      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-[#0b1724] text-xl font-black text-white ring-2 ring-white sm:h-24 sm:w-24 sm:text-2xl" aria-label="Avatar client">
        {avatarDataUrl ? (
          <img src={avatarDataUrl} alt="Avatar client" className="h-full w-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className="grid gap-1 text-center sm:text-left">
        <label className="cursor-pointer text-xs font-black text-deepblue">
          Modifier
          <input type="file" accept="image/*" className="sr-only" onChange={onAvatarChange} />
        </label>
        {avatarDataUrl ? (
          <button type="button" onClick={onAvatarRemove} className="text-xs font-bold text-slate-500">
            Retirer
          </button>
        ) : null}
      </div>
    </div>
  );
}

function initialsFor(name: string, email: string) {
  const source = name && name !== 'Non renseigne' ? name : emailName(email);
  const parts = source
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2);
  return initials.toUpperCase() || 'KD';
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

async function responseErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { message?: string | string[]; error?: string };
    const message = Array.isArray(payload.message) ? payload.message.join(' ') : payload.message;
    return message || payload.error || `${fallback} (${response.status})`;
  } catch {
    return `${fallback} (${response.status})`;
  }
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
