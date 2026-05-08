'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { getApiBaseUrl } from '../../lib/api-base-url';
import { authApiContract } from '../../lib/auth-contract';

export default function ResetPasswordPage() {
  const apiBaseUrl = getApiBaseUrl();
  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('token') ?? '';
  }, []);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!token) {
      setMessage('Lien de reinitialisation manquant.');
      return;
    }
    if (password.length < 8) {
      setMessage('Le mot de passe doit contenir au moins 8 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    setStatus('submitting');
    try {
      const response = await fetch(`${apiBaseUrl}${authApiContract.resetPassword.path}`, {
        method: authApiContract.resetPassword.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        throw new Error('Reset failed');
      }

      setStatus('success');
      setMessage('Votre mot de passe a ete mis a jour. Vous pouvez vous connecter.');
    } catch {
      setStatus('idle');
      setMessage(authApiContract.resetPassword.failureMessage);
    }
  }

  return (
    <main className="min-h-screen bg-cloud">
      <Navbar />
      <section className="mx-auto max-w-md px-4 pb-12 pt-28">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-ink">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Compte Kendronics</p>
          <h1 className="mt-3 text-2xl font-black">Nouveau mot de passe</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Definissez un mot de passe fort pour retrouver l'acces a votre espace.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <PasswordField label="Nouveau mot de passe" value={password} onChange={setPassword} />
            <PasswordField label="Confirmer le mot de passe" value={confirmation} onChange={setConfirmation} />

            {message ? (
              <div
                className={`rounded-xl border p-3 text-sm font-bold ${
                  status === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={status === 'submitting' || status === 'success'}
              className="h-11 w-full rounded-xl bg-deepblue text-sm font-black text-white disabled:opacity-60"
            >
              {status === 'submitting' ? 'Mise a jour...' : 'Mettre a jour'}
            </button>
            <a
              href="/login"
              className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700"
            >
              Retour a la connexion
            </a>
          </form>
        </div>
      </section>
    </main>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="new-password"
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
      />
    </label>
  );
}
