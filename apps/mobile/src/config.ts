import Constants from 'expo-constants';

const configuredBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined);

export const apiBaseUrl = (configuredBaseUrl || 'https://kendronics-api.onrender.com').replace(/\/+$/, '');

export function mediaUrl(value?: string) {
  if (!value) return '';
  return value.startsWith('/api/') ? `${apiBaseUrl}${value}` : value;
}
