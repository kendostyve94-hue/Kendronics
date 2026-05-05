'use client';

import { FormEvent, useState } from 'react';
import { supportTicketApiContract } from '../../lib/contact-contract';

const groups = [
  {
    title: 'Produit',
    links: [
      ['PCB standard', '/services#pcb-standard'],
      ['PCB petit lot', '/services#pcb-petit-lot'],
      ['PCB avance', '/services#pcb-avance'],
      ['Assistance technique', '/services#assistance-technique'],
    ],
  },
  {
    title: 'Support',
    links: [
      ['Capacite', '/capabilities'],
      ['Comment ca marche', '/how-it-works'],
      ['Guide technique', '/guide-technique'],
    ],
  },
  {
    title: 'A propos',
    links: [
      ['Qui sommes-nous', '/how-it-works'],
      ['FAQ', '/faq'],
      ['Remboursement', '/refund-policy'],
      ['Termes et conditions', '/terms'],
      ['Cookies', '/cookie-policy'],
      ['Confidentialite', '/privacy'],
      ['Conditions', '/terms'],
    ],
  },
];

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');

export function Footer() {
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');
  const [ticketNumber, setTicketNumber] = useState('');

  const canSubmit =
    reviewName.trim().length >= 2 &&
    /^\S+@\S+\.\S+$/.test(reviewEmail.trim()) &&
    comment.trim().length >= 10 &&
    rating > 0 &&
    submitState !== 'submitting';

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) return;

    setSubmitState('submitting');
    setTicketNumber('');

    try {
      const response = await fetch(`${apiBaseUrl}${supportTicketApiContract.publicContact.path}`, {
        method: supportTicketApiContract.publicContact.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reviewName.trim(),
          email: reviewEmail.trim(),
          category: 'technical_question',
          message: `Demande de publication d'avis client (${rating}/5 etoiles)\n\n${comment.trim()}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Comment submission failed.');
      }

      const ticket = (await response.json()) as { ticketNumber?: string };
      setTicketNumber(ticket.ticketNumber ?? '');
      setReviewName('');
      setReviewEmail('');
      setComment('');
      setRating(0);
      setSubmitState('submitted');
    } catch {
      setSubmitState('error');
    }
  }

  return (
    <footer id="support" className="border-t border-[#243447] bg-[#132234]">
      <div className="mx-auto grid max-w-[1040px] gap-5 px-4 py-6 sm:px-5 lg:grid-cols-[0.95fr_1.45fr_1fr] lg:px-6">
        <div>
          <h2 className="text-lg font-black text-white">Kendronics</h2>
          <p className="mt-2 max-w-xs text-sm leading-6 text-slate-300">
            Solution d'approvisionnement et de fabrication electronique pour les ingenieurs exigeants.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm font-black text-slate-300">
            <a href="/centre-aide" className="rounded-sm border border-[#33465b] px-3 py-1.5 transition hover:border-signal/60 hover:text-white" aria-label="Centre d'aide">
              Centre d'aide
            </a>
            <a href="/contact" className="rounded-sm border border-[#33465b] px-3 py-1.5 transition hover:border-signal/60 hover:text-white" aria-label="Contact">
              Contact
            </a>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-black text-white">{group.title}</h3>
              <ul className="mt-2 space-y-1 text-[13px] leading-5 text-slate-300 sm:text-sm">
                {group.links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="transition hover:text-white">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-sm font-black text-white">Publier un avis client</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Envoyez un retour verifie. L equipe Kendronics le relit avant publication dans la bande d avis.
          </p>
          <form onSubmit={submitComment} className="mt-4 space-y-2.5">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <input
                aria-label="Nom"
                value={reviewName}
                onChange={(event) => {
                  setReviewName(event.target.value);
                  if (submitState !== 'submitting') setSubmitState('idle');
                }}
                placeholder="Votre nom"
                className="h-10 rounded-sm border border-[#33465b] bg-[#0f1b2a] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-signal"
              />
              <input
                aria-label="E-mail"
                type="email"
                value={reviewEmail}
                onChange={(event) => {
                  setReviewEmail(event.target.value);
                  if (submitState !== 'submitting') setSubmitState('idle');
                }}
                placeholder="Votre e-mail"
                className="h-10 rounded-sm border border-[#33465b] bg-[#0f1b2a] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-signal"
              />
            </div>
            <div className="flex gap-1" aria-label="Note du commentaire">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setRating(star);
                    if (submitState !== 'submitting') setSubmitState('idle');
                  }}
                  className={`text-2xl leading-none transition ${star <= rating ? 'text-[#f5c84c]' : 'text-slate-500 hover:text-slate-300'}`}
                  aria-label={`${star} etoile${star > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              aria-label="Commentaire"
              value={comment}
              onChange={(event) => {
                setComment(event.target.value);
                if (submitState !== 'submitting') setSubmitState('idle');
              }}
              placeholder="Votre retour apres commande ou accompagnement..."
              rows={3}
              className="w-full resize-none rounded-sm border border-[#33465b] bg-[#0f1b2a] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-signal"
            />
            <button
              className="h-10 w-full rounded-sm bg-gradient-to-r from-signal to-electric text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-45"
              type="submit"
              disabled={!canSubmit}
            >
              {submitState === 'submitting' ? 'Envoi...' : 'Envoyer pour validation'}
            </button>
            {submitState === 'submitted' ? (
              <p className="text-xs font-bold text-slate-300">
                Avis recu{ticketNumber ? ` (${ticketNumber})` : ''}. Publication apres validation.
              </p>
            ) : null}
            {submitState === 'error' ? (
              <p className="text-xs font-bold text-red-200">Envoi impossible pour le moment. Utilisez la page Contact si le probleme continue.</p>
            ) : null}
          </form>
        </div>
      </div>
      <div className="border-t border-[#243447] px-4 py-3 text-xs text-slate-400 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1040px]">&copy; 2024 Kendronics Industrial. Tous droits reserves.</div>
      </div>
    </footer>
  );
}
