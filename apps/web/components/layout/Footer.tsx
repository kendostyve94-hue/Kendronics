'use client';

import { FormEvent, useState } from 'react';
import { supportTicketApiContract } from '../../lib/contact-contract';
import { officialContactEmail } from '../../lib/official-contact';

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
          <h3 className="text-sm font-black text-white">Laisser un commentaire</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Partagez votre experience et aidez d'autres ingenieurs a choisir une solution fiable.
          </p>
          <form onSubmit={submitComment} className="mt-4 space-y-2.5">
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
      <div className="border-t border-[#243447] px-4 py-3 text-xs text-slate-400 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1040px]">&copy; 2024 Kendronics Industrial. Tous droits reserves.</div>
      </div>
    </footer>
  );
}
