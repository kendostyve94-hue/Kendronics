import type { Metadata } from 'next';
import { LegalDocumentPage } from '../../components/legal/LegalDocumentPage';
import { termsDocument } from '../../lib/legal-content';

export const metadata: Metadata = {
  title: 'Cadre légal | Kendronics',
  description: 'Cadre légal Kendronics pour commande PCB, paiement, logistique, suivi, confidentialité et support.',
};

export default function TermsPage() {
  return <LegalDocumentPage document={termsDocument} />;
}
