import type { Metadata } from 'next';
import { LegalDocumentPage } from '../../components/legal/LegalDocumentPage';
import { termsDocument } from '../../lib/legal-content';

export const metadata: Metadata = {
  title: 'Terms and Conditions | Kendronics',
  description: 'Terms for using Kendronics as an intermediary PCB ordering, payment, logistics, tracking, and support platform.',
};

export default function TermsPage() {
  return <LegalDocumentPage document={termsDocument} />;
}
