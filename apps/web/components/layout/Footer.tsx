import { officialContactEmail } from '../../lib/official-contact';

const groups = [
  {
    title: 'PRODUIT',
    links: [
      ['PCB Prototype', '/services#pcb-standard'],
      ['Petites séries', '/services#pcb-petit-lot'],
      ['PCB avancé', '/services#pcb-avance'],
      ['Assistance fichiers Gerber', '/services#assistance-technique'],
      ['Comment ça marche', '/how-it-works'],
    ],
  },
  {
    title: 'SUPPORT',
    links: [
      ['Centre d’aide', '/centre-aide'],
      ['FAQ', '/faq'],
      ['Capacités', '/capabilities'],
      ['Guide technique', '/guide-technique'],
      ['Support client', '/contact'],
    ],
  },
  {
    title: 'CADRE LÉGAL',
    links: [
      ['Conditions Générales de Vente', '/terms#conditions-generales-de-vente'],
      ['Conditions Générales d’Utilisation', '/terms#conditions-generales-utilisation'],
      ['Politique de confidentialité', '/terms#politique-confidentialite'],
      ['Politique de cookies', '/terms#politique-cookies'],
      ['Mentions légales', '/terms#mentions-legales'],
    ],
  },
  {
    title: 'CONFIANCE',
    links: [
      ['Rôle de la plateforme', '/how-it-works'],
      ['Paiement sécurisé', '/pricing'],
      ['Fichiers confidentiels', '/privacy'],
      ['Livraison internationale', '/how-it-works#delivery-explanation'],
      ['Produits sur mesure', '/services#pcb-avance'],
    ],
  },
];

export function Footer() {
  return (
    <footer id="support" className="border-t border-[#243447] bg-[#132234]">
      <div className="mx-auto grid max-w-[1120px] gap-7 px-4 py-8 sm:px-5 lg:grid-cols-[1fr_2.6fr] lg:px-6">
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

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-black tracking-[0.12em] text-white">{group.title}</h3>
              <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-300">
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
