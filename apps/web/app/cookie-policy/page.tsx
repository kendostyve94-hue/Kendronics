import type { Metadata } from 'next';
import { LegalDocumentPage } from '../../components/legal/LegalDocumentPage';
import { cookieDocument } from '../../lib/legal-content';

export const metadata: Metadata = {
  title: 'Politique de cookies | Kendronics',
  description: 'Politique de cookies Kendronics pour connexion, preferences, mesure d audience, paiement et choix de consentement.',
};

export default function CookiePolicyPage() {
  return <LegalDocumentPage document={cookieDocument} />;
}
