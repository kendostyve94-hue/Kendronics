import { CommentsMarquee } from '../components/home/CommentsMarquee';
import { Footer } from '../components/layout/Footer';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';

const heroImage = '/images/home-hero-pcb-assembly.jpeg';

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

const quoteFields = [
  ['Couches', '2'],
  ['Dimensions', '80 x 60 mm'],
  ['Quantite', '10'],
  ['Destination', 'Senegal'],
];

const workflowSteps = [
  ['01', 'Uploader les fichiers', 'Ajoutez Gerber ZIP, BOM et CPL si assemblage.'],
  ['02', 'Configurer le PCB', 'Choisissez couches, dimensions, quantite, finition et livraison.'],
  ['03', 'Reviser le devis', 'Visualisez fabrication, logistique, paiement et frais de service.'],
  ['04', 'Commander et suivre', 'Payez puis suivez les jalons dans la page Suivi.'],
];

const proofStats = [
  ['24h+', 'Cycle rapide selon options'],
  ['Afrique', 'Livraison pensee par pays'],
  ['Gerber', 'Revue fichier avant blocage'],
  ['Stripe', 'Paiement securise'],
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
      <ProductCatalog />
      <SmartOrdering />
      <TrustBlock />
      <Resources />
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#07324a] pt-28 text-white">
      <img src={heroImage} alt="Fabrication electronique et PCB" className="absolute inset-0 h-full w-full object-cover opacity-55" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#06283b]/95 via-[#06283b]/78 to-[#06283b]/30" />

      <div className="relative mx-auto grid min-h-[640px] max-w-[1180px] gap-8 px-4 pb-10 pt-10 sm:px-6 lg:grid-cols-[1fr_25rem] lg:items-center lg:px-8">
        <div>
          <p className="label-caps text-[#ffd22e]">PCB, PCBA et logistique Afrique</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Commandez vos PCB plus simplement, du fichier Gerber a la livraison.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/88">
            Kendronics coordonne devis, verification fichiers, paiement, production externe et suivi client pour les equipes hardware africaines.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button href="/quote" className="h-12 px-7">Demander un devis</Button>
            <Button href="/services" variant="secondary" className="h-12 px-7">Voir les services</Button>
          </div>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-4">
            {proofStats.map(([value, label]) => (
              <div key={label} className="border border-white/20 bg-white/10 p-3">
                <p className="text-lg font-black text-white">{value}</p>
                <p className="mt-1 text-xs leading-4 text-white/75">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <QuickQuotePanel />
      </div>
    </section>
  );
}

function QuickQuotePanel() {
  return (
    <aside className="border border-white/25 bg-white/92 p-5 text-ink shadow-premium">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-deepblue">Devis rapide</p>
          <h2 className="mt-1 text-xl font-black">Ajouter vos fichiers</h2>
        </div>
        <span className="grid h-10 w-10 place-items-center bg-deepblue text-lg font-black text-white">+</span>
      </div>

      <div className="mt-5 grid min-h-28 place-items-center border border-dashed border-signal/45 bg-sky-50 p-5 text-center">
        <div>
          <p className="text-sm font-black">Gerber ZIP / BOM / CPL</p>
          <p className="mt-1 text-xs text-slate-500">Upload securise et confidentiel</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {quoteFields.map(([label, value]) => (
          <div key={label} className="border border-line bg-white p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-black">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 border-t border-line pt-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Estimation</p>
          <p className="mt-1 text-sm font-bold text-slate-600">Ajustee apres fichier</p>
        </div>
        <a href="/quote" className="inline-flex h-10 items-center rounded-full bg-deepblue px-5 text-sm font-black text-white">
          Configurer
        </a>
      </div>
    </aside>
  );
}

function ProductCatalog() {
  return (
    <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label-caps text-deepblue">Solutions electroniques</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-ink">Un catalogue clair pour passer au devis.</h2>
          </div>
          <Button href="/services" variant="secondary">Tout explorer</Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {productCards.map((card) => (
            <article key={card.title} className="group border border-line bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-glass">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-deepblue">{card.tag}</p>
                  <h3 className="mt-2 text-xl font-black text-ink">{card.title}</h3>
                </div>
                <span className="grid h-10 w-10 place-items-center border border-line bg-slate-50 text-xs font-black text-slate-500">PCB</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm leading-6 text-slate-600">
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
    <section className="bg-cloud px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="label-caps text-deepblue">Commande intelligente</p>
            <h2 className="mt-3 text-3xl font-black text-ink">Un parcours lisible de l upload au suivi.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              L organisation reprend une logique simple : fichier, configuration, verification, paiement, puis suivi client.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button href="/quote">Commencer</Button>
              <Button href="/how-it-works" variant="secondary">Comment ca marche</Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {workflowSteps.map(([number, title, body]) => (
              <article key={number} className="border border-line bg-white p-5 shadow-sm">
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
    <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div>
          <p className="label-caps text-deepblue">Capacites et preuves</p>
          <h2 className="mt-3 text-3xl font-black text-ink">Une plateforme de coordination, pas une promesse floue.</h2>
          <div className="mt-6 grid gap-3">
            {capabilityRows.map(([title, body]) => (
              <div key={title} className="border border-line bg-slate-50 p-4">
                <h3 className="text-sm font-black text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="border border-line bg-white p-6 shadow-glass">
            <p className="label-caps text-deepblue">Pourquoi Kendronics</p>
            <h3 className="mt-3 text-2xl font-black text-ink">Un seul endroit pour devis, paiement, support et livraison.</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Kendronics sert de couche operationnelle entre vos fichiers, les partenaires de fabrication, la logistique et le support client.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {['Prix lisible', 'Support Gerber', 'Suivi commande', 'Livraison Afrique'].map((item) => (
                <div key={item} className="border border-line bg-slate-50 p-3 text-sm font-black text-ink">{item}</div>
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
    <section className="bg-cloud px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-8">
          <p className="label-caps text-deepblue">Guides et solutions</p>
          <h2 className="mt-3 text-3xl font-black text-ink">Les reponses utiles avant de commander.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {resourceItems.map(([title, body, href]) => (
            <a key={title} href={href} className="block border border-line bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-glass">
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
