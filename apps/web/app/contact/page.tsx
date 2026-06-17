'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import {
  contactCategories,
  contactCategoryLabels,
  supportTicketApiContract,
  validateContactForm,
} from '../../lib/contact-contract';
import { getApiBaseUrl } from '../../lib/api-base-url';
import { officialContactEmail } from '../../lib/official-contact';
import type {
  ContactFormErrors,
  ContactFormState,
  CreatePublicSupportTicketRequest,
  SupportTicketResponse,
} from '../../lib/contact-contract';

type SubmitState = 'idle' | 'submitting' | 'submitted' | 'error';

const heroImage = '/images/contact-support-hero.jpg';

const apiBaseUrl = getApiBaseUrl();
const whatsAppPhoneDisplay = '+33 07 970 427';
const whatsAppPhoneDigits = '3307970427';
const whatsAppHref = `https://wa.me/${whatsAppPhoneDigits}`;
const whatsAppChannelHref = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL ?? whatsAppHref;
const youtubeChannelHref = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL ?? 'https://www.youtube.com';
const facebookHref = process.env.NEXT_PUBLIC_FACEBOOK_URL ?? 'https://www.facebook.com';
const instagramHref = process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? 'https://www.instagram.com';
const tiktokHref = process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://www.tiktok.com';
const xHref = process.env.NEXT_PUBLIC_X_URL ?? 'https://x.com';
const linkedinHref = process.env.NEXT_PUBLIC_LINKEDIN_URL ?? 'https://www.linkedin.com';

const initialValues: ContactFormState = {
  name: '',
  email: '',
  requesterType: 'individual',
  companyName: '',
  phone: '',
  category: 'quote_issue',
  orderId: '',
  message: '',
  attachmentName: '',
};

