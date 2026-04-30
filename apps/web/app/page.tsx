import { CommentsMarquee } from '../components/home/CommentsMarquee';
import { HeroQuickQuote } from '../components/home/HeroQuickQuote';
import { Footer } from '../components/layout/Footer';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';

const heroImage = '/images/home-hero-pcb-assembly.jpeg';
const heroVideo = '/videos/home-hero-production.mov';

const heroSlides = [
  {
    eyebrow: 'PCB, PCBA et logistique Afrique',
    title: 'Commandez vos PCB plus simplement, du fichier Gerber a la livraison.',
    body: 'Kendronics coordonne devis, verification fichiers, paiement, production externe et suivi client pour les equipes hardware africaines.',
    media: heroImage,
    type: 'image',
  },
  {
    eyebrow: 'Production, controle et coordination',
    title: 'Passez du prototype au suivi de fabrication avec un parcours clair.',
    body: 'Ajoutez vos fichiers, comparez les options, validez le paiement et gardez une vue simple sur chaque etape de la commande.',
    media: heroVideo,
    type: 'video',
  },
];

const productCards = [
  {
    title: 'PCB standard',
    tag: 'FR-4',
    details: ['1 a 12 couches', 'HASL ou ENIG', 'Prototype et petites series'],
    price: 'Devis instantane',
    time: 'Production rapide',
    href: '/quote',
  },
  {
    title: 'PCB petit lot',
    tag: 'Pilotage',
    details: ['Quantites faibles ou moyennes', 'Recommande pour tests terrain', 'Logistique Afrique incluse'],
    price: 'Prix transparent',
    time: 'Suivi client',
    href: '/services#pcb-petit-lot',
  },
  {
    title: 'PCB avance',
    tag: 'Review',
    details: ['Impedance controlee', 'Materiaux speciaux', 'Options haute precision'],
    price: 'Revue technique',
    time: 'Validation support',
    href: '/services#pcb-avance',
  },
  {
    title: 'Assemblage PCBA',
    tag: 'BOM / CPL',
    details: ['BOM et CPL requis', 'Sourcing composants', 'Preparation production'],
    price: 'Sur demande',
    time: 'Controle fichiers',
    href: '/quote',
  },
  {
    title: 'Stencil SMT',
    tag: 'CMS',
    details: ['Stencil prototype', 'Stencil production', 'Planification avec PCB'],
    price: 'Ajout simple',
    time: 'Avec commande',
    href: '/services#stencil',
  },
  {
    title: 'Assistance Gerber',
    tag: 'Support',
    details: ['Verification ZIP', 'Conseils DFM', 'Aide debutant'],
    price: 'Support guide',
    time: 'Avant paiement',
    href: '/guide-technique',
  },
];

const workflowSteps = [
  ['01', 'Uploader les fichiers', 'Ajoutez Gerber ZIP, BOM et CPL si assemblage.'],
  ['02', 'Configurer le PCB', 'Choisissez couches, dimensions, quantite, finition et livraison.'],
  ['03', 'Reviser le devis', 'Visualisez fabrication, logistique, paiement et frais de service.'],
  ['04', 'Commander et suivre', 'Payez puis suivez les jalons dans la page Suivi.'],
];

const capabilityRows = [
  ['Materiaux', 'FR-4, aluminium, cuivre core, flex, Rogers/PTFE selon revue.'],
  ['Finitions', 'HASL lead-free, ENIG, OSP, immersion silver.'],
  ['Tests', 'Flying probe, AOI, full electrical test selon configuration.'],
  ['Logistique', 'Coordination France, transport Afrique, suivi client.'],
];

const resourceItems = [
  ['Guide technique', 'Gerber, KiCad, EasyEDA, erreurs courantes et bases debutant.', '/guide-technique'],
  ['Capacites', 'Materiaux, finitions, via, cuivre, assemblage et options avancees.', '/capabilities'],
  ['Comment ca marche', 'Le parcours complet entre fichiers, devis, paiement, production et livraison.', '/how-it-works'],
];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-white text-ink">
      <Navbar />
      <Hero />
      <MobileQuickAccess />
      <ProductCatalog />
      <SmartOrdering />
      <TrustBlock />
      <Resources />
      <Footer />
    </main>
  );
}

