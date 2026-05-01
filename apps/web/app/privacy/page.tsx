import type { Metadata } from 'next';
import { LegalDocumentPage } from '../../components/legal/LegalDocumentPage';
import { privacyDocument } from '../../lib/legal-content';

export const metadata: Metadata = {
  title: 'Politique de confidentialite | Kendronics',
  description: 'Politique de confidentialite pour compte, fichiers, commandes, paiements, cookies, conservation et droits utilisateur Kendronics.',
};

export default function PrivacyPage() {
  return <LegalDocumentPage document={privacyDocument} />;
}
