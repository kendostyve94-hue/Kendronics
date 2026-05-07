import type { Metadata } from 'next';
import { CookieConsentBanner } from '../components/layout/CookieConsentBanner';
import { LanguageRuntime } from '../components/layout/LanguageRuntime';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kendronics Devis PCB en ligne',
  description:
    'Plateforme de commande PCB, paiement, coordination et logistique pour les ingénieurs, étudiants et startups en Afrique.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <LanguageRuntime />
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
