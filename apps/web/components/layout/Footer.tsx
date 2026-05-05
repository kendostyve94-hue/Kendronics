import { officialContactEmail } from '../../lib/official-contact';

const groups = [
  {
    title: 'Produit',
    links: [
      ['PCB prototype', '/services#pcb-standard'],
      ['Petite série', '/services#pcb-petit-lot'],
      ['PCB avancé', '/services#pcb-avance'],
      ['Assistance Gerber', '/services#assistance-technique'],
    ],
  },
  {
    title: 'Support',
    links: [
      ['Capacités', '/capabilities'],
      ['Comment ça marche', '/how-it-works'],
      ['Guide technique', '/guide-technique'],
      ['FAQ', '/faq'],
    ],
  },
  {
    title: 'Cadre légal',
    links: [
      ['Conditions', '/terms'],
      ['Confidentialité', '/privacy'],
      ['Remboursements', '/refund-policy'],
      ['Cookies', '/cookie-policy'],
    ],
  },
];

const trustItems = [
  ['Rôle clair', 'Kendronics coordonne la commande. Les cartes sont fabriquées par des partenaires externes.'],
  ['Paiement sécurisé', 'Les paiements carte passent par Stripe Checkout quand disponible.'],
  ['Fichiers privés', 'Les fichiers Gerber, BOM et CPL restent liés au dossier client et au support.'],
  ['Support traçable', 'Les tickets et e-mails gardent le contexte de commande au même endroit.'],
];

export function Footer() {
  return (
    <footer id="support" className="border-t border-[#243447] bg-[#132234]">
      <div className="mx-auto grid max-w-[1120px] gap-7 px-4 py-8 sm:px-5 lg:grid-cols-[1fr_1.2fr_1fr] lg:px-6">
        <div>
          <h2 className="text-lg font-black text-white">Kendronics</h2>
          <p className="mt-2 max-w-xs text-sm leading-6 text-slate-300">
            Plateforme de devis, paiement, coordination et suivi pour commandes PCB et PCBA vers l’Afrique.
          </p>
          <div className="mt-4 grid gap-2 text-sm font-black text-slate-300">
            <a href={`mailto:${officialContactEmail}`} className="transition hover:text-white">
              {officialContactEmail}
            </a>
            <a href="/contact" className="inline-flex w-fit rounded-sm border border-[#33465b] px-3 py-1.5 transition hover:border-signal/60 hover:text-white">
              Ouvrir un ticket support
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
          <h3 className="text-sm font-black text-white">Cadre de confiance</h3>
          <div className="mt-3 grid gap-2">
            {trustItems.map(([title, body]) => (
              <div key={title} className="rounded-sm border border-[#33465b] bg-[#0f1b2a] p-3">
                <p className="text-sm font-black text-white">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-[#243447] px-4 py-3 text-xs text-slate-400 sm:px-5 lg:px-6">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; 2024 Kendronics Industrial. Tous droits réservés.</span>
          <span>Plateforme intermédiaire. Fabrication assurée par des partenaires externes.</span>
        </div>
      </div>
    </footer>
  );
}
