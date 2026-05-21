import { readAuthSession } from './auth-session';

const legacySensitiveKeys = [
  'kendronics.customer.profile',
  'kendronics.customer.avatar',
  'kendronics.customer.orders',
  'kendronics.community.posts',
  'kendronics.community.likes',
  'kendronics.community.follows',
];

export function currentUserStorageSuffix(): string | null {
  if (typeof window === 'undefined') return null;
  const session = readAuthSession();
  if (!session?.accessToken) return null;

  try {
    const payload = JSON.parse(window.atob(session.accessToken.split('.')[1] ?? '')) as { sub?: string; email?: string };
    return payload.sub || payload.email?.toLowerCase() || null;
  } catch {
    return null;
  }
}

export function scopedStorageKey(baseKey: string): string | null {
  const suffix = currentUserStorageSuffix();
  return suffix ? `${baseKey}:${suffix}` : null;
}

export function readScopedLocalStorage(baseKey: string): string | null {
  const key = scopedStorageKey(baseKey);
  if (!key) return null;
  return window.localStorage.getItem(key);
}

export function writeScopedLocalStorage(baseKey: string, value: string) {
  const key = scopedStorageKey(baseKey);
  if (!key) return;
  window.localStorage.setItem(key, value);
  window.localStorage.removeItem(baseKey);
}

export function removeScopedLocalStorage(baseKey: string) {
  const key = scopedStorageKey(baseKey);
  if (key) window.localStorage.removeItem(key);
  window.localStorage.removeItem(baseKey);
}

export function purgeLegacySensitiveStorage() {
  if (typeof window === 'undefined') return;
  for (const key of legacySensitiveKeys) {
    window.localStorage.removeItem(key);
  }
}
