import { apiBaseUrl } from './config';
import { clearSession, readSession, saveSession } from './session';
import { AuthTokens, ExplorerProject, Order, ProjectDetail, PublicAuthorProfile, QuotePreview, RecentProductionItem, TrackingTimeline, UserProfile } from './types';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
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

export async function registerAccount(input: { fullName: string; email: string; password: string; country: string; username: string }) {
  const tokens = await apiRequest<AuthTokens>('/api/auth/register', {
    method: 'POST',
    body: {
      email: input.email,
      contactMethod: 'email',
      password: input.password,
      fullName: input.fullName,
      profile: { username: input.username, country: input.country, accountType: 'individual' },
    },
  });
  await saveSession(tokens);
  return tokens;
}

export async function requestPasswordReset(email: string) {
  return apiRequest<{ ok?: boolean }>('/api/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export async function resetPassword(token: string, password: string) {
  return apiRequest<{ ok?: boolean }>('/api/auth/reset-password', {
    method: 'POST',
    body: { token, password },
  });
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

export async function loadOrderDetail(orderId: string) {
  return apiRequest<Order>(`/api/orders/${orderId}`, { authenticated: true });
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

export async function loadNotifications() {
  return apiRequest<Array<{ id: string; title?: string; body?: string; readAt?: string | null; createdAt?: string }>>('/api/notifications', { authenticated: true });
}

export async function loadProjectDetail(projectId: string) {
  return apiRequest<ProjectDetail>(`/api/explorer/projects/${projectId}`);
}

export async function loadPublicAuthorProfile(userId: string) {
  return apiRequest<PublicAuthorProfile>(`/api/explorer/users/${userId}/profile`, { authenticated: true });
}

export async function followUser(userId: string) {
  return apiRequest<{ following: boolean; followersCount?: number }>(`/api/users/${userId}/follow`, { method: 'POST', authenticated: true });
}

export async function toggleProjectFavorite(projectId: string) {
  return apiRequest<{ favorited: boolean; favoritesCount: number }>(`/api/explorer/projects/${projectId}/favorites`, { method: 'POST', authenticated: true });
}

export async function createProjectComment(projectId: string, body: string) {
  return apiRequest<{ id?: string; commentsCount?: number }>(`/api/explorer/projects/${projectId}/comments`, { method: 'POST', body: { body } });
}

export async function createProjectDraft(projectType: 'free' | 'paid') {
  return apiRequest<ProjectDetail>('/api/explorer/projects/drafts', { method: 'POST', authenticated: true, body: { projectType } });
}

export async function updateProject(projectId: string, input: { title: string; category: string; summary: string; description: string; projectType: 'free' | 'paid'; repositoryUrl?: string; priceCents?: number; currency?: string }) {
  return apiRequest<ProjectDetail>(`/api/explorer/projects/${projectId}`, { method: 'PATCH', authenticated: true, body: input });
}

export async function publishProject(projectId: string) {
  return apiRequest<ProjectDetail>(`/api/explorer/projects/${projectId}/publish`, { method: 'POST', authenticated: true });
}

export async function lookupTracking(orderId: string, email: string) {
  return apiRequest<TrackingTimeline>('/api/tracking/lookup', { method: 'POST', body: { orderId, email } });
}

export async function sendPublicContact(input: { name: string; email: string; category: string; message: string }) {
  return apiRequest<{ id?: string }>('/api/support/contact', { method: 'POST', body: input });
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
