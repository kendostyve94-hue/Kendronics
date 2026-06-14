import { HeroQuickQuote } from '../components/home/HeroQuickQuote';
import { OneStopVideoPanel } from '../components/home/OneStopVideoPanel';
import { ProductCatalog } from '../components/home/ProductCatalog';
import { Footer } from '../components/layout/Footer';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import { getApiBaseUrl } from '../lib/api-base-url';
import { officialContactEmail } from '../lib/official-contact';

const heroPcbVariantsImage = '/images/hero-pcb-color-variants-transparent.png';
const heroControllerBoardImage = '/images/hero-controller-board-transparent.png';
const heroStackedPcbImage = '/images/hero-stacked-pcb-transparent.png';
const smartOrderingMapImage = '/images/home-schematic-preview.png';
const oneStopPaymentMethodCount = 4;

const oneStopCapabilities = [
  'PCB standard et avance',
  'Assemblage PCBA',
  'FPC, flex et rigid-flex',
  'Stencil SMT',
  'CNC, impression 3D et tolerie',
  'Assistance Gerber avant paiement',
];

const kendronicsChoiceCards = [
  {
    eyebrow: 'HAUT DE GAMME, COMPLEXE',
    title: 'PCB avance',
    image: '/images/product-pcb-advanced.png',
    href: '/quote?productType=advanced_pcb',
  },
  {
    eyebrow: 'Polyimide, renfort, test electrique',
    title: 'Flexible, rigide-flex',
    image: '/images/quote-product-fpc-rigid-flex.png',
    href: '/quote?productType=fpc_rigid_flex',
  },
  {
    eyebrow: 'Cle en main ou fourni par le client',
    title: 'Assemblage PCB',
    image: '/images/home-hero-pcb-assembly.jpeg',
    href: '/quote?productType=pcb_assembly',
  },
];

const kendronicsChoiceReasons = [
  'Delais de fabrication visibles avant validation',
  'Support technique et revue des fichiers',
  'Suivi livraison avec transporteur quand disponible',
  'Options qualite confirmees apres revue partenaire',
  'Commande PCB encadree et tracable',
  'Assistance client pendant le parcours',
  'Petites quantites possibles selon capacite',
  'Options usine coordonnees avec partenaires',
  'Support EMS pour projets electroniques',
];

type RecentProductionActivityItem = {
  date: string;
  region: string;
  reference: string;
  service: string;
  leadTime: string;
  progress: number;
};

const heroSlides = [
  {
    eyebrow: 'PCB personnalises et assemblage',
    title: 'Passez d un dossier Gerber a une commande PCB suivie.',
    body: 'Kendronics vous aide a configurer vos PCB, verifier les fichiers essentiels et coordonner fabrication, paiement et livraison vers l Afrique.',
    media: heroPcbVariantsImage,
    type: 'image',
    imageClassName: 'object-contain object-right opacity-100 lg:translate-x-0',
  },
  {
    eyebrow: 'PCBA et composants',
    title: 'Preparez vos cartes assemblees sans perdre le controle du dossier.',
    body: 'BOM, CPL, composants critiques, options de montage : le parcours garde les informations techniques attachees au devis et au suivi client.',
    media: heroControllerBoardImage,
    type: 'image',
    imageClassName: 'object-contain object-right opacity-100 lg:translate-x-0',
  },
  {
    eyebrow: 'Cartes complexes et industrialisation',
    title: 'Faites examiner les options avancees avant de lancer la fabrication.',
    body: 'Multicouche, impedance controlee, materiaux speciaux ou contraintes de livraison : les demandes sensibles passent par une revue avant confirmation.',
    media: heroStackedPcbImage,
    type: 'image',
    imageClassName: 'object-contain object-right opacity-100 lg:translate-x-0',
  },
];

const workflowSteps = [
  ['quote', 'Devis en ligne'],
  ['upload', 'Fichier PCB'],
  ['review', 'Revue commande'],
  ['payment', 'Paiement'],
  ['tracking', 'Suivi fabrication'],
  ['delivery', 'Livraison'],
  ['received', 'Reception confirmee'],
];

