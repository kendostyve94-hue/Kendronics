import type { Metadata } from 'next';
import { LegalDocumentPage } from '../../components/legal/LegalDocumentPage';
import { refundDocument } from '../../lib/legal-content';

export const metadata: Metadata = {
  title: 'Politique de remboursement | Kendronics',
  description: 'Politique de remboursement Kendronics pour commandes, fabrication, fichiers, paiements echoues et livraison.',
};

export default function RefundPolicyPage() {
  return <LegalDocumentPage document={refundDocument} />;
}
