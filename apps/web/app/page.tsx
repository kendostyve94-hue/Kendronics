import { Footer } from '../components/layout/Footer';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import { CommentsMarquee } from '../components/home/CommentsMarquee';

const heroImage =
  'https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=2400&q=85';

const factoryImage =
  'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=1800&q=85';

const pcbImage =
  'https://images.unsplash.com/photo-1600195077077-7c815f540a3d?auto=format&fit=crop&w=900&q=85';

const serviceCards = [
  {
    icon: '01',
    title: 'PCB Sourcing',
    body: 'Approvisionnement de circuits imprimes multicouches, flexibles ou HDI via des partenaires certifies.',
    wide: true,
  },
  {
    icon: '02',
    title: 'Assemblage CMS',
    body: 'Lignes SMT et THT haute precision pour passer du prototype au lot pilote avec controle.',
  },
  {
    icon: '03',
    title: 'Prototypage',
    body: 'Cycle rapide pour valider vos cartes, vos BOM et vos choix de fabrication.',
  },
  {
    icon: '04',
    title: 'Coordination',
    body: 'Suivi centralise des fichiers, devis, production, paiement et logistique.',
  },
  {
    icon: '05',
    title: 'Assistance Engineering DFM',
    body: 'Analyse des fichiers pour optimiser la fabricabilite, anticiper les risques et reduire les couts.',
    feature: true,
  },
  {
    icon: '06',
    title: 'Logistique Afrique',
    body: 'Routes de livraison adaptees aux poles technologiques africains et au suivi terrain.',
  },
];

const processSteps = [
  ['Upload', 'Chargement des fichiers Gerber, BOM et CPL.'],
  ['Configure', 'Choix des options de finition, test et assemblage.'],
  ['Pricing', 'Estimation dynamique du cout total.'],
  ['Coordination', 'Lancement de la production assistee.'],
  ['QC', 'Controle qualite, inspection et validation.'],
  ['Delivery', 'Expedition suivie vers la destination.'],
];

