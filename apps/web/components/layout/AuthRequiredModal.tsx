'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { readAuthSession } from '../../lib/auth-session';

const publicPathPrefixes = [
  '/login',
  '/register',
  '/terms',
  '/privacy',
  '/cookie-policy',
  '/admin',
  '/api',
];

export function AuthRequiredModal() {
  const pathname = usePathname() || '/';
  const [isSignedIn, setIsSignedIn] = useState(true);
  const isPublicPath = useMemo(
    () => publicPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
    [pathname],
  );
  const shouldShow = !isPublicPath && !isSignedIn;

  useEffect(() => {
    function refreshSession() {
      setIsSignedIn(Boolean(readAuthSession()));
    }

    refreshSession();
    window.addEventListener('kendronics:auth-updated', refreshSession);
    window.addEventListener('storage', refreshSession);

    return () => {
      window.removeEventListener('kendronics:auth-updated', refreshSession);
      window.removeEventListener('storage', refreshSession);
    };
  }, []);

  useEffect(() => {
    if (!shouldShow) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shouldShow]);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] grid min-h-screen place-items-center bg-[#06101f]/70 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="auth-required-title">
      <div className="grid max-h-[calc(100vh-3rem)] w-full max-w-4xl overflow-y-auto border border-slate-200 bg-white text-ink sm:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden min-h-[460px] overflow-hidden bg-[#10233a] sm:block">
          <img
            src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85"
            alt="Carte electronique imprimee"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-[#071526]/62" />
          <div className="relative flex h-full flex-col justify-between p-8 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Kendronics</p>
              <h2 className="mt-5 max-w-xs text-3xl font-bold leading-tight tracking-normal" id="auth-required-title">
                Creez votre compte pour acceder a la plateforme.
              </h2>
            </div>
            <div className="grid gap-3 text-sm font-medium leading-6">
              <FeatureLine text="Devis PCB et suivi de commande" />
              <FeatureLine text="Paiement, livraison et historique securises" />
              <FeatureLine text="Support lie a votre compte client" />
            </div>
          </div>
        </div>

        <div className="flex min-h-[460px] flex-col justify-center px-5 py-7 sm:px-9">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f8f6b]">Compte requis</p>
          <h1 className="mt-3 text-2xl font-bold tracking-normal text-ink sm:text-[28px]">Bienvenue sur Kendronics</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Pour utiliser les fonctionnalites du site, creez d'abord votre compte ou connectez-vous si vous en avez deja un.
          </p>

          <div className="mt-6 grid gap-3">
            <a href="/register" className="flex h-11 items-center justify-center border border-[#0f8f6b] bg-[#0f8f6b] px-5 text-sm font-semibold text-white transition hover:bg-[#0b7558]">
              Creer un nouveau compte
            </a>
            <a href="/login" className="flex h-11 items-center justify-center border border-slate-300 bg-white px-5 text-sm font-semibold text-ink transition hover:border-[#0f8f6b] hover:text-[#0f8f6b]">
              Se connecter
            </a>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs font-medium text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            <span>ou continuer avec</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid gap-3">
            <SocialProviderLink provider="google" label="Continuer avec Google" href={process.env.NEXT_PUBLIC_GOOGLE_OAUTH_URL} />
            <SocialProviderLink provider="apple" label="Continuer avec Apple" href={process.env.NEXT_PUBLIC_APPLE_OAUTH_URL} />
          </div>

          <p className="mt-6 text-xs leading-5 text-slate-500">
            En creant un compte, vous acceptez nos <a href="/terms" className="font-semibold text-[#0f8f6b] underline">conditions d'utilisation</a> et notre{' '}
            <a href="/privacy" className="font-semibold text-[#0f8f6b] underline">politique de confidentialite</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureLine({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-3">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white/70 text-[9px] font-semibold">OK</span>
      <span>{text}</span>
    </p>
  );
}

function SocialProviderLink({ provider, label, href }: { provider: 'google' | 'apple'; label: string; href?: string }) {
  const content = (
    <>
      {provider === 'google' ? <GoogleLogo /> : <AppleLogo />}
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} className="flex h-10 items-center justify-center gap-3 border border-slate-300 bg-white px-4 text-sm font-semibold text-ink transition hover:border-[#0f8f6b] hover:text-[#0f8f6b]">
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled
      className="flex h-10 cursor-not-allowed items-center justify-center gap-3 border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-400"
    >
      {content}
    </button>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v2.9h3.8c2.2-2.1 3.6-5.1 3.6-8.6z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-3l-3.8-2.9a7.1 7.1 0 0 1-10.6-3.7H1.6v3A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.5 14.4a7.2 7.2 0 0 1 0-4.6v-3H1.6a12 12 0 0 0 0 10.6l3.9-3z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8L20 3.2A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.6 6.7l3.9 3A7.1 7.1 0 0 1 12 4.8z" />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current">
      <path d="M16.5 1.5c0 1.2-.5 2.3-1.3 3.2-.9 1-2.1 1.6-3.2 1.5-.1-1.2.4-2.4 1.2-3.3.9-.9 2.2-1.5 3.3-1.4zM20.5 17.4c-.4.9-.7 1.3-1.2 2.1-.8 1.2-1.9 2.8-3.3 2.8-1.2 0-1.5-.8-3.2-.8s-2.1.8-3.2.8c-1.4 0-2.5-1.5-3.3-2.7-2.3-3.5-2.5-7.6-1.1-9.8 1-1.5 2.5-2.4 4-2.4s2.5.8 3.7.8 2-.8 3.8-.8c1.3 0 2.7.7 3.7 2a4 4 0 0 0-2.2 3.6 4.2 4.2 0 0 0 2.3 4.4z" />
    </svg>
  );
}