function Hero() {
  const heroTrack = [...heroSlides, heroSlides[0]];

  return (
    <section className="relative min-h-[30rem] overflow-hidden bg-[#07324a] pt-24 text-white sm:min-h-[40rem] sm:pt-28">
      <div className="absolute inset-0">
        <div className="home-hero-media-track flex h-full w-[300%]">
          {heroTrack.map((slide, index) => (
            <div key={`${slide.title}-${index}`} className="relative h-full w-1/3 shrink-0">
              {slide.type === 'video' ? (
                <video className="h-full w-full object-cover opacity-70" autoPlay muted loop playsInline preload="metadata">
                  <source src={slide.media} type="video/quicktime" />
                </video>
              ) : (
                <img src={slide.media} alt="" className="h-full w-full object-cover opacity-70" />
              )}
              <div className="absolute inset-0 bg-[#06283b]/68" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto grid max-w-[1180px] gap-6 px-4 pb-8 pt-8 sm:px-6 sm:pb-12 sm:pt-12 lg:min-h-[640px] lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-center lg:gap-8 lg:px-8">
        <div className="flex min-h-[22rem] max-w-[46rem] flex-col justify-center lg:min-h-0 lg:pr-4">
          <div className="min-h-[14.5rem] overflow-hidden sm:min-h-[18rem] lg:min-h-[22rem]">
            <div className="home-hero-media-track flex w-[300%]">
              {heroTrack.map((slide, index) => (
                <div key={`${slide.title}-copy-${index}`} className="flex w-1/3 shrink-0 flex-col justify-center pr-4 sm:pr-10 lg:min-h-[22rem]">
                  <p className="label-caps text-[#ffd22e]">{slide.eyebrow}</p>
                  <h1 className="mt-3 max-w-[42rem] text-[1.72rem] font-black leading-tight tracking-tight text-white sm:mt-4 sm:text-[3rem] sm:leading-[1.05] lg:text-[3.75rem]">
                    {slide.title}
                  </h1>
                  <p className="mt-4 max-w-[37rem] text-sm leading-6 text-white/88 sm:mt-5 sm:text-base sm:leading-7">
                    {slide.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 grid w-full max-w-[26rem] grid-cols-2 gap-2 sm:mt-6 sm:flex sm:max-w-none sm:gap-3">
            <Button href="/quote" className="h-11 min-w-0 whitespace-nowrap px-2 text-xs sm:h-12 sm:min-w-[10.5rem] sm:px-7 sm:text-sm">Demande un devis</Button>
            <Button href="/services" variant="secondary" className="h-11 min-w-0 whitespace-nowrap px-2 text-xs sm:h-12 sm:min-w-[10.5rem] sm:px-7 sm:text-sm">Voir les services</Button>
          </div>
        </div>

        <HeroQuickQuote />
      </div>
    </section>
  );
}

function MobileQuickAccess() {
  const links = [
    ['PCB', 'Standard', '/quote'],
    ['PCBA', 'Assemblage', '/quote'],
    ['SMT', 'Stencil', '/services#stencil'],
    ['Guide', 'Technique', '/guide-technique'],
  ];

  return (
    <section className="bg-white px-4 py-4 sm:px-6 lg:hidden">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-ink">Acces rapide</h2>
        <a href="/quote" className="text-xs font-black text-deepblue">Devis</a>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {links.map(([title, subtitle, href]) => (
          <a key={title} href={href} className="min-w-[8.5rem] border border-line bg-slate-50 p-3">
            <p className="text-sm font-black text-ink">{title}</p>
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function ProductCatalog() {
  return (
    <section className="bg-white px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label-caps text-deepblue">Solutions electroniques</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-ink sm:text-3xl">Un catalogue clair pour passer au devis.</h2>
          </div>
          <Button href="/services" variant="secondary" className="hidden sm:inline-flex">Tout explorer</Button>
        </div>

        <div className="mt-6 flex gap-3 overflow-x-auto pb-2 md:mt-8 md:grid md:gap-4 md:overflow-visible md:pb-0 md:grid-cols-2 xl:grid-cols-3">
          {productCards.map((card) => (
            <article key={card.title} className="group min-w-[17.5rem] border border-line bg-white p-4 transition hover:-translate-y-1 md:min-w-0 md:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-deepblue">{card.tag}</p>
                  <h3 className="mt-2 text-lg font-black text-ink md:text-xl">{card.title}</h3>
                </div>
                <span className="grid h-10 w-10 place-items-center border border-line bg-slate-50 text-xs font-black text-slate-500">PCB</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600 md:mt-5">
                {card.details.map((detail) => (
                  <li key={detail} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-deepblue" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                <div>
                  <p className="text-sm font-black text-ink">{card.price}</p>
                  <p className="mt-1 text-xs text-slate-500">{card.time}</p>
                </div>
                <a href={card.href} className="text-sm font-black text-deepblue hover:text-signal">Ouvrir</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SmartOrdering() {
  return (
    <section className="bg-cloud px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="label-caps text-deepblue">Commande intelligente</p>
            <h2 className="mt-3 text-2xl font-black text-ink sm:text-3xl">Un parcours lisible de l upload au suivi.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              L organisation reprend une logique simple : fichier, configuration, verification, paiement, puis suivi client.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:gap-3">
              <Button href="/quote">Commencer</Button>
              <Button href="/how-it-works" variant="secondary">Comment ca marche</Button>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:overflow-visible md:pb-0 md:grid-cols-2">
            {workflowSteps.map(([number, title, body]) => (
              <article key={number} className="min-w-[16rem] border border-line bg-white p-4 md:min-w-0 md:p-5">
                <span className="text-sm font-black text-deepblue">{number}</span>
                <h3 className="mt-3 text-lg font-black text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBlock() {
  return (
    <section className="bg-white px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto grid max-w-[21.5rem] gap-5 sm:max-w-[1180px] sm:gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div className="min-w-0">
          <p className="label-caps text-deepblue">Capacites et preuves</p>
          <h2 className="mt-3 text-2xl font-black text-ink sm:text-3xl">Une plateforme de coordination, pas une promesse floue.</h2>
          <div className="mt-5 grid gap-2.5 sm:mt-6 sm:gap-3">
            {capabilityRows.map(([title, body]) => (
              <div key={title} className="border border-line bg-slate-50 p-3 sm:p-4">
                <h3 className="text-sm font-black text-ink">{title}</h3>
                <p className="mt-1 text-[13px] leading-5 text-slate-600 sm:text-sm sm:leading-6">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <div className="border border-line bg-white p-4 sm:p-6">
            <p className="label-caps text-deepblue">Pourquoi Kendronics</p>
            <h3 className="mt-3 text-xl font-black leading-tight text-ink sm:text-2xl">Un seul endroit pour devis, paiement, support et livraison.</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Kendronics sert de couche operationnelle entre vos fichiers, les partenaires de fabrication, la logistique et le support client.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3">
              {['Prix lisible', 'Support Gerber', 'Suivi commande', 'Livraison Afrique'].map((item) => (
                <div key={item} className="flex min-h-12 items-center border border-line bg-slate-50 p-2.5 text-[13px] font-black leading-5 text-ink sm:min-h-14 sm:p-3 sm:text-sm">{item}</div>
              ))}
            </div>
          </div>
          <CommentsMarquee />
        </div>
      </div>
    </section>
  );
}

function Resources() {
  return (
    <section className="bg-cloud px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-8">
          <p className="label-caps text-deepblue">Guides et solutions</p>
          <h2 className="mt-3 text-2xl font-black text-ink sm:text-3xl">Les reponses utiles avant de commander.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {resourceItems.map(([title, body, href]) => (
            <a key={title} href={href} className="block border border-line bg-white p-5 transition hover:-translate-y-1">
              <h3 className="text-lg font-black text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
              <span className="mt-5 inline-flex text-sm font-black text-deepblue">Lire</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