const reasons = [
  ['Acces simplifie', 'Une interface unique pour piloter tout le cycle de fabrication sans friction technique.'],
  ['Reseau fiable', 'Des partenaires qualifies, audites et suivis pour maintenir une qualite constante.'],
  ['Prix transparents', 'Chaque ligne du devis expose fabrication, logistique, paiement et service Kendronics.'],
  ['Focus Afrique', 'Une couche logistique pensee pour les destinations et contraintes du continent africain.'],
];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-white text-ink">
      <Navbar />
      <Hero />
      <Services />
      <Process />
      <Proof />
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[650px] overflow-hidden bg-[#07324a] text-white">
      <img src={heroImage} alt="Site industriel et fabrication electronique" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[#07324a]/32" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#06283b]/92 via-[#06283b]/56 to-[#06283b]/12" />
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#06283b]/88 to-transparent" />

      <div className="relative mx-auto flex min-h-[650px] max-w-[1180px] items-center px-4 pb-20 pt-44 sm:px-6 lg:px-8">
        <div className="max-w-[680px]">
          <h1 className="text-5xl font-black leading-[1.18] tracking-tight text-white sm:text-6xl lg:text-[64px]">
            We Provide Innovated Industrial Solutions
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-white/88">
            Nous livrons des solutions durables de fabrication electronique, PCB et logistique pour les ingenieurs, startups et industriels qui veulent produire plus simplement.
          </p>
          <div className="mt-8">
            <Button href="/quote" className="h-12 min-w-36 px-8">
              Get Quote
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickConfigurator() {
  return (
    <div className="glass ml-auto w-full max-w-[590px] rounded-lg p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-ink">Configurateur rapide</h2>
        <span className="font-mono text-xs font-bold text-deepblue">ID-002492</span>
      </div>
      <div className="mt-7 grid min-h-32 place-items-center rounded-lg border border-dashed border-signal/35 bg-cloud/70 p-6 text-center">
        <div>
          <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-gradient-to-r from-signal to-electric text-lg font-black text-white">+</div>
          <p className="text-sm font-black text-ink">Deposez vos fichiers Gerber / BOM</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">ZIP, RAR, CSV, BOM</p>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label-caps text-slate-500">Quantite</span>
          <input className="mt-2 h-12 w-full rounded-[10px] border border-line bg-white px-4 text-sm font-semibold text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20" defaultValue="10" />
        </label>
        <label>
          <span className="label-caps text-slate-500">Couches</span>
          <select className="mt-2 h-12 w-full rounded-[10px] border border-line bg-white px-4 text-sm font-semibold text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20" defaultValue="2 Layers">
            <option>2 Layers</option>
            <option>4 Layers</option>
            <option>6 Layers</option>
          </select>
        </label>
      </div>

      <div className="mt-6 space-y-3">
        {[
          { label: 'PCB Sourcing', meta: 'Inclus' },
          { label: 'Assemblage SMT/THT', meta: 'Actif' },
          { label: 'Controle qualite AOI', meta: 'Actif' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-[10px] border border-line bg-white px-4 py-4 text-sm shadow-sm">
            <span className="font-semibold text-ink">{item.label}</span>
            <span className="font-black text-deepblue">{item.meta}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-end justify-between">
        <div>
          <p className="label-caps text-slate-500">Lead time estime</p>
          <p className="mt-2 text-sm font-black text-ink">8-12 jours ouvres</p>
        </div>
        <div className="text-right">
          <p className="label-caps text-slate-500">Prix estime</p>
          <p className="mt-1 text-3xl font-black text-ink">492,00 EUR</p>
        </div>
      </div>
    </div>
  );
}

function Services() {
  return (
    <section id="services" className="bg-white px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-deepblue">Excellence industrielle</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-4xl">Une infrastructure complete pour vos projets electroniques.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">Une experience inspiree des meilleurs standards SaaS, adaptee aux contraintes PCB, PCBA et logistiques.</p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {serviceCards.map((card) => (
            <article
              key={card.title}
              className={`rounded-lg border border-line bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-glass ${
                card.wide ? 'lg:col-span-2' : ''
              } ${card.feature ? 'lg:col-span-2 lg:grid lg:grid-cols-[1fr_190px] lg:gap-6' : ''}`}
            >
              <div>
                <span className="grid h-11 w-11 place-items-center rounded-[10px] bg-gradient-to-r from-signal to-electric text-sm font-black text-white">{card.icon}</span>
                <h3 className="mt-7 text-base font-black text-ink">{card.title}</h3>
                <p className="mt-4 text-sm leading-6 text-slate-600">{card.body}</p>
                {card.wide ? (
                  <a className="mt-10 inline-flex text-xs font-black uppercase tracking-[0.08em] text-deepblue" href="/capabilities">
                    Voir les capacites
                  </a>
                ) : null}
              </div>
              {card.feature ? (
                <img src={pcbImage} alt="Inspection de circuit imprime" className="mt-6 h-32 w-full rounded-lg object-cover lg:mt-0 lg:h-full" />
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Process() {
  return (
    <section className="bg-cloud px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="label-caps text-deepblue">Processus simplifie</p>
            <h2 className="mt-3 text-3xl font-black text-ink">De l'idee au produit fini</h2>
          </div>
          <p className="hidden font-mono text-xs uppercase tracking-[0.14em] text-slate-500 sm:block">Temps moyen : 12 jours</p>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {processSteps.map(([title, body], index) => (
            <article key={title} className="relative min-h-36 overflow-hidden rounded-lg border border-line bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black text-ink">{title}</h3>
              <p className="mt-3 text-xs leading-5 text-slate-600">{body}</p>
              <span className="absolute -bottom-2 right-3 font-mono text-5xl font-black text-slate-100">{String(index + 1).padStart(2, '0')}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Proof() {
  return (
    <section className="bg-white px-4 py-28 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1200px] gap-16 lg:grid-cols-[1fr_0.98fr] lg:items-center">
        <div>
          <div className="relative overflow-hidden rounded-lg border border-line shadow-glass">
            <img src={factoryImage} alt="Cellule robotisee de fabrication electronique" className="h-[360px] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
            <div className="absolute bottom-7 left-7 rounded-[10px] border border-white/45 bg-white/72 px-5 py-4 text-xs font-black uppercase tracking-[0.08em] text-ink backdrop-blur">
              500+ ingenieurs nous font confiance
            </div>
          </div>
          <CommentsMarquee />
        </div>
        <div>
          <p className="label-caps text-deepblue">Pourquoi Kendronics</p>
          <h2 className="mt-3 text-3xl font-black text-ink">Une plateforme serieuse, fluide et lisible.</h2>
          <div className="mt-9 space-y-7">
            {reasons.map(([title, body], index) => (
              <div key={title} className="grid grid-cols-[42px_1fr] gap-4">
                <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-gradient-to-r from-signal to-electric text-sm font-black text-white">{index + 1}</span>
                <div>
                  <h3 className="text-base font-black text-ink">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
