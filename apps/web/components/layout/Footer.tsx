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

const deliveryLogos = [
  {
    name: 'DHL Express',
    src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/DHL_Express_logo.svg',
    className: 'bg-[#ffcc00]',
  },
  {
    name: 'FedEx Express',
    src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/FedEx_Express.svg',
    className: 'bg-[#4d148c]',
  },
];

const socialLinks = [
  { name: 'Facebook', href: 'https://www.facebook.com', src: 'https://cdn.simpleicons.org/facebook/ffffff', bg: '#1877F2' },
  { name: 'X', href: 'https://x.com', src: 'https://cdn.simpleicons.org/x/ffffff', bg: '#111111' },
  { name: 'YouTube', href: 'https://www.youtube.com', src: 'https://cdn.simpleicons.org/youtube/ffffff', bg: '#FF0000' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com', src: '', bg: '#0A66C2', label: 'in' },
  { name: 'Instagram', href: 'https://www.instagram.com', src: 'https://cdn.simpleicons.org/instagram/ffffff', bg: '#E4405F' },
  { name: 'TikTok', href: 'https://www.tiktok.com', src: 'https://cdn.simpleicons.org/tiktok/ffffff', bg: '#111111' },
];

export function Footer({ forceDesktop = false }: { forceDesktop?: boolean }) {
  const footerClassName = (forceDesktop ? 'min-w-[1328px] ' : '') + 'border-t border-[#243447] bg-[#132234]';
  const containerClassName = forceDesktop ? 'mx-auto max-w-[1368px] px-6 py-6' : 'mx-auto max-w-[1200px] px-4 py-6 sm:px-5 lg:px-6';
  const mainGridClassName = forceDesktop ? 'grid grid-cols-[1.1fr_2fr] gap-5' : 'grid gap-5 lg:grid-cols-[1.1fr_2fr]';
  const linkGridClassName = forceDesktop ? 'grid grid-cols-3 gap-6' : 'grid gap-6 sm:grid-cols-3';
  const logoGridClassName = forceDesktop ? 'mt-6 grid grid-cols-[1fr_1.35fr_auto] items-start gap-6 border-t border-[#243447] pt-5' : 'mt-6 grid items-start gap-6 border-t border-[#243447] pt-5 md:grid-cols-[1fr_1.35fr_auto]';
  const bottomOuterClassName = forceDesktop ? 'border-t border-[#243447] px-6 py-3' : 'border-t border-[#243447] px-4 py-3 sm:px-5 lg:px-6';
  const bottomInnerClassName = forceDesktop ? 'mx-auto flex max-w-[1368px] flex-row items-center justify-between gap-2' : 'mx-auto flex max-w-[1200px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between';

  return (
    <footer id="support" className={footerClassName}>
      <div className={containerClassName}>
        <div className={mainGridClassName}>
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

          <div className={linkGridClassName}>
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

        <div className={logoGridClassName}>
          <PaymentLogoStrip />
          <DeliveryLogoStrip />
          <SocialGroup />
        </div>
      </div>

      <div className={bottomOuterClassName}>
        <div className={bottomInnerClassName}>
          <span className="flex items-center gap-2 text-xs text-slate-400">
            <img src="/images/kendronics-logo.png" alt="Kendronics" className="h-8 w-auto" />
            <span>Fabrication assuree par des partenaires externes.</span>
          </span>
          <span className="text-xs text-slate-400">&copy; 2026 Kendronics Industrial. Tous droits reserves.</span>
        </div>
      </div>
    </footer>
  );
}

function PaymentLogoStrip() {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-300">Moyens de paiement</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <VisaMark />
        <MastercardMark />
        <StripeMark />
        <DiscoverMark />
      </div>
    </div>
  );
}

function VisaMark() {
  return (
    <span aria-label="Visa" className="relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-[2px] border border-[#0b4f92] bg-white">
      <span className="absolute left-0.5 right-0.5 top-0.5 h-1 bg-[#0b5a9d]" />
      <span className="absolute bottom-0.5 left-0.5 right-0.5 h-1 bg-[#f6a21a]" />
      <span className="text-[10px] font-black italic leading-none text-[#0b4f92]">VISA</span>
    </span>
  );
}

function MastercardMark() {
  return (
    <span aria-label="Mastercard" className="relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-[2px] bg-[#111111]">
      <span className="h-4 w-4 rounded-full bg-[#eb001b]" />
      <span className="-ml-1.5 h-4 w-4 rounded-full bg-[#f79e1b] opacity-95" />
    </span>
  );
}

function StripeMark() {
  return (
    <span aria-label="Stripe" className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#635bff]">
      <span className="text-2xl font-black leading-none text-white">S</span>
    </span>
  );
}

function DiscoverMark() {
  return (
    <span aria-label="Discover" className="relative inline-flex h-8 w-8 items-center overflow-hidden rounded-[2px] border border-[#f36f21] bg-white px-0.5">
      <span className="absolute -right-2 top-0 h-full w-5 rounded-l-full bg-gradient-to-b from-[#f36f21] to-[#f9a01b]" />
      <span className="relative text-[6.5px] font-black tracking-[-0.08em] text-[#231f20]">
        DISC<span className="inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#e7351c] to-[#f9a01b] align-[-0.5px]" />VER
      </span>
    </span>
  );
}

function DeliveryLogoStrip() {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-300">Services de livraison</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {deliveryLogos.map((logo) => (
          <span key={logo.name} className={`inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-sm border border-[#5d6670] px-0.5 ${logo.className}`}>
            <img src={logo.src} alt={logo.name} className="max-h-6 max-w-7 object-contain" />
          </span>
        ))}
      </div>
    </div>
  );
}

function SocialGroup() {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-300">Liez-nous sur</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {socialLinks.map((item) => (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            aria-label={item.name}
            className="inline-flex h-8 w-8 items-center justify-center transition hover:opacity-80"
            style={{ backgroundColor: item.bg }}
          >
            {item.label ? (
              <span className="font-sans text-xl font-bold leading-none text-white">{item.label}</span>
            ) : (
              <img src={item.src} alt="" className="h-5 w-5" />
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
