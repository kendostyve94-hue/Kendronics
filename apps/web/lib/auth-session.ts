import { AuthTokens } from './auth-contract';
import { getApiBaseUrl } from './api-base-url';

const SESSION_STORAGE_KEY = 'kendronics.auth.session';
let refreshInFlight: Promise<StoredAuthSession | null> | null = null;

export interface StoredAuthSession extends AuthTokens {
  issuedAt: string;
  accessTokenExpiresAt: string;
}

export function persistAuthSession(tokens: AuthTokens, _options: { remember?: boolean } = {}) {
  if (typeof window === 'undefined') return;

  const issuedAt = new Date();
  const session: StoredAuthSession = {
    ...tokens,
    issuedAt: issuedAt.toISOString(),
    accessTokenExpiresAt: new Date(issuedAt.getTime() + tokens.expiresIn * 1000).toISOString(),
  };

  const serializedSession = JSON.stringify(session);
  safeStorageRemove('sessionStorage', SESSION_STORAGE_KEY);
  if (!safeStorageSet('localStorage', SESSION_STORAGE_KEY, serializedSession)) {
    safeStorageSet('sessionStorage', SESSION_STORAGE_KEY, serializedSession);
  }
  window.dispatchEvent(new Event('kendronics:auth-updated'));
}

export function readAuthSession(): StoredAuthSession | null {
  if (typeof window === 'undefined') return null;

  const localSession = safeStorageGet('localStorage', SESSION_STORAGE_KEY);
  const storage: 'localStorage' | 'sessionStorage' = localSession ? 'localStorage' : 'sessionStorage';
  const rawSession = localSession ?? safeStorageGet('sessionStorage', SESSION_STORAGE_KEY);
  if (!rawSession) return null;

  try {
    const session = JSON.parse(rawSession) as StoredAuthSession;
    if (storage === 'sessionStorage') {
      if (safeStorageSet('localStorage', SESSION_STORAGE_KEY, rawSession)) {
        safeStorageRemove('sessionStorage', SESSION_STORAGE_KEY);
      }
    }
    return session;
  } catch {
    safeStorageRemove('localStorage', SESSION_STORAGE_KEY);
    safeStorageRemove('sessionStorage', SESSION_STORAGE_KEY);
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  safeStorageRemove('localStorage', SESSION_STORAGE_KEY);
  safeStorageRemove('sessionStorage', SESSION_STORAGE_KEY);
  window.dispatchEvent(new Event('kendronics:auth-updated'));
}

export async function revokeAuthSession() {
  const session = readAuthSession();
  if (session?.refreshToken) {
    try {
      await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
        method: 'POST',
        keepalive: true,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
    } catch {
      // Local logout must still complete even if the network is unavailable.
    }
  }

  clearAuthSession();
}

export async function readFreshAuthSession(): Promise<StoredAuthSession | null> {
  const session = readAuthSession();
  if (!session) return null;

  const expiresAt = new Date(session.accessTokenExpiresAt).getTime();
  const refreshBeforeMs = 60 * 1000;
  if (Number.isFinite(expiresAt) && expiresAt - Date.now() > refreshBeforeMs) {
    return session;
  }

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = refreshAuthSession(session);
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function refreshAuthSession(session: StoredAuthSession): Promise<StoredAuthSession | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });

    if (!response.ok) {
      clearAuthSessionIfCurrent(session.refreshToken);
      return null;
    }

    const tokens = (await response.json()) as AuthTokens;
    persistAuthSession(tokens);
    return readAuthSession();
  } catch {
    clearAuthSessionIfCurrent(session.refreshToken);
    return null;
  }
}

function clearAuthSessionIfCurrent(refreshToken: string) {
  const current = readAuthSession();
  if (!current || current.refreshToken === refreshToken) {
    clearAuthSession();
  }
}

function safeStorageGet(storageName: 'localStorage' | 'sessionStorage', key: string): string | null {
  try {
    return window[storageName].getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(storageName: 'localStorage' | 'sessionStorage', key: string, value: string): boolean {
  try {
    window[storageName].setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeStorageRemove(storageName: 'localStorage' | 'sessionStorage', key: string) {
  try {
    window[storageName].removeItem(key);
  } catch {
    // Some Safari privacy contexts throw for Web Storage access.
  }
}
