import type { Metadata } from 'next';
import { LegalDocumentPage } from '../../components/legal/LegalDocumentPage';
import { termsDocument } from '../../lib/legal-content';

export const metadata: Metadata = {
  title: 'Conditions generales | Kendronics',
  description: 'Conditions d utilisation de Kendronics pour commande PCB, paiement, logistique, suivi et support.',
};

export default function TermsPage() {
  return <LegalDocumentPage document={termsDocument} />;
}
