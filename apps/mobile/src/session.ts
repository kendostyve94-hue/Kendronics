import * as SecureStore from 'expo-secure-store';
import { AuthTokens } from './types';

const sessionKey = 'kendronics.mobile.session';

export async function readSession(): Promise<AuthTokens | null> {
  const raw = await SecureStore.getItemAsync(sessionKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    await clearSession();
    return null;
  }
}

export async function saveSession(tokens: AuthTokens) {
  await SecureStore.setItemAsync(sessionKey, JSON.stringify(tokens));
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(sessionKey);
}
