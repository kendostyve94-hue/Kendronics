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

const heroImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=85';

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');

const initialValues: ContactFormState = {
  name: '',
  email: '',
  category: 'quote_issue',
  orderId: '',
  message: '',
  attachmentName: '',
};

const supportChannels = [
  ['Professional email support', `Use ${officialContactEmail} for non-urgent questions, partnership outreach, and operational follow-up.`],
  ['Support tickets', 'Structured tickets keep category, order ID, message, and file context attached to the support queue.'],
  ['Dashboard notifications', 'Authenticated users can receive order and support updates through dashboard notification surfaces as the platform expands.'],
  ['No WhatsApp as primary support', 'WhatsApp is not the primary support channel. Use email and tickets so requests remain traceable and professional.'],
];

export default function ContactPage() {
  const [values, setValues] = useState<ContactFormState>(initialValues);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [ticketNumber, setTicketNumber] = useState('');

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
        throw new Error('Support ticket request failed.');
      }

      const ticket = (await response.json()) as SupportTicketResponse;
      setTicketNumber(ticket.ticketNumber);
      setValues(initialValues);
      setSubmitState('submitted');
    } catch {
      setErrors({ form: `We could not submit the support ticket. Please email ${officialContactEmail}.` });
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
          <p className="text-sm font-black uppercase tracking-[0.18em] text-signal">Contact form</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">Open a professional support ticket.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Attach order context when possible. Optional file attachments are recorded by filename here; production file upload storage can be connected through the upload service later.
          </p>

          <form onSubmit={submitContact} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Name" value={values.name} error={errors.name} onChange={(value) => update('name', value)} />
              <TextField label="Email" type="email" value={values.email} error={errors.email} onChange={(value) => update('email', value)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Category</span>
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
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Message</span>
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
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Piece jointe facultative</span>
              <input
                type="file"
                onChange={updateAttachment}
                className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-deepblue file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
              />
              {values.attachmentName && <p className="mt-2 text-xs font-bold text-slate-500">Selection : {values.attachmentName}</p>}
            </label>

            {errors.form && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{errors.form}</div>}
            {submitState === 'submitted' && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                Support ticket created{ticketNumber ? `: ${ticketNumber}` : ''}. We will respond by email.
              </div>
            )}

            <button
              type="submit"
              disabled={submitState === 'submitting'}
              className="h-12 rounded-xl bg-signal px-5 text-sm font-black text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitState === 'submitting' ? 'Submitting ticket...' : 'Submit support ticket'}
            </button>
          </form>
        </Card>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <InfoPanel title="Support email" body={officialContactEmail} detail="Use email for professional support follow-up. Support tickets remain the best format for order-specific issues." />
          <InfoPanel title="Delai de reponse" body="Objectif de reponse pendant les horaires ouvrables" detail="Les questions de devis, upload, paiement et livraison sont triees par categorie et contexte de commande." />
          <InfoPanel title="Business location" body="France-based platform" detail="Kendronics coordinates PCB ordering, payment, France logistics, Africa delivery, tracking, and support." />
          <Card glass className="p-5">
            <h3 className="text-lg font-black text-ink">FAQ before contacting?</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Fast answers for manufacturer role, Gerber files, pricing, payment, delivery, and tracking.
            </p>
            <Button href="/faq" className="mt-5 w-full">
              View FAQ
            </Button>
          </Card>
        </aside>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {supportChannels.map(([title, body]) => (
            <Card key={title} glass className="p-5">
              <h3 className="text-lg font-black text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function ContactHero() {
  return (
    <section className="relative min-h-[68vh] overflow-hidden bg-ink text-white">
      <img src={heroImage} alt="Macro close-up of a printed circuit board" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.84] to-deepblue/[0.56]" />
      <div className="relative mx-auto flex min-h-[68vh] max-w-7xl items-end px-4 pb-20 pt-36 sm:px-6 lg:px-8">
        <div>
          <p className="inline-flex rounded-xl border border-white/[0.18] bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur-xl">
            Contact
          </p>
          <h1 className="mt-7 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            Professional support for quotes, files, payments, and delivery.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            Kendronics uses email, support tickets, and dashboard notifications for traceable support. WhatsApp is not the primary support channel.
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
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

function InfoPanel({ title, body, detail }: { title: string; body: string; detail: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">{title}</p>
      <h3 className="mt-2 break-words text-xl font-black text-ink">{body}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
    </Card>
  );
}
