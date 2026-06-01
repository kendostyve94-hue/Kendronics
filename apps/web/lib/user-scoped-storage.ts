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
  return safeLocalStorageGet(key);
}

export function writeScopedLocalStorage(baseKey: string, value: string) {
  const key = scopedStorageKey(baseKey);
  if (!key) return;
  safeLocalStorageSet(key, value);
  safeLocalStorageRemove(baseKey);
}

export function removeScopedLocalStorage(baseKey: string) {
  const key = scopedStorageKey(baseKey);
  if (key) safeLocalStorageRemove(key);
  safeLocalStorageRemove(baseKey);
}

export function purgeLegacySensitiveStorage() {
  if (typeof window === 'undefined') return;
  for (const key of legacySensitiveKeys) {
    safeLocalStorageRemove(key);
  }
}

function safeLocalStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeLocalStorageRemove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Safari privacy modes can throw for Web Storage access.
  }
}
