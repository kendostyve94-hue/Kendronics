import type { Metadata } from 'next';
import { LanguageRuntime } from '../components/layout/LanguageRuntime';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kendronics',
  description:
    'Plateforme de commande PCB, paiement, coordination et logistique pour les ingenieurs, etudiants et startups en Afrique.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <LanguageRuntime />
        {children}
      </body>
    </html>
  );
}
