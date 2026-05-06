import { officialContactEmail } from '../../lib/official-contact';

const footerGroups = [
  {
    title: 'PRODUIT',
    links: [
      ['PCB prototype', '/services#pcb-standard'],
      ['Petites series', '/services#pcb-petit-lot'],
      ['PCB avance', '/services#pcb-avance'],
      ['Assistance Gerber', '/services#assistance-technique'],
      ['Comment ca marche', '/how-it-works'],
    ],
  },
  {
    title: 'SUPPORT',
    links: [
      ['Centre aide', '/centre-aide'],
      ['FAQ', '/faq'],
      ['Guide technique', '/guide-technique'],
      ['Suivi commande', '/tracking'],
      ['Contact', '/contact'],
    ],
  },
  {
    title: 'CADRE LEGAL',
    links: [
      ['Conditions de vente', '/terms#conditions-generales-de-vente'],
      ['Conditions utilisation', '/terms#conditions-generales-utilisation'],
      ['Confidentialite', '/terms#politique-confidentialite'],
      ['Cookies', '/terms#politique-cookies'],
      ['Mentions legales', '/terms#mentions-legales'],
    ],
  },
];

const paymentMethods = ['Stripe', 'Visa', 'Mastercard', 'Carte bancaire'];
const deliveryServices = ['DHL Express', 'FedEx', 'Livraison Afrique', 'Suivi client'];
const trustItems = ['Paiement securise', 'Fichiers confidentiels', 'Support ticket', 'Partenaires externes'];

export function Footer() {
  return (
    <footer id="support" className="border-t border-[#243447] bg-[#132234]">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-5 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <h2 className="text-lg font-black text-white">Kendronics</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">
              Plateforme de devis, paiement, coordination, suivi et support pour commandes PCB vers l'Afrique.
            </p>
            <div className="mt-4 grid gap-2 text-sm font-black text-slate-300">
              <a href={`mailto:${officialContactEmail}`} className="transition hover:text-white">
                {officialContactEmail}
              </a>
              <a
                href="/contact"
                className="inline-flex w-fit rounded-sm border border-[#33465b] px-3 py-1.5 transition hover:border-signal/60 hover:text-white"
              >
                Ouvrir un ticket support
              </a>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-black tracking-[0.18em] text-white">{group.title}</h3>
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

        <div className="mt-8 grid gap-5 border-t border-[#243447] pt-6 md:grid-cols-3">
          <FooterBadgeGroup title="Moyens de paiement" items={paymentMethods} />
          <FooterBadgeGroup title="Services de livraison" items={deliveryServices} />
          <FooterBadgeGroup title="Cadre de confiance" items={trustItems} />
        </div>
      </div>

      <div className="border-t border-[#243447] px-4 py-3 text-xs text-slate-400 sm:px-5 lg:px-6">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; 2026 Kendronics Industrial. Tous droits reserves.</span>
          <span>Plateforme intermediaire. Fabrication assuree par des partenaires externes.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterBadgeGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-black tracking-[0.18em] text-slate-400">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-sm border border-[#33465b] bg-[#182a40] px-2.5 py-1 text-xs font-black text-slate-200">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
