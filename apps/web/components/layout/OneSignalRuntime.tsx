'use client';

import { useEffect } from 'react';
import { readAuthSession } from '../../lib/auth-session';

type OneSignalSdk = {
  init: (options: Record<string, unknown>) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  logout: () => Promise<void>;
  User?: {
    addTag?: (key: string, value: string) => Promise<void>;
  };
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalSdk) => void | Promise<void>>;
  }
}

let scriptPromise: Promise<void> | null = null;
let initialized = false;
let currentExternalId: string | null = null;

export function OneSignalRuntime() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId || typeof window === 'undefined' || !('Notification' in window)) return;

    let disposed = false;
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      if (!initialized) {
        await OneSignal.init({
          appId,
          serviceWorkerPath: '/OneSignalSDKWorker.js',
          allowLocalhostAsSecureOrigin: process.env.NODE_ENV !== 'production',
        });
        initialized = true;
      }
      if (!disposed) await syncOneSignalIdentity(OneSignal);
    });

    void loadOneSignalScript().catch(() => undefined);

    const handleAuthUpdate = () => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push((OneSignal) => syncOneSignalIdentity(OneSignal));
    };

    window.addEventListener('kendronics:auth-updated', handleAuthUpdate);
    return () => {
      disposed = true;
      window.removeEventListener('kendronics:auth-updated', handleAuthUpdate);
    };
  }, []);

  return null;
}

function loadOneSignalScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-kendronics-onesignal="true"]');
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    script.dataset.kendronicsOnesignal = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('OneSignal SDK failed to load.'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

async function syncOneSignalIdentity(OneSignal: OneSignalSdk): Promise<void> {
  const externalId = userIdFromSession();
  if (externalId && externalId !== currentExternalId) {
    await OneSignal.login(externalId);
    await OneSignal.User?.addTag?.('account', 'customer');
    currentExternalId = externalId;
    return;
  }

  if (!externalId && currentExternalId) {
    await OneSignal.logout();
    currentExternalId = null;
  }
}

function userIdFromSession(): string | null {
  const session = readAuthSession();
  if (!session?.accessToken) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(session.accessToken.split('.')[1] ?? '')) as { sub?: unknown };
    return typeof payload.sub === 'string' && payload.sub.trim() ? payload.sub : null;
  } catch {
    return null;
  }
}

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return atob(padded);
}