export default function ContactPage() {
  const [values, setValues] = useState<ContactFormState>(initialValues);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [ticketNumber, setTicketNumber] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const canSubmit = isContactFormReady(values);

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateContactForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: CreatePublicSupportTicketRequest = {
      name: values.name.trim(),
      email: values.email.trim(),
      category: values.category,
      orderId: values.orderId.trim() || undefined,
      message: buildSupportMessage(values),
      attachmentName: values.attachmentName || undefined,
    };
    const requestBody = attachmentFile ? buildContactFormData(payload, attachmentFile) : JSON.stringify(payload);
    const requestHeaders = attachmentFile ? undefined : { 'Content-Type': 'application/json' };

    setSubmitState('submitting');

    try {
      const response = await fetch(`${apiBaseUrl}${supportTicketApiContract.publicContact.path}`, {
        method: supportTicketApiContract.publicContact.method,
        headers: requestHeaders,
        body: requestBody,
      });

      if (!response.ok) {
        throw new Error('La demande support a échoué.');
      }

      const ticket = (await response.json()) as SupportTicketResponse;
      setTicketNumber(ticket.ticketNumber);
      setValues(initialValues);
      setAttachmentFile(null);
      setSubmitState('submitted');
    } catch {
      setErrors({ form: `Impossible d’envoyer le ticket support. Écrivez à ${officialContactEmail}.` });
      setSubmitState('error');
    }
  }

  function update<K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
    if (submitState !== 'submitting') setSubmitState('idle');
  }

  function updateAttachment(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setAttachmentFile(file);
    update('attachmentName', file?.name ?? '');
  }

  return (
    <main className="overflow-hidden bg-cloud">
      <Navbar />
      <ContactHero />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_24rem] lg:px-8">
        <section className="bg-white p-0 sm:p-2">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-signal">Formulaire de contact</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">Ouvrez un ticket support professionnel.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Ajoutez le contexte commande quand c’est possible. Les pièces jointes facultatives sont référencées par nom de fichier.
          </p>

          <form onSubmit={submitContact} className="mt-6 grid gap-4">
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className="sr-only">Type de demandeur</legend>
              <ChoiceButton
                label="Particulier"
                selected={values.requesterType === 'individual'}
                onClick={() => update('requesterType', 'individual')}
              />
              <ChoiceButton
                label="Entreprise"
                selected={values.requesterType === 'business'}
                onClick={() => update('requesterType', 'business')}
              />
            </fieldset>

            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Nom complet" required value={values.name} error={errors.name} onChange={(value) => update('name', value)} />
              <TextField label="E-mail" required type="email" value={values.email} error={errors.email} onChange={(value) => update('email', value)} />
            </div>

            {values.requesterType === 'business' && (
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Nom de l'entreprise"
                  required
                  value={values.companyName}
                  error={errors.companyName}
                  onChange={(value) => update('companyName', value)}
                />
                <TextField
                  label="Numero de telephone"
                  required
                  type="tel"
                  value={values.phone}
                  error={errors.phone}
                  onChange={(value) => update('phone', value)}
                />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Categorie <span className="text-red-500">*</span></span>
                <select
                  value={values.category}
                  onChange={(event) => update('category', event.target.value as ContactFormState['category'])}
                  className="h-12 w-full rounded-sm border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                >
                  {contactCategories.map((category) => (
                    <option key={category} value={category}>
                      {contactCategoryLabels[category]}
                    </option>
                  ))}
                </select>
                  {errors.category && <p className="mt-2 text-xs font-bold text-red-600">{errors.category}</p>}
              </label>
              <TextField label="ID commande facultatif" value={values.orderId} error={errors.orderId} onChange={(value) => update('orderId', value)} />
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Message <span className="text-red-500">*</span></span>
              <textarea
                value={values.message}
                onChange={(event) => update('message', event.target.value)}
                rows={6}
                className={`w-full rounded-sm border bg-white px-3 py-3 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 ${
                  errors.message ? 'border-red-300' : 'border-slate-200'
                }`}
                placeholder="Expliquez votre demande et ajoutez le contexte utile : devis, upload, paiement, livraison ou question technique."
              />
              {errors.message && <p className="mt-2 text-xs font-bold text-red-600">{errors.message}</p>}
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Pièce jointe facultative</span>
              <input
                type="file"
                onChange={updateAttachment}
                className="block w-full rounded-sm border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-600 file:mr-4 file:rounded-sm file:border-0 file:bg-deepblue file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
              />
              {values.attachmentName && <p className="mt-2 text-xs font-bold text-slate-500">Sélection : {values.attachmentName}</p>}
            </label>

            {errors.form && <div className="rounded-sm border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{errors.form}</div>}
            {submitState === 'submitted' && (
              <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                Ticket support créé{ticketNumber ? ` : ${ticketNumber}` : ''}. Nous répondrons par e-mail.
              </div>
            )}

            <button
              type="submit"
              disabled={submitState === 'submitting' || !canSubmit}
              aria-disabled={submitState === 'submitting' || !canSubmit}
              className={`h-12 rounded-sm px-5 text-sm font-black transition ${
                canSubmit && submitState !== 'submitting'
                  ? 'bg-signal text-white hover:bg-sky-500'
                  : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
              }`}
            >
              {submitState === 'submitting' ? 'Envoi du ticket...' : 'Envoyer le ticket support'}
            </button>
          </form>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <ContactActionPanel
            tone="success"
            icon="whatsapp"
            title="WhatsApp"
            body={whatsAppPhoneDisplay}
            detail="Message direct selon disponibilite"
            href={whatsAppHref}
          />
          <ContactActionPanel
            tone="success"
            icon="whatsapp"
            title="Chaine WhatsApp"
            body="Suivre Kendronics"
            detail="Actus et nouveautes"
            href={whatsAppChannelHref}
          />
          <ContactActionPanel
            tone="danger"
            icon="youtube"
            title="Chaine YouTube"
            body="Kendronics"
            detail="Guides, fabrication et suivi"
            href={youtubeChannelHref}
          />
          <ContactActionPanel
            tone="neutral"
            icon="facebook"
            title="Facebook"
            body="Kendronics"
            detail="Actualites et messages"
            href={facebookHref}
          />
          <ContactActionPanel
            tone="neutral"
            icon="instagram"
            title="Instagram"
            body="Kendronics"
            detail="Projets, ateliers et coulisses"
            href={instagramHref}
          />
          <ContactActionPanel
            tone="neutral"
            icon="tiktok"
            title="TikTok"
            body="Kendronics"
            detail="Formats courts et tutoriels"
            href={tiktokHref}
          />
          <ContactActionPanel
            tone="neutral"
            icon="x"
            title="X"
            body="Kendronics"
            detail="Actualites rapides"
            href={xHref}
          />
          <ContactActionPanel
            tone="neutral"
            icon="linkedin"
            title="LinkedIn"
            body="Kendronics"
            detail="Suivi professionnel"
            href={linkedinHref}
          />
          <ContactActionPanel
            tone="neutral"
            icon="help"
            title="Centre d'aide"
            body="Documentation Kendronics"
            detail="Bases PCB, paiement, livraison et compte"
            href="/centre-aide"
          />
          <div className="bg-white p-0">
            <h3 className="text-lg font-black text-ink">Consulter la FAQ avant de nous ecrire ?</h3>
            <a href="/faq" className="mt-5 inline-flex h-11 w-full items-center justify-center bg-[#0f8f6b] px-5 text-sm font-black text-white transition hover:bg-[#0b7558]">
              Voir la FAQ
            </a>
          </div>
        </aside>
      </section>

      <Footer />
    </main>
  );
}

function ContactHero() {
  return (
    <section className="relative overflow-hidden border-b border-[#d8e1ea] bg-ink pt-[70px] text-white">
      <img
        src={heroImage}
        alt="Conseillere support Kendronics avec casque"
        className="absolute inset-0 h-full w-full object-cover object-[center_28%]"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-ink/[0.58] via-ink/[0.38] to-deepblue/[0.22]" />
      <div className="relative mx-auto max-w-[1368px] px-4 py-8 sm:px-6 sm:py-10 lg:px-5 lg:py-12">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Une equipe disponible pour accompagner vos commandes PCB de bout en bout.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
            Contactez Kendronics pour une question de devis, de fichiers techniques, de paiement, de livraison ou de suivi. Chaque demande est traitee avec contexte, tracabilite et reponse professionnelle.
          </p>
        </div>
      </div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  error,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-12 w-full rounded-sm border bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 ${
          error ? 'border-red-300' : 'border-slate-200'
        }`}
      />
      {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}
    </label>
  );
}

function ChoiceButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 rounded-sm border px-4 text-left text-sm font-black transition ${
        selected ? 'border-signal bg-emerald-50 text-signal' : 'border-slate-200 bg-white text-ink hover:border-signal'
      }`}
    >
      {label}
    </button>
  );
}