const capabilityRows = [
  ['Materiaux', 'FR-4, aluminium, cuivre core, flex, Rogers/PTFE selon revue.'],
  ['Finitions', 'HASL lead-free, ENIG, OSP, immersion silver.'],
  ['Tests', 'Flying probe, AOI, full electrical test selon configuration.'],
  ['Logistique', 'Coordination France, transport vers l Afrique et suivi client.'],
];

const homeCapabilityGroups = [
  {
    label: 'Fabrication PCB',
    count: '11 specifications',
    description: 'Options principales coordonnees via partenaires.',
    headers: ['Element', 'Specifications', 'Note'],
    rows: [
      ['Materiaux', 'FR4, flex, aluminium, cuivre core, Rogers, PTFE Teflon', 'Standards, thermiques, flexibles ou RF selon revue.'],
      ['Couches', '1-2, 4, 6, 8 et plus sur demande', 'Selon complexite, empilage, materiau et capacite partenaire.'],
      ['Epaisseurs', '0,4 mm a 2,0 mm courants, sur mesure possible', 'Pour prototypes, boitiers contraints et cartes rigides.'],
      ['Finitions', 'HASL sans plomb, ENIG, immersion argent, OSP, or dur', 'Selon usage, delai, assemblage et disponibilite.'],
      ['Cuivre', '1 oz, 2 oz et cuivre plus epais sur revue', 'Pour courant, thermique et contraintes DFM.'],
      ['Masque', 'Vert, noir, blanc, bleu, rouge, jaune, mat selon disponibilite', 'La couleur depend de la ligne partenaire.'],
      ['Serigraphie', 'Blanc, noir et autres options selon masque', 'References, polarites, logos et lisibilite assemblage.'],
      ['Vias', 'Standards, couverts, remplis, via-in-pad sur revue', 'Les vias avances exigent une validation fichier.'],
      ['Tests electriques', 'Flying probe ou banc de test selon disponibilite', 'Controle ouvertures et courts-circuits avant expedition.'],
      ['PCBA', 'Demandes SMT et mixtes sur revue BOM/CPL', 'Assemblage confirme apres analyse partenaire.'],
      ['Stencil', 'Avec ou sans cadre sur demande', 'Pour prototypes, SMT et petites series.'],
    ],
  },
  {
    label: 'Materiaux',
    count: '6 familles',
    description: 'Choix rapide selon usage de la carte.',
    headers: ['Materiau', 'Usage typique', 'Disponibilite'],
    rows: [
      ['FR4', 'PCB rigides polyvalents, prototypes et petites series', 'Large disponibilite'],
      ['Flex', 'Circuits flexibles, zones pliees, boitiers contraints', 'Revue partenaire'],
      ['Aluminium', 'LED, puissance et cartes thermiques', 'Revue partenaire'],
      ['Copper Core', 'Fort transfert thermique et electronique de puissance', 'Revue avancee'],
      ['Rogers', 'RF, hautes frequences et controle dielectrique', 'Revue avancee'],
      ['PTFE Teflon', 'RF specialise, faible perte, contraintes serrees', 'Revue avancee'],
    ],
  },
  {
    label: 'Finitions',
    count: '5 choix',
    description: 'Soudabilite, stockage, cout et connecteurs.',
    headers: ['Finition', 'Usage typique', 'Note pratique'],
    rows: [
      ['HASL sans plomb', 'Prototypes economiques et FR4 courants', 'Abordable, moins plat que ENIG.'],
      ['ENIG', 'Pas fin, assemblage et prototypes premium', 'Surface plate et tres polyvalente.'],
      ['OSP', 'Production courte duree et assemblage simple', 'Stockage et manipulation a planifier.'],
      ['Immersion argent', 'Signal ou assemblage avec bonne soudabilite', 'Precautions de stockage necessaires.'],
      ['Or dur', 'Doigts de contact et surfaces d usure', 'Pour connecteurs et insertions repetees.'],
    ],
  },
];

