import type { Metadata } from 'next';
import { LegalDocumentPage } from '../../components/legal/LegalDocumentPage';
import { cookieDocument } from '../../lib/legal-content';

export const metadata: Metadata = {
  title: 'Cookie Policy | Kendronics',
  description: 'Cookie policy for Kendronics authentication, preferences, analytics, payment providers, and cookie controls.',
};

export default function CookiePolicyPage() {
  return <LegalDocumentPage document={cookieDocument} />;
}
