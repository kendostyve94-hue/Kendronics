'use client';

import { useEffect, useState } from 'react';

const consentStorageKey = 'kendronics.cookie.consent.v1';

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
    const savedConsent = window.localStorage.getItem(consentStorageKey);
    setIsVisible(!savedConsent);
    setIsReady(true);
  }, []);

  function saveConsent(nextConsent: CookieConsent) {
    const consent = {
      ...nextConsent,
      necessary: true as const,
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(consentStorageKey, JSON.stringify(consent));
    window.dispatchEvent(new CustomEvent('kendronics:cookie-consent-updated', { detail: consent }));
    setIsVisible(false);
    setIsCustomizing(false);
  }

  if (!isReady || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-[4.75rem] z-[70] px-3 pb-3 lg:bottom-0 lg:px-6 lg:pb-6">
      <div className="mx-auto max-w-[1120px] border border-[#b8c9d9] bg-white p-4 text-[#0b1724] sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#0f8f6b]">Cookies</p>
            <h2 className="mt-2 text-lg font-semibold">Gestion des cookies Kendronics</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Nous utilisons les cookies necessaires au fonctionnement du site. Les cookies de mesure d’audience et de preferences sont actives uniquement avec votre accord.
            </p>
            <a href="/terms/politique-cookies" className="mt-2 inline-flex text-sm text-blue-600 underline-offset-4 hover:text-blue-700 hover:underline">
              Politique de cookies
            </a>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <button
              type="button"
              className="h-10 border border-[#0f8f6b] bg-[#0f8f6b] px-4 text-sm font-semibold text-white transition hover:bg-[#0b7558]"
              onClick={() => saveConsent({ ...defaultConsent, analytics: true, preferences: true })}
            >
              Accepter
            </button>
            <button
              type="button"
              className="h-10 border border-[#b8c9d9] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[#0f8f6b] hover:text-[#0f8f6b]"
              onClick={() => saveConsent(defaultConsent)}
            >
              Refuser
            </button>
            <button
              type="button"
              className="h-10 border border-[#b8c9d9] bg-[#eef6fb] px-4 text-sm font-semibold text-slate-700 transition hover:border-[#0f8f6b] hover:text-[#0f8f6b]"
              onClick={() => setIsCustomizing((current) => !current)}
            >
              Personnaliser
            </button>
          </div>
        </div>

        {isCustomizing ? (
          <div className="mt-4 grid gap-3 border-t border-[#b8c9d9] pt-4 sm:grid-cols-3">
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
            <div className="sm:col-span-3">
              <button
                type="button"
                className="h-10 border border-[#0f8f6b] bg-[#0f8f6b] px-4 text-sm font-semibold text-white transition hover:bg-[#0b7558]"
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
