import type { Metadata } from 'next';
import { LegalDocumentPage } from '../../components/legal/LegalDocumentPage';
import { refundDocument } from '../../lib/legal-content';

export const metadata: Metadata = {
  title: 'Refund Policy | Kendronics',
  description: 'Refund review policy for Kendronics orders, manufacturing status, file errors, failed payments, and delivery issues.',
};

export default function RefundPolicyPage() {
  return <LegalDocumentPage document={refundDocument} />;
}
