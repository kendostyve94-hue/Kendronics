'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  contactCategories,
  contactCategoryLabels,
  supportTicketApiContract,
  validateContactForm,
} from '../../lib/contact-contract';
import { officialContactEmail } from '../../lib/official-contact';
import type {
  ContactFormErrors,
  ContactFormState,
  CreatePublicSupportTicketRequest,
  SupportTicketResponse,
} from '../../lib/contact-contract';

type SubmitState = 'idle' | 'submitting' | 'submitted' | 'error';

const heroImage = '/images/contact-support-hero.jpg';

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');
const whatsAppPhoneDisplay = '+33 07 970 427';
const whatsAppPhoneDigits = '3307970427';
const whatsAppHref = `https://wa.me/${whatsAppPhoneDigits}`;
const whatsAppChannelHref = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL ?? whatsAppHref;
const youtubeChannelHref = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL ?? 'https://www.youtube.com';

const initialValues: ContactFormState = {
  name: '',
  email: '',
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
      message: values.message.trim(),
      attachmentName: values.attachmentName || undefined,
    };

    setSubmitState('submitting');

    try {
      const response = await fetch(`${apiBaseUrl}${supportTicketApiContract.publicContact.path}`, {
        method: supportTicketApiContract.publicContact.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('La demande support a échoué.');
      }

      const ticket = (await response.json()) as SupportTicketResponse;
      setTicketNumber(ticket.ticketNumber);
      setValues(initialValues);
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
    update('attachmentName', event.target.files?.[0]?.name ?? '');
  }

  return (
    <main className="overflow-hidden bg-cloud">
      <Navbar />
      <ContactHero />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_24rem] lg:px-8">
        <Card className="p-6 sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-signal">Formulaire de contact</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">Ouvrez un ticket support professionnel.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Ajoutez le contexte commande quand c’est possible. Les pièces jointes facultatives sont référencées par nom de fichier.
          </p>

          <form onSubmit={submitContact} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Nom complet" required value={values.name} error={errors.name} onChange={(value) => update('name', value)} />
              <TextField label="E-mail" required type="email" value={values.email} error={errors.email} onChange={(value) => update('email', value)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Categorie <span className="text-red-500">*</span></span>
                <select
                  value={values.category}
                  onChange={(event) => update('category', event.target.value as ContactFormState['category'])}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
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
                className={`w-full rounded-xl border bg-white px-3 py-3 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 ${
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
                className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-deepblue file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
              />
              {values.attachmentName && <p className="mt-2 text-xs font-bold text-slate-500">Sélection : {values.attachmentName}</p>}
            </label>

            {errors.form && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{errors.form}</div>}
            {submitState === 'submitted' && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                Ticket support créé{ticketNumber ? ` : ${ticketNumber}` : ''}. Nous répondrons par e-mail.
              </div>
            )}

            <button
              type="submit"
              disabled={submitState === 'submitting' || !canSubmit}
              className="h-12 rounded-xl bg-signal px-5 text-sm font-black text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitState === 'submitting' ? 'Envoi du ticket...' : 'Envoyer le ticket support'}
            </button>
          </form>
        </Card>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <ContactActionPanel
            tone="neutral"
            icon="@"
            title="E-mail"
            body={officialContactEmail}
            detail="Reponse professionnelle par ticket"
            href={`mailto:${officialContactEmail}`}
          />
          <ContactActionPanel
            tone="success"
            icon="WA"
            title="WhatsApp"
            body={whatsAppPhoneDisplay}
            detail="Message direct selon disponibilite"
            href={whatsAppHref}
          />
          <ContactActionPanel
            tone="success"
            icon="WA"
            title="Chaine WhatsApp"
            body="Suivre Kendronics"
            detail="Actus et nouveautes"
            href={whatsAppChannelHref}
          />
          <ContactActionPanel
            tone="danger"
            icon="YT"
            title="Chaine YouTube"
            body="Kendronics"
            detail="Guides, fabrication et suivi"
            href={youtubeChannelHref}
          />
          <ContactActionPanel
            tone="neutral"
            icon="?"
            title="Centre d'aide"
            body="Documentation Kendronics"
            detail="Bases PCB, paiement, livraison et compte"
            href="/centre-aide"
          />
          <Card glass className="p-5">
            <h3 className="text-lg font-black text-ink">Consulter la FAQ avant de nous ecrire ?</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Des réponses rapides sur le rôle de Kendronics, les fichiers Gerber, les prix, le paiement, la livraison et le suivi.
            </p>
            <Button href="/faq" className="mt-5 w-full">
              Voir la FAQ
            </Button>
          </Card>
        </aside>
      </section>

      <Footer />
    </main>
  );
}

function ContactHero() {
  return (
    <section className="relative min-h-[68vh] overflow-hidden bg-ink text-white">
      <img src={heroImage} alt="Conseillere support Kendronics avec casque" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.84] to-deepblue/[0.56]" />
      <div className="relative mx-auto flex min-h-[68vh] max-w-7xl items-end px-4 pb-20 pt-36 sm:px-6 lg:px-8">
        <div>
          <p className="inline-flex rounded-xl border border-white/[0.18] bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur-xl">
            Contact
          </p>
          <h1 className="mt-7 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            Support professionnel pour devis, fichiers, paiements et livraison.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            Kendronics utilise e-mail, tickets support et notifications tableau de bord pour un support traçable. WhatsApp n’est pas le canal principal.
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
        className={`h-12 w-full rounded-xl border bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 ${
          error ? 'border-red-300' : 'border-slate-200'
        }`}
      />
      {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}
    </label>
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
      className={`flex items-center gap-4 rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:border-[#0f8f6b] ${toneClasses}`}
    >
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-black ${iconClasses}`}>{icon}</span>
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
    contactCategories.includes(values.category) &&
    values.message.trim().length >= 10,
  );
}
