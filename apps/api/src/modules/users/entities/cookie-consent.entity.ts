export interface CookieConsent {
  id: string;
  userId: string;
  version: string;
  necessary: true;
  analytics: boolean;
  preferences: boolean;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}
