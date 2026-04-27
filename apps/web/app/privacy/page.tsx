import type { Metadata } from 'next';
import { LegalDocumentPage } from '../../components/legal/LegalDocumentPage';
import { privacyDocument } from '../../lib/legal-content';

export const metadata: Metadata = {
  title: 'Privacy Policy | Kendronics',
  description: 'Privacy policy for Kendronics account data, uploaded files, order data, payment providers, cookies, retention, and user rights.',
};

export default function PrivacyPage() {
  return <LegalDocumentPage document={privacyDocument} />;
}
