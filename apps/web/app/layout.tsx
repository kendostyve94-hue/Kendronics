import type { Metadata } from 'next';
import { CookieConsentBanner } from '../components/layout/CookieConsentBanner';
import { LanguageRuntime } from '../components/layout/LanguageRuntime';
import './globals.css';

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
    icon: '/images/kendronics-icon.png',
    shortcut: '/images/kendronics-icon.png',
    apple: '/images/kendronics-icon.png',
  },
  openGraph: {
    title: 'Kendronics Devis PCB en ligne',
    description:
      'Plateforme de devis PCB, paiement, coordination et logistique internationale pour commandes PCB vers l’Afrique.',
    url: '/',
    siteName: 'Kendronics',
    images: [
      {
        url: '/images/kendronics-icon.png',
        width: 1307,
        height: 1203,
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
        <LanguageRuntime />
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
