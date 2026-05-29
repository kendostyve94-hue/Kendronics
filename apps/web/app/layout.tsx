import type { Metadata, Viewport } from 'next';
import { AuthRequiredModal } from '../components/layout/AuthRequiredModal';
import { CookieConsentBanner } from '../components/layout/CookieConsentBanner';
import { LanguageRuntime } from '../components/layout/LanguageRuntime';
import { OneSignalRuntime } from '../components/layout/OneSignalRuntime';
import { ViewportScaleRuntime } from '../components/layout/ViewportScaleRuntime';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://kendronics.com'),
  title: {
    default: 'Kendronics Devis PCB en ligne',
    template: '%s | Kendronics',
  },
  description:
    'Plateforme de devis PCB, commande de circuits imprimes, paiement, coordination et logistique internationale pour les ingenieurs, etudiants et startups en Afrique.',
  keywords: [
    'Kendronics',
    'devis PCB',
    'commande PCB',
    'fabrication PCB Afrique',
    'Gerber',
    'circuit imprime',
    'PCB prototype',
  ],
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/images/kendronics-google-favicon.png',
    shortcut: '/images/kendronics-google-favicon.png',
    apple: '/images/kendronics-google-favicon.png',
  },
  openGraph: {
    title: 'Kendronics Devis PCB en ligne',
    description:
      'Plateforme de devis PCB, paiement, coordination et logistique internationale pour commandes PCB vers l’Afrique.',
    url: '/',
    siteName: 'Kendronics',
    images: [
      {
        url: '/images/kendronics-google-favicon.png',
        width: 512,
        height: 512,
        alt: 'Kendronics',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <LanguageRuntime>
          <ViewportScaleRuntime />
          <OneSignalRuntime />
          {children}
          <AuthRequiredModal />
          <CookieConsentBanner />
        </LanguageRuntime>
      </body>
    </html>
  );
}
