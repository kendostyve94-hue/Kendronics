import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kendronics | Commandes PCB et logistique pour l Afrique',
  description:
    'Plateforme de commande PCB, paiement, coordination et logistique pour les ingenieurs, etudiants et startups en Afrique.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