const operationalProofs = [
  ['Dossier de fabrication', 'Gerber ZIP, BOM et CPL restent attaches au devis pour eviter les echanges disperses.'],
  ['Cadre fournisseur', 'Les options sensibles sont signalees avant paiement pour limiter les mauvaises surprises techniques.'],
  ['Suivi client', 'Chaque commande conserve ses jalons visibles : paiement, production, transit et reception.'],
  ['Logistique Afrique', 'Le parcours integre le pays de destination des le devis pour cadrer transport et support.'],
];

const trustAssurances = [
  ['Role transparent', "Kendronics n'est pas une usine PCB : la plateforme coordonne le devis, le paiement, le suivi et le support avec des partenaires externes.", '/terms'],
  ['Fichiers proteges', 'Les fichiers de production sont associes au dossier client et utilises pour le devis, la revue, la coordination et le support.', '/privacy'],
  ['Paiement encadre', 'Les paiements carte passent par Stripe Checkout quand disponible. Kendronics ne demande jamais les donnees carte par e-mail.', '/pricing'],
  ['Remboursement cadre', "Les demandes sont etudiees selon l'etat de paiement, la revue fichier, la production engagee et la logistique deja lancee.", '/refund-policy'],
  ['Support verifiable', `Les demandes passent par tickets ou par ${officialContactEmail}, avec contexte commande et historique de suivi.`, '/contact'],
  ['Livraison realiste', 'Les delais dependent de la fabrication, du pays, de la douane, du transporteur et des conditions locales.', '/how-it-works'],
];

export default async function HomePage() {
  const recentProductionActivity = await getRecentProductionActivity();

  return (
    <main className="home-page overflow-hidden bg-white text-ink">
      <Navbar />
      <Hero />
      <MobileInstantQuote />
      <ProductCatalog />
      <SmartOrdering />
      <WhyBuyPcbSection recentProductionActivity={recentProductionActivity} />
      <HomeCapabilityMatrix />
      <Footer />
    </main>
  );
}

