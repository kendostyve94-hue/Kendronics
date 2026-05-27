import type { Metadata } from 'next';
import { LegalDocumentPage } from '../../components/legal/LegalDocumentPage';
import { termsDocument } from '../../lib/legal-content';

export const metadata: Metadata = {
  title: 'Cadre legal | Kendronics',
  description: 'Cadre legal Kendronics pour commande PCB, paiement, logistique, suivi, confidentialite et support.',
};

export default function TermsPage() {
  return <LegalDocumentPage document={termsDocument} />;
}
