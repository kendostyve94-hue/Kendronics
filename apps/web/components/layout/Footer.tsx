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

const paymentLogos = [
  { name: 'Stripe', src: 'https://cdn.simpleicons.org/stripe/635BFF' },
  { name: 'Visa', src: 'https://cdn.simpleicons.org/visa/1A1F71' },
  { name: 'Mastercard', src: 'https://cdn.simpleicons.org/mastercard/EB001B' },
];

const deliveryLogos = [
  { name: 'DHL Express', src: 'https://cdn.simpleicons.org/dhl/D40511' },
  { name: 'FedEx', src: 'https://cdn.simpleicons.org/fedex/4D148C' },
];

const socialLinks = [
  { name: 'Facebook', href: 'https://www.facebook.com', src: 'https://cdn.simpleicons.org/facebook/1877F2' },
  { name: 'X', href: 'https://x.com', src: 'https://cdn.simpleicons.org/x/000000' },
  { name: 'YouTube', href: 'https://www.youtube.com', src: 'https://cdn.simpleicons.org/youtube/FF0000' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com', src: 'https://cdn.simpleicons.org/linkedin/0A66C2' },
  { name: 'Instagram', href: 'https://www.instagram.com', src: 'https://cdn.simpleicons.org/instagram/E4405F' },
  { name: 'TikTok', href: 'https://www.tiktok.com', src: 'https://cdn.simpleicons.org/tiktok/000000' },
];

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
            <div className="mt-4 grid gap-2 text-sm text-slate-300">
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

        <div className="mt-8 grid gap-6 border-t border-[#243447] pt-6 md:grid-cols-[1fr_1fr_auto]">
          <FooterLogoGroup title="Moyens de paiement" logos={paymentLogos} />
          <FooterLogoGroup title="Services de livraison" logos={deliveryLogos} />
          <SocialGroup />
        </div>
      </div>

      <div className="border-t border-[#243447] px-4 py-3 text-xs text-slate-400 sm:px-5 lg:px-6">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-3">
            <img src="/images/kendronics-logo.png" alt="Kendronics" className="h-6 w-auto rounded-sm bg-white/90 px-1.5 py-0.5" />
            Fabrication assuree par des partenaires externes.
          </span>
          <span>&copy; 2026 Kendronics Industrial. Tous droits reserves.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterLogoGroup({ title, logos }: { title: string; logos: Array<{ name: string; src: string }> }) {
  return (
    <div>
      <h3 className="text-xs font-black tracking-[0.18em] text-slate-400">{title}</h3>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {logos.map((logo) => (
          <span key={logo.name} className="inline-flex h-8 min-w-12 items-center justify-center rounded-sm border border-[#33465b] bg-white px-2">
            <img src={logo.src} alt={logo.name} className="max-h-5 max-w-20 object-contain" />
          </span>
        ))}
      </div>
    </div>
  );
}

function SocialGroup() {
  return (
    <div>
      <h3 className="text-xs font-black tracking-[0.18em] text-slate-400">Liez-nous sur</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {socialLinks.map((item) => (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            aria-label={item.name}
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[#33465b] bg-white transition hover:border-signal/60"
          >
            <img src={item.src} alt="" className="h-4 w-4" />
          </a>
        ))}
      </div>
    </div>
  );
}
