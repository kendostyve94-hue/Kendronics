import { AuthTokens } from './auth-contract';
import { getApiBaseUrl } from './api-base-url';

const SESSION_STORAGE_KEY = 'kendronics.auth.session';

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
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  window.localStorage.setItem(SESSION_STORAGE_KEY, serializedSession);
}

export function readAuthSession(): StoredAuthSession | null {
  if (typeof window === 'undefined') return null;

  const storage = window.localStorage.getItem(SESSION_STORAGE_KEY) ? window.localStorage : window.sessionStorage;
  const rawSession = storage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) return null;

  try {
    const session = JSON.parse(rawSession) as StoredAuthSession;
    if (storage === window.sessionStorage) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, rawSession);
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
    return session;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  window.dispatchEvent(new Event('kendronics:auth-updated'));
}

export async function revokeAuthSession() {
  const session = readAuthSession();
  if (session?.refreshToken) {
    try {
      await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
        method: 'POST',
        keepalive: true,
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

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });

    if (!response.ok) {
      clearAuthSession();
      return null;
    }

    const tokens = (await response.json()) as AuthTokens;
    persistAuthSession(tokens);
    return readAuthSession();
  } catch {
    clearAuthSession();
    return null;
  }
}
