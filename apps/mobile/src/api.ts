import { apiBaseUrl } from './config';
import { clearSession, readSession, saveSession } from './session';
import { AuthTokens, ExplorerProject, Order, QuotePreview, RecentProductionItem, UserProfile } from './types';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  authenticated?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = options.authenticated ? await readSession() : null;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(session ? { Authorization: `${session.tokenType} ${session.accessToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && session?.refreshToken) {
    const refreshed = await refreshSession(session.refreshToken);
    if (refreshed) return apiRequest<T>(path, options);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { message?: string | string[] };
    const message = Array.isArray(payload.message) ? payload.message.join(' ') : payload.message;
    throw new Error(message || `Requete refusee (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function login(contact: string, password: string) {
  const tokens = await apiRequest<AuthTokens>('/api/auth/login', {
    method: 'POST',
    body: { email: contact, contact, password },
  });
  await saveSession(tokens);
  return tokens;
}

export async function refreshSession(refreshToken: string) {
  try {
    const tokens = await apiRequest<AuthTokens>('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
    await saveSession(tokens);
    return tokens;
  } catch {
    await clearSession();
    return null;
  }
}

export async function loadMe() {
  return apiRequest<UserProfile>('/api/users/me', { authenticated: true });
}

export async function loadExplorerProjects() {
  return apiRequest<ExplorerProject[]>('/api/explorer/projects');
}

export async function loadRecentProduction() {
  const payload = await apiRequest<{ items: RecentProductionItem[] }>('/api/home/recent-production?limit=6');
  return payload.items;
}

export async function loadOrders() {
  return apiRequest<Order[]>('/api/orders', { authenticated: true });
}

export async function loadMyProjects() {
  return apiRequest<ExplorerProject[]>('/api/explorer/me/projects?includeHidden=true', { authenticated: true });
}

export async function loadMyFavorites() {
  return apiRequest<ExplorerProject[]>('/api/explorer/me/favorites', { authenticated: true });
}

export async function loadMyPurchases() {
  return apiRequest<unknown[]>('/api/explorer/me/purchases', { authenticated: true });
}

export async function previewQuote(input: {
  productType: string;
  layers: number;
  lengthMm: number;
  widthMm: number;
  quantity: number;
  destinationCountryIso2: string;
  shippingMode: 'economy' | 'standard' | 'express';
}) {
  return apiRequest<QuotePreview>('/api/pricing/preview', {
    method: 'POST',
    body: input,
  });
}

export async function toggleProjectLike(projectId: string) {
  return apiRequest<{ liked: boolean; likesCount: number }>(`/api/explorer/projects/${projectId}/likes`, {
    method: 'POST',
    authenticated: true,
  });
}
