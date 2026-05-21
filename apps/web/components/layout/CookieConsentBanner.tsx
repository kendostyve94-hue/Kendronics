'use client';

import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../../lib/api-base-url';
import { readFreshAuthSession } from '../../lib/auth-session';

const consentStorageKey = 'kendronics.cookie.consent.v1';
const consentVersion = '2026-05-07';

type CookieConsent = {
  necessary: true;
  analytics: boolean;
  preferences: boolean;
  updatedAt: string;
};

const defaultConsent: CookieConsent = {
  necessary: true,
  analytics: false,
  preferences: false,
  updatedAt: '',
};

export function CookieConsentBanner() {
  const [isReady, setIsReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [draftConsent, setDraftConsent] = useState<CookieConsent>(defaultConsent);

  useEffect(() => {
    let cancelled = false;

    async function hydrateConsent() {
      if (window.location.pathname.startsWith('/admin')) {
        setIsVisible(false);
        setIsReady(true);
        return;
      }

      const savedConsent = readLocalConsent();
      if (savedConsent) {
        setDraftConsent(savedConsent);
        setIsVisible(false);
        setIsReady(true);
        void syncServerConsent(savedConsent);
        return;
      }

      setIsVisible(true);
      setIsReady(true);

      const serverConsent = await readServerConsent();

      if (cancelled || !serverConsent) return;

      persistLocalConsent(serverConsent);
      setDraftConsent(serverConsent);
      setIsVisible(false);
    }

    void hydrateConsent();
    window.addEventListener('kendronics:auth-updated', hydrateConsent);

    return () => {
      cancelled = true;
      window.removeEventListener('kendronics:auth-updated', hydrateConsent);
    };
  }, []);

  function saveConsent(nextConsent: CookieConsent) {
    const consent = {
      ...nextConsent,
      necessary: true as const,
      updatedAt: new Date().toISOString(),
    };

    persistLocalConsent(consent);
    window.dispatchEvent(new CustomEvent('kendronics:cookie-consent-updated', { detail: consent }));
    setIsVisible(false);
    setIsCustomizing(false);
    void syncServerConsent(consent);
  }

  if (!isReady || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="mx-auto max-h-[58vh] max-w-4xl overflow-y-auto border border-[#b8c9d9] bg-white p-4 text-[#0b1724] sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 md:max-w-2xl">
            <p className="text-xs uppercase tracking-[0.16em] text-[#0f8f6b]">Cookies</p>
            <h2 className="mt-2 text-lg font-semibold">Gestion des cookies Kendronics</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Nous utilisons les cookies necessaires au fonctionnement du site. Les cookies de mesure d’audience et de preferences sont actives uniquement avec votre accord.
            </p>
            <a href="/terms/politique-cookies" className="mt-2 inline-flex text-sm text-blue-600 underline-offset-4 hover:text-blue-700 hover:underline">
              Politique de cookies
            </a>
          </div>

          <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-3 md:w-44 md:grid-cols-1">
            <button
              type="button"
              className="h-10 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap border border-[#0f8f6b] bg-[#0f8f6b] px-4 text-sm font-semibold text-white transition hover:bg-[#0b7558]"
              onClick={() => saveConsent({ ...defaultConsent, analytics: true, preferences: true })}
            >
              Accepter
            </button>
            <button
              type="button"
              className="h-10 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap border border-[#b8c9d9] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[#0f8f6b] hover:text-[#0f8f6b]"
              onClick={() => saveConsent(defaultConsent)}
            >
              Refuser
            </button>
            <button
              type="button"
              className="h-10 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap border border-[#b8c9d9] bg-[#eef6fb] px-4 text-sm font-semibold text-slate-700 transition hover:border-[#0f8f6b] hover:text-[#0f8f6b]"
              onClick={() => setIsCustomizing((current) => !current)}
            >
              Personnaliser
            </button>
          </div>
        </div>

        {isCustomizing ? (
          <div className="mt-4 grid gap-3 border-t border-[#b8c9d9] pt-4 md:grid-cols-3">
            <CookieChoice label="Necessaires" checked disabled description="Connexion, panier, securite et fonctionnement du site." />
            <CookieChoice
              label="Mesure d’audience"
              checked={draftConsent.analytics}
              description="Statistiques de visite et amelioration du service."
              onChange={(checked) => setDraftConsent((current) => ({ ...current, analytics: checked }))}
            />
            <CookieChoice
              label="Preferences"
              checked={draftConsent.preferences}
              description="Langue et choix d’interface."
              onChange={(checked) => setDraftConsent((current) => ({ ...current, preferences: checked }))}
            />
            <div className="md:col-span-3">
              <button
                type="button"
                className="h-10 w-full border border-[#0f8f6b] bg-[#0f8f6b] px-4 text-sm font-semibold text-white transition hover:bg-[#0b7558] sm:w-auto"
                onClick={() => saveConsent(draftConsent)}
              >
                Enregistrer mes choix
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function readLocalConsent(): CookieConsent | null {
  const rawConsent = window.localStorage.getItem(consentStorageKey);
  if (!rawConsent) return null;

  try {
    const parsed = JSON.parse(rawConsent) as Partial<CookieConsent>;
    if (parsed.necessary !== true || typeof parsed.analytics !== 'boolean' || typeof parsed.preferences !== 'boolean') {
      return null;
    }

    return {
      necessary: true,
      analytics: parsed.analytics,
      preferences: parsed.preferences,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    window.localStorage.removeItem(consentStorageKey);
    return null;
  }
}

function persistLocalConsent(consent: CookieConsent) {
  window.localStorage.setItem(
    consentStorageKey,
    JSON.stringify({
      ...consent,
      necessary: true,
      updatedAt: consent.updatedAt || new Date().toISOString(),
    }),
  );
}

async function readServerConsent(): Promise<CookieConsent | null> {
  const session = await readFreshAuthSession();
  if (!session) return null;

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/users/me/cookie-consent`, {
      headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
      cache: 'no-store',
    });

    if (!response.ok || response.status === 204) return null;
    const payload = (await response.json()) as Partial<CookieConsent> | null;
    if (!payload || typeof payload.analytics !== 'boolean' || typeof payload.preferences !== 'boolean') {
      return null;
    }

    return {
      necessary: true,
      analytics: payload.analytics,
      preferences: payload.preferences,
      updatedAt: payload.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function syncServerConsent(consent: CookieConsent) {
  const session = await readFreshAuthSession();
  if (!session) return;

  try {
    await fetch(`${getApiBaseUrl()}/api/users/me/cookie-consent`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${session.tokenType} ${session.accessToken}`,
      },
      body: JSON.stringify({
        version: consentVersion,
        analytics: consent.analytics,
        preferences: consent.preferences,
      }),
    });
  } catch {
    // Local consent remains the source of truth until the API is available again.
  }
}

function CookieChoice({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-24 gap-3 border border-[#b8c9d9] bg-white p-3">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span>
      </span>
    </label>
  );
}
