import { AuthTokens } from './auth-contract';

const SESSION_STORAGE_KEY = 'kendronics.auth.session';

export interface StoredAuthSession extends AuthTokens {
  issuedAt: string;
  accessTokenExpiresAt: string;
}

export function persistAuthSession(tokens: AuthTokens) {
  if (typeof window === 'undefined') return;

  const issuedAt = new Date();
  const session: StoredAuthSession = {
    ...tokens,
    issuedAt: issuedAt.toISOString(),
    accessTokenExpiresAt: new Date(issuedAt.getTime() + tokens.expiresIn * 1000).toISOString(),
  };

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function readAuthSession(): StoredAuthSession | null {
  if (typeof window === 'undefined') return null;

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession) as StoredAuthSession;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
