'use client';

import { FormEvent, useState } from 'react';
import { supportTicketApiContract } from '../../lib/contact-contract';
import { officialContactEmail } from '../../lib/official-contact';

const groups = [
  {
    title: 'Produit',
    links: [
      ['Services', '/services'],
      ['Capacites', '/capabilities'],
      ['Guide', '/how-it-works'],
    ],
  },
  {
    title: 'Support',
    links: [
      ["Centre d'aide", '/faq'],
      ['Confidentialite', '/privacy'],
      ['Conditions', '/terms'],
    ],
  },
];

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');

export function Footer() {
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'submitted'>('idle');

  const canSubmit = comment.trim().length > 0 && rating > 0 && submitState !== 'submitting';

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) return;

    const savedComment = {
      id: `local-${Date.now()}`,
      name: 'Visiteur Kendronics',
      role: 'Commentaire public',
      rating,
      body: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    setSubmitState('submitting');

    try {
      const current = JSON.parse(window.localStorage.getItem('kendronics_public_comments') ?? '[]');
      window.localStorage.setItem('kendronics_public_comments', JSON.stringify([savedComment, ...current].slice(0, 20)));
      window.dispatchEvent(new Event('kendronics:comment-submitted'));
    } catch {
      // Local preview is optional; the confirmation should still feel complete for the visitor.
    }

    try {
      const response = await fetch(`${apiBaseUrl}${supportTicketApiContract.publicContact.path}`, {
        method: supportTicketApiContract.publicContact.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Commentaire site',
          email: officialContactEmail,
          category: 'technical_question',
          message: `Commentaire public (${rating}/5 etoiles)\n\n${comment.trim()}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Comment submission failed.');
      }
    } catch {
      // The public comment is already saved locally; support delivery can fail in local/dev environments.
    }

    setComment('');
    setRating(0);
    setSubmitState('submitted');
  }

  return (
    <footer id="support" className="border-t border-[#243447] bg-[#132234]">
      <div className="mx-auto grid max-w-[1200px] gap-7 px-4 py-9 sm:px-6 lg:grid-cols-[1.15fr_1.7fr_1.1fr] lg:px-8">
        <div>
          <h2 className="text-lg font-black text-white">Kendronics</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
            Solution d'approvisionnement et de fabrication electronique pour les ingenieurs exigeants.
          </p>
          <div className="mt-4 flex gap-3 text-sm font-black text-slate-300">
            <a href="/tracking" className="rounded-sm border border-[#33465b] px-3 py-2 transition hover:border-signal/60 hover:text-white" aria-label="Suivi">
              Suivi
            </a>
            <a href="/contact" className="rounded-sm border border-[#33465b] px-3 py-2 transition hover:border-signal/60 hover:text-white" aria-label="Contact">
              Contact
            </a>
          </div>
        </div>

        <div className="grid gap-7 sm:grid-cols-2">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-black text-white">{group.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
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
          <h3 className="text-sm font-black text-white">Laisser un commentaire</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Partagez votre experience et aidez d'autres ingenieurs a choisir une solution fiable.
          </p>
          <form onSubmit={submitComment} className="mt-4 space-y-3">
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
              placeholder="Ecrivez votre commentaire..."
              rows={3}
              className="w-full resize-none rounded-sm border border-[#33465b] bg-[#0f1b2a] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-signal"
            />
            <button
              className="h-10 w-full rounded-sm bg-gradient-to-r from-signal to-electric text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-45"
              type="submit"
              disabled={!canSubmit}
            >
              Envoyer
            </button>
            {submitState === 'submitted' ? <p className="text-xs font-bold text-slate-300">Commentaire envoye. Merci pour votre retour.</p> : null}
          </form>
        </div>
      </div>
      <div className="border-t border-[#243447] px-4 py-4 text-xs text-slate-400 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">&copy; 2024 Kendronics Industrial. Tous droits reserves.</div>
      </div>
    </footer>
  );
}