function ContactActionPanel({
  tone,
  icon,
  title,
  body,
  detail,
  href,
}: {
  tone: 'neutral' | 'success' | 'danger';
  icon: string;
  title: string;
  body: string;
  detail: string;
  href: string;
}) {
  const isExternal = href.startsWith('http');
  const toneClasses = {
    neutral: 'border-slate-200 bg-white text-[#0f8f6b]',
    success: 'border-emerald-200 bg-emerald-50 text-[#0f8f6b]',
    danger: 'border-red-100 bg-white text-red-600',
  }[tone];
  const iconClasses = {
    neutral: 'bg-emerald-50 text-[#0f8f6b]',
    success: 'bg-[#0f8f6b] text-white',
    danger: 'bg-red-600 text-white',
  }[tone];

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer' : undefined}
      className={`flex items-center gap-4 bg-white p-0 transition hover:text-[#0f8f6b] ${toneClasses}`}
    >
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-sm text-sm font-black ${iconClasses}`}>
        <BrandIcon icon={icon} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-black uppercase tracking-[0.16em]">{title}</span>
        <span className="mt-1 block break-words text-base font-black text-ink">{body}</span>
        <span className="mt-1 block text-sm leading-5 text-slate-600">{detail}</span>
      </span>
    </a>
  );
}

function isContactFormReady(values: ContactFormState): boolean {
  return Boolean(
    values.name.trim().length >= 2 &&
    /^\S+@\S+\.\S+$/.test(values.email.trim()) &&
    (values.requesterType === 'individual' ||
      (values.companyName.trim().length >= 2 && values.phone.trim().length >= 6)) &&
    contactCategories.includes(values.category) &&
    values.message.trim().length >= 10,
  );
}

function buildSupportMessage(values: ContactFormState): string {
  const lines = [
    `Type demandeur: ${values.requesterType === 'business' ? 'Entreprise' : 'Particulier'}`,
    values.requesterType === 'business' ? `Entreprise: ${values.companyName.trim()}` : undefined,
    values.requesterType === 'business' ? `Telephone: ${values.phone.trim()}` : undefined,
    '',
    values.message.trim(),
  ].filter((line): line is string => line !== undefined);

  return lines.join('\n');
}

function buildContactFormData(payload: CreatePublicSupportTicketRequest, attachment: File): FormData {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('email', payload.email);
  formData.append('category', payload.category);
  formData.append('message', payload.message);
  if (payload.orderId) formData.append('orderId', payload.orderId);
  formData.append('attachmentName', payload.attachmentName || attachment.name);
  formData.append('attachment', attachment, attachment.name);
  return formData;
}

function BrandIcon({ icon }: { icon: string }) {
  if (icon === 'mail') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path fill="none" stroke="currentColor" strokeWidth="2" d="M3 6h18v12H3z" />
        <path fill="none" stroke="currentColor" strokeWidth="2" d="m3 7 9 6 9-6" />
      </svg>
    );
  }

  if (icon === 'whatsapp') {
    return (
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16.04 3.2A12.75 12.75 0 0 0 5.2 22.64L3.6 28.8l6.3-1.65a12.72 12.72 0 0 0 6.13 1.56h.01A12.76 12.76 0 0 0 16.04 3.2Zm0 23.34h-.01a10.58 10.58 0 0 1-5.4-1.48l-.39-.23-3.74.98 1-3.65-.25-.38a10.59 10.59 0 1 1 8.79 4.76Zm5.8-7.92c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.31-.82 1.03-1 1.24-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.88-1.76-2.2-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.67 0 1.58 1.15 3.1 1.31 3.32.16.21 2.26 3.45 5.48 4.84.77.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.88-.77 2.15-1.51.26-.74.26-1.38.18-1.51-.08-.13-.29-.21-.61-.37Z"
        />
      </svg>
    );
  }

  if (icon === 'youtube') {
    return (
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
        <path
          fill="currentColor"
          d="M29.3 9.2a3.7 3.7 0 0 0-2.6-2.6C24.4 6 16 6 16 6s-8.4 0-10.7.6a3.7 3.7 0 0 0-2.6 2.6C2.1 11.5 2.1 16 2.1 16s0 4.5.6 6.8a3.7 3.7 0 0 0 2.6 2.6C7.6 26 16 26 16 26s8.4 0 10.7-.6a3.7 3.7 0 0 0 2.6-2.6c.6-2.3.6-6.8.6-6.8s0-4.5-.6-6.8ZM13.2 20.3v-8.6l7.4 4.3-7.4 4.3Z"
        />
      </svg>
    );
  }

  if (icon === 'facebook') {
    return (
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
        <path fill="currentColor" d="M18.2 28V17.1h3.7l.6-4.3h-4.3v-2.7c0-1.2.35-2.1 2.15-2.1h2.3V4.2c-.4-.05-1.75-.17-3.35-.17-3.32 0-5.6 2.03-5.6 5.76v3.01H10v4.3h3.7V28h4.5Z" />
      </svg>
    );
  }

  if (icon === 'instagram') {
    return (
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
        <path fill="none" stroke="currentColor" strokeWidth="2.5" d="M10.5 5.5h11A5 5 0 0 1 26.5 10.5v11a5 5 0 0 1-5 5h-11a5 5 0 0 1-5-5v-11a5 5 0 0 1 5-5Z" />
        <path fill="none" stroke="currentColor" strokeWidth="2.5" d="M20.5 16a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
        <path fill="currentColor" d="M22.9 9.1a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
      </svg>
    );
  }

  if (icon === 'tiktok') {
    return (
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
        <path fill="currentColor" d="M20.7 4.5c.4 3 2.1 5 5.1 5.4v4.1a9.5 9.5 0 0 1-5.1-1.7v7.7c0 4.4-2.9 7.5-7.2 7.5-4 0-7.3-2.8-7.3-6.7 0-4.6 4.2-7.5 8.5-6.6v4.3c-2-.7-4.1.3-4.1 2.3 0 1.6 1.3 2.7 2.9 2.7 1.8 0 2.9-1.1 2.9-3.5V4.5h4.3Z" />
      </svg>
    );
  }

  if (icon === 'x') {
    return (
      <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
        <path fill="currentColor" d="M18.7 14.1 28.5 3h-2.3l-8.5 9.6L10.9 3H3l10.3 14.6L3 29.2h2.3l9-10.1 7.1 10.1h7.9L18.7 14.1Zm-3.2 3.6-1-1.5L6.2 4.7h3.6l6.7 9.4 1 1.5 8.7 12.1h-3.6l-7.1-10Z" />
      </svg>
    );
  }

  if (icon === 'linkedin') {
    return (
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
        <path fill="currentColor" d="M7.2 11.9h4.4V26H7.2V11.9Zm2.2-6.8a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM14.3 11.9h4.2v1.9h.1c.6-1.1 2-2.3 4.2-2.3 4.5 0 5.3 3 5.3 6.8V26h-4.4v-6.9c0-1.7 0-3.8-2.3-3.8s-2.7 1.8-2.7 3.7v7h-4.4V11.9Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2" d="M12 18h.01M9.5 9a2.5 2.5 0 1 1 4.2 1.84c-.93.78-1.7 1.29-1.7 2.66" />
      <path fill="none" stroke="currentColor" strokeWidth="2" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}