async function getRecentProductionActivity(): Promise<RecentProductionActivityItem[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/home/recent-production?limit=6`, {
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

function WhyBuyPcbSection({ recentProductionActivity }: { recentProductionActivity: RecentProductionActivityItem[] }) {
  return (
    <section className="bg-white px-0 py-5 sm:px-4 lg:px-5">
      <div className="mx-auto w-full max-w-[1368px] border-t-2 border-[#a88c00] bg-white">
        <div className="grid border border-slate-200 lg:grid-cols-[minmax(18rem,25rem)_1fr]">
          <div className="min-w-0 border-b border-slate-200 p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <h2 className="max-w-full break-words text-lg font-normal tracking-tight text-slate-800 sm:text-xl">Pourquoi commander vos circuits imprimes chez Kendronics ?</h2>
            <ul className="mt-5 space-y-2 text-sm leading-5 text-slate-600">
              {kendronicsChoiceReasons.map((reason) => (
                <li key={reason} className="flex gap-3">
                  <SmallCheckIcon />
                  <span className="min-w-0 break-words">{reason}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button href="/quote" className="w-full justify-center">Devis Immédiat</Button>
              <Button href="/capabilities" variant="secondary" className="w-full justify-center">Capacités</Button>
            </div>
          </div>

          <div className="min-w-0">
            <div className="relative">
              <div className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:gap-0 sm:overflow-hidden sm:pb-0">
                {kendronicsChoiceCards.map((card) => (
                  <a key={card.title} href={card.href} className="group relative h-[18rem] min-w-[18rem] overflow-hidden border-r border-slate-200 last:border-r-0 sm:min-w-0">
                    <img src={card.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    <span className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/20 to-slate-950/0" />
                    <span className="relative block p-5 text-white">
                      <span className="block text-sm font-semibold">{card.eyebrow}</span>
                      <span className="mt-2 block text-2xl font-semibold tracking-tight">{card.title}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-200 bg-white px-5 py-5">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-lg font-normal text-slate-800">Activite recente de production</h3>
                  <p className="text-xs text-slate-500">Commandes anonymisees, progression indicative et zones de livraison.</p>
                </div>
                <p className="text-xs text-slate-500">Donnees issues des commandes reelles.</p>
              </div>
              <div className="overflow-x-auto border border-slate-200">
                <div className="min-w-[34rem]">
                <div className="grid grid-cols-[3.2rem_3rem_4rem_minmax(7rem,1fr)_4.5rem_8.5rem] border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  <span>Date</span>
                  <span>Zone</span>
                  <span>Ref</span>
                  <span>Service</span>
                  <span>Delai</span>
                  <span>Prog.</span>
                </div>
                {recentProductionActivity.length > 0 ? (
                  <div>
                    {recentProductionActivity.map((item) => (
                      <div key={`${item.date}-${item.reference}-${item.service}`} className="grid grid-cols-[3.2rem_3rem_4rem_minmax(7rem,1fr)_4.5rem_8.5rem] items-center border-b border-slate-100 px-3 py-2 text-xs last:border-b-0">
                        <span className="text-slate-500">{item.date}</span>
                        <span className="text-slate-700">{item.region}</span>
                        <span className="text-slate-700">{item.reference}</span>
                        <span className="min-w-0 truncate text-slate-700">{item.service}</span>
                        <span className="font-semibold text-[#ff5a00]">{item.leadTime}</span>
                        <span className="grid grid-cols-[1fr_2rem] items-center gap-2">
                          <span className="h-2 bg-slate-100"><span className="block h-full bg-[#9bcf9f]" style={{ width: `${item.progress}%` }} /></span>
                          <span className="text-[11px] text-slate-500">{item.progress}%</span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-4 text-xs text-slate-500">Les commandes confirmees apparaitront ici automatiquement.</p>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeCapabilityMatrix() {
  const pcbGroup = homeCapabilityGroups[0];
  const materialGroup = homeCapabilityGroups[1];
  const finishGroup = homeCapabilityGroups[2];

  return (
    <section className="bg-white px-0 py-5 sm:px-4 lg:px-5">
      <div className="mx-auto grid w-full max-w-[1368px] items-start gap-5 xl:grid-cols-[minmax(45rem,1.16fr)_minmax(28rem,0.84fr)]">
        <div className="overflow-hidden border border-slate-300 bg-white">
          <div className="grid border-b border-slate-300 lg:grid-cols-[minmax(13rem,16rem)_minmax(29rem,1fr)]">
            <div className="border-b border-slate-200 p-4 sm:p-5 lg:border-b-0 lg:border-r">
              <span className="mb-3 block h-5 w-1 bg-[#008b6d]" aria-hidden="true" />
              <h2 className="text-xl font-semibold leading-tight tracking-tight text-ink">Solution complete pour PCB et assemblage</h2>
              <p className="mt-1 text-sm text-slate-500">Simple, qualite suivie, delais visibles</p>

              <ul className="mt-4 space-y-1.5 text-sm leading-5 text-slate-600">
                {oneStopCapabilities.map((item) => (
                  <li key={item} className="flex gap-3">
                    <SmallCheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

            </div>

            <OneStopVideoPanel paymentMethodCount={oneStopPaymentMethodCount} />
          </div>
        </div>

        <div className="overflow-y-auto overflow-x-hidden border border-slate-300 bg-white lg:h-[24rem]">
          <table className="w-full table-fixed border-collapse text-left text-xs">
            <thead className="bg-[#d8edf8] text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-900">
              <tr>
                {pcbGroup.headers.map((header, index) => (
                  <th key={header} className={`${index === 0 ? 'w-[30%]' : index === 1 ? 'w-[42%]' : 'w-[28%]'} border-b border-r border-slate-300 px-3 py-2 last:border-r-0`}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pcbGroup.rows.map((row, index) => {
                if (row[0] === 'Materiaux') {
                  return (
                    <HomeExpandableCapabilityRow
                      key={row[0]}
                      row={row}
                      stripe={index % 2 === 1}
                      detail={<NestedCapabilityTable group={materialGroup} />}
                    />
                  );
                }

                if (row[0] === 'Finitions') {
                  return (
                    <HomeExpandableCapabilityRow
                      key={row[0]}
                      row={row}
                      stripe={index % 2 === 1}
                      detail={<NestedCapabilityTable group={finishGroup} />}
                    />
                  );
                }

                return <HomeCapabilityRow key={row[0]} row={row} stripe={index % 2 === 1} />;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function SmallCheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="mt-1 h-3.5 w-3.5 shrink-0 text-[#008b6d]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
    </svg>
  );
}

function SmallChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-deepblue transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

function HomeCapabilityRow({ row, stripe: _stripe }: { row: string[]; stripe: boolean }) {
  return (
    <tr className="bg-white">
      {row.map((cell, index) => (
        <td key={`${cell}-${index}`} className={`${index === 0 ? 'font-normal text-[#008b6d]' : 'leading-5 text-slate-700'} break-words border-b border-r border-slate-300 px-3 py-2 align-top last:border-r-0`}>
          {cell}
        </td>
      ))}
    </tr>
  );
}

function HomeExpandableCapabilityRow({ row, stripe: _stripe, detail }: { row: string[]; stripe: boolean; detail: React.ReactNode }) {
  return (
    <tr className="bg-white">
      <td colSpan={3} className="border-b border-slate-300 p-0 align-top">
        <details className="group">
          <summary className="grid cursor-pointer list-none grid-cols-[30%_42%_28%] border-slate-300 outline-none marker:content-none focus:outline-none [&::-webkit-details-marker]:hidden">
            {row.map((cell, index) => (
              <span
                key={`${cell}-${index}`}
                className={`${index === 0 ? 'font-normal text-[#008b6d]' : 'leading-5 text-slate-700'} min-w-0 break-words border-r border-slate-300 px-3 py-2 last:border-r-0`}
              >
                {index === 0 ? (
                  <span className="flex items-center justify-between gap-3">
                    {cell}
                    <SmallChevronDownIcon />
                  </span>
                ) : (
                  cell
                )}
              </span>
            ))}
          </summary>
          <div className="border-t border-slate-300 bg-white p-2">{detail}</div>
        </details>
      </td>
    </tr>
  );
}

function NestedCapabilityTable({ group }: { group: (typeof homeCapabilityGroups)[number] }) {
  return (
    <div className="overflow-hidden border border-slate-300 bg-white">
      <div className="flex flex-col gap-1 border-b border-slate-300 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#008b6d]">{group.count}</p>
          <h4 className="text-base font-semibold text-ink">{group.label}</h4>
        </div>
        <p className="text-xs leading-5 text-slate-500">{group.description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[34rem] border-collapse text-left text-xs">
          <thead className="bg-[#d8edf8] text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-900">
            <tr>
              {group.headers.map((header) => (
                <th key={header} className="border-b border-r border-slate-300 px-3 py-2 last:border-r-0">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {group.rows.map((row, rowIndex) => (
              <tr key={row.join(':')} className="bg-white">
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${cell}-${cellIndex}`}
                    className={`${cellIndex === 0 ? 'font-semibold text-ink' : 'leading-5 text-slate-700'} border-b border-r border-slate-300 px-3 py-2 align-top last:border-r-0`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrustAssurance() {
  return (
    <section className="bg-cloud px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-6 max-w-3xl">
          <p className="label-caps text-deepblue">Confiance et securite</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">Ce que Kendronics promet clairement, et ce qu'il ne promet pas.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            La confiance vient d'un cadre lisible : role exact de la plateforme, fichiers proteges, paiement encadre, support tracable et limites realistes sur production et livraison.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {trustAssurances.map(([title, body, href]) => (
            <a key={title} href={href} className="block border border-line bg-white p-4 transition hover:border-deepblue">
              <h3 className="text-sm font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              <span className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.12em] text-deepblue">Lire le cadre</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function OperationalProofs() {
  return (
    <section className="bg-white px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-5 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label-caps text-deepblue">Preuves operationnelles</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">Ce que le client garde sous controle.</h2>
          </div>
          <Button href="/how-it-works" variant="secondary" className="sm:h-12">
            Voir le parcours
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {operationalProofs.map(([title, body]) => (
            <article key={title} className="border border-line bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-[70px] text-ink">
      <div className="absolute inset-0 bg-white" />
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white/[0.86] to-deepblue/[0.28]" />
      <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden sm:inset-y-0 sm:left-[45%] sm:right-0">
        {heroSlides.map((slide, index) => (
          <div key={slide.title} className="home-hero-slide absolute inset-0" style={{ animationDelay: `${index * 5}s` }}>
            {slide.type === 'video' ? (
              <video className="ml-auto h-full w-full object-cover object-right opacity-70 lg:w-[66%]" autoPlay muted loop playsInline preload="metadata">
                <source src={slide.media} type="video/quicktime" />
              </video>
            ) : (
              <img src={slide.media} alt="" className={`mx-auto h-full w-full max-sm:!object-center sm:ml-auto ${slide.imageClassName ?? 'object-cover opacity-70'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="relative mx-auto grid max-w-[1368px] gap-4 px-4 py-7 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,34rem)_minmax(0,36rem)_16rem] lg:items-end lg:px-5 lg:py-9">
        <div className="hidden w-full lg:block">
          <HeroQuickQuote />
        </div>
        <div className="max-w-xl self-center lg:self-end lg:pb-3">
          <h1 className="text-3xl font-black leading-[1.05] tracking-tight text-[#07111f] sm:text-4xl lg:text-5xl">
            Fabrication PCB et assemblage PCBA, pilotes de bout en bout.
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#334155] sm:text-base sm:leading-7">
            Kendronics structure vos Gerbers, BOM et CPL dans un dossier unique, verifie les points critiques avant paiement, puis coordonne production, support et livraison Afrique avec une tracabilite exploitable par vos equipes.
          </p>
        </div>
        <HeroPromoPanels />
      </div>
    </section>
  );
}

function HeroPromoPanels() {
  return (
    <aside className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:self-end" aria-label="Offres PCB">
      <a href="/quote?productType=standard_pcb&layers=2&length=100&width=100&quantity=5&thickness=1.6mm" className="relative min-h-[5.6rem] overflow-hidden border border-[#0f8f6b]/45 bg-white p-2.5 text-center text-[#102033] transition hover:border-[#0f8f6b] sm:min-h-[6.2rem]">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#0f8f6b]" />
        <p className="text-lg font-normal leading-none text-[#0f8f6b] sm:text-xl">$ 6.75</p>
        <p className="mt-1 text-[11px] leading-4 text-slate-600">5 pieces, 1-2 couches</p>
        <p className="text-xs leading-4 text-slate-600">Production: 24 heures</p>
        <p className="text-xs leading-4 text-slate-600">PCB prototypes</p>
      </a>
      <a href="/quote?productType=advanced_pcb&layers=4&length=100&width=100&quantity=30&thickness=1.6mm" className="relative min-h-[5.6rem] overflow-hidden border border-[#0f8f6b]/45 bg-white p-2.5 text-center text-[#102033] transition hover:border-[#0f8f6b] sm:min-h-[6.2rem]">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#0f8f6b]" />
        <p className="text-lg font-normal leading-none text-[#0f8f6b] sm:text-xl">$ 221.72</p>
        <p className="mt-1 text-[11px] leading-4 text-slate-600">4 couches, 5-30 pieces</p>
        <p className="text-xs leading-4 text-slate-600">Production: 8-9 jours</p>
        <p className="text-xs leading-4 text-slate-600">PCB avance</p>
      </a>
    </aside>
  );
}

function MobileInstantQuote() {
  return (
    <section className="bg-white px-4 py-4 sm:px-6 lg:hidden">
      <div className="mx-auto max-w-[40rem]">
        <HeroQuickQuote />
      </div>
    </section>
  );
}

function SmartOrdering() {
  return (
    <section className="bg-white px-0 py-4 sm:px-4 lg:px-5">
      <div className="mx-auto grid w-full max-w-[1368px] gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <AfricaOperationsCard />
        <SmartOrderingCard />
      </div>
    </section>
  );
}

const africaOperationNodes = [
  { label: 'Gerber', color: '#0f8f6b', icon: 'upload', x: 16, y: 23 },
  { label: 'BOM / CPL', color: '#0877ff', icon: 'review', x: 48, y: 17 },
  { label: 'Devis', color: '#0f8f6b', icon: 'quote', x: 83, y: 25 },
  { label: 'Paiement', color: '#ff5a00', icon: 'payment', x: 84, y: 71 },
  { label: 'Production', color: '#102033', icon: 'tracking', x: 48, y: 84 },
  { label: 'Livraison', color: '#0f8f6b', icon: 'delivery', x: 16, y: 71 },
];

const operationMapCenter = { x: 50, y: 52, radius: 10.5 };

function AfricaOperationsCard() {
  return (
    <article className="overflow-hidden border border-slate-300 bg-white lg:min-h-[24rem]">
      <div className="grid min-h-[24rem] lg:grid-cols-[minmax(13rem,0.62fr)_minmax(20rem,1fr)]">
        <div className="border-b border-slate-200 p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <p className="label-caps text-[#0f8f6b]">Reseau operationnel</p>
          <h2 className="mt-3 text-xl font-semibold leading-tight text-ink">Un dossier unique pour coordonner vos commandes hardware.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Gerber, BOM, devis, paiement, production et livraison restent relies au meme suivi client Kendronics.
          </p>
        </div>

        <div className="relative min-h-[24rem] overflow-hidden bg-[#f5fbf8] p-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(15,143,107,0.16),rgba(15,143,107,0)_64%)]" aria-hidden="true" />
          <img
            src="/images/africa-map.svg"
            alt=""
            className="absolute left-1/2 top-1/2 h-[86%] w-[86%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-70 mix-blend-multiply"
          />
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <circle
              cx={operationMapCenter.x}
              cy={operationMapCenter.y}
              r={operationMapCenter.radius}
              fill="#ffffff"
              fillOpacity="0.32"
              stroke="#0f8f6b"
              strokeWidth="0.35"
              opacity="0.72"
            />
            {africaOperationNodes.map((node) => {
              const dx = node.x - operationMapCenter.x;
              const dy = node.y - operationMapCenter.y;
              const length = Math.max(Math.hypot(dx, dy), 1);
              const startX = operationMapCenter.x + (dx / length) * operationMapCenter.radius;
              const startY = operationMapCenter.y + (dy / length) * operationMapCenter.radius;

              return (
                <line
                  key={`${node.label}-line`}
                  x1={startX}
                  y1={startY}
                  x2={node.x}
                  y2={node.y}
                  stroke="#0f8f6b"
                  strokeWidth="0.35"
                  opacity="0.52"
                />
              );
            })}
          </svg>

          <div className="absolute grid h-[4.4rem] w-[6rem] -translate-x-1/2 -translate-y-1/2 place-items-center" style={{ left: `${operationMapCenter.x}%`, top: `${operationMapCenter.y}%` }}>
            <img src="/images/kendronics-logo.png" alt="Kendronics" className="max-h-8 w-auto object-contain" />
          </div>

          <div className="absolute inset-0">
            {africaOperationNodes.map((node) => (
              <div
                key={node.label}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center"
                style={{ left: `${node.x}%`, top: `${node.y}%`, color: node.color }}
              >
                <span className="grid h-10 w-10 place-items-center">
                  <WorkflowIcon name={node.icon} />
                </span>
                <span className="mt-2 text-[11px] font-semibold leading-4 text-[#102033]">{node.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function SmartOrderingCard({ className = '' }: { className?: string }) {
  return (
    <article className={`overflow-hidden border border-slate-300 bg-white lg:min-h-[24rem] ${className}`}>
      <div className="grid min-h-[24rem] lg:grid-cols-[minmax(16rem,0.46fr)_minmax(20rem,1fr)]">
        <div className="border-b border-slate-200 p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <p className="label-caps text-ink">Commande intelligente</p>
          <h2 className="mt-3 text-xl font-semibold leading-tight text-ink">Chaque schema devient un dossier de fabrication lisible.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Kendronics relie les reperes techniques, fichiers Gerber, BOM/CPL et contraintes d assemblage pour preparer une commande exploitable avant revue, paiement et lancement production.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button href="/quote" className="w-full justify-center sm:h-10">Commencer</Button>
            <Button href="/how-it-works" variant="secondary" className="w-full justify-center sm:h-10">
              Découvrir
            </Button>
          </div>
        </div>

        <div className="relative min-h-[18rem] overflow-hidden bg-white lg:min-h-[24rem]">
          <img src={smartOrderingMapImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        </div>
      </div>
    </article>
  );
}

function WorkflowIcon({ name }: { name: string }) {
  const common = 'h-8 w-8 text-current';

  if (name === 'quote') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M7 3h10v18H7z" />
        <path d="M9 7h6M9 11h2M13 11h2M9 15h2M13 15h2" />
      </svg>
    );
  }

  if (name === 'upload') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M14 3v4h4M12 17V9M9 12l3-3 3 3" />
      </svg>
    );
  }

  if (name === 'review') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M4 4h14v16H4z" />
        <path d="M7 8h8M7 12h5M16 16l4 4M17.5 17.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      </svg>
    );
  }

  if (name === 'payment') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="3" y="6" width="18" height="12" rx="1.5" />
        <path d="M3 10h18M7 15h5" />
      </svg>
    );
  }

  if (name === 'tracking') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
      </svg>
    );
  }

  if (name === 'delivery') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M3 11l18-7-7 18-3-8-8-3Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M12 3 4 7l8 4 8-4-8-4Z" />
      <path d="M4 7v9l8 5 8-5V7M12 11v10M16 5l-8 4" />
      <path d="m15.5 14.5 1.5 1.5 3-3" />
    </svg>
  );
}

function WhyKendronics() {
  return (
    <section className="bg-white px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-[1180px] border border-line bg-white p-4 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="label-caps text-deepblue">Pourquoi Kendronics</p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-ink sm:text-3xl">Un seul dossier pour le devis, le paiement, le support et la livraison.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Kendronics sert de couche operationnelle entre vos fichiers, les partenaires de fabrication, la logistique et le support client.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {['Prix lisible', 'Support Gerber', 'Suivi commande', 'Livraison Afrique'].map((item) => (
              <div key={item} className="flex min-h-16 items-center border border-line bg-slate-50 p-3 text-sm font-semibold leading-5 text-ink">{item}</div>
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
          <p className="label-caps text-deepblue">Capacites et cadre de service</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">Des options techniques visibles avant validation.</h2>
          <div className="mt-5 grid gap-2.5 sm:mt-6 sm:gap-3">
            {capabilityRows.map(([title, body]) => (
              <div key={title} className="border border-line bg-slate-50 p-3 sm:p-4">
                <h3 className="text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-[13px] leading-5 text-slate-600 sm:text-sm sm:leading-6">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <div className="border border-line bg-white p-4 sm:p-6">
            <p className="label-caps text-deepblue">Pourquoi Kendronics</p>
            <h3 className="mt-3 text-xl font-semibold leading-tight text-ink sm:text-2xl">Un seul dossier pour le devis, le paiement, le support et la livraison.</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Kendronics sert de couche operationnelle entre vos fichiers, les partenaires de fabrication, la logistique et le support client.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3">
              {['Prix lisible', 'Support Gerber', 'Suivi commande', 'Livraison Afrique'].map((item) => (
                <div key={item} className="flex min-h-12 items-center border border-line bg-slate-50 p-2.5 text-[13px] font-semibold leading-5 text-ink sm:min-h-14 sm:p-3 sm:text-sm">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
