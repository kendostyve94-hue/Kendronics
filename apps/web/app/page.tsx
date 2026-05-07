import { HeroQuickQuote } from '../components/home/HeroQuickQuote';
import { ProductCatalog } from '../components/home/ProductCatalog';
import { Footer } from '../components/layout/Footer';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import { officialContactEmail } from '../lib/official-contact';

const heroPcbVariantsImage = '/images/hero-pcb-color-variants-transparent.png';
const heroControllerBoardImage = '/images/hero-controller-board-transparent.png';
const heroStackedPcbImage = '/images/hero-stacked-pcb-transparent.png';
const heroSlides = [
  {
    eyebrow: 'PCB personnalisés et assemblage',
    title: 'Passez d’un dossier Gerber à une commande PCB suivie.',
    body: 'Kendronics vous aide à configurer vos PCB, vérifier les fichiers essentiels et coordonner fabrication, paiement et livraison vers l’Afrique.',
    media: heroPcbVariantsImage,
    type: 'image',
    imageClassName: 'object-contain object-right opacity-100 lg:translate-x-0',
  },
  {
    eyebrow: 'PCBA et composants',
    title: 'Préparez vos cartes assemblées sans perdre le contrôle du dossier.',
    body: 'BOM, CPL, composants critiques, options de montage : le parcours garde les informations techniques attachées au devis et au suivi client.',
    media: heroControllerBoardImage,
    type: 'image',
    imageClassName: 'object-contain object-right opacity-100 lg:translate-x-0',
  },
  {
    eyebrow: 'Cartes complexes et industrialisation',
    title: 'Faites examiner les options avancées avant de lancer la fabrication.',
    body: 'Multicouche, impédance contrôlée, matériaux spéciaux ou contraintes de livraison : les demandes sensibles passent par une revue avant confirmation.',
    media: heroStackedPcbImage,
    type: 'image',
    imageClassName: 'object-contain object-right opacity-100 lg:translate-x-0',
  },
];

const workflowSteps = [
  ['01', 'Uploader les fichiers', 'Ajoutez Gerber ZIP, BOM et CPL si assemblage.'],
  ['02', 'Configurer le PCB', 'Choisissez couches, dimensions, quantité, finition et livraison.'],
  ['03', 'Réviser le devis', 'Visualisez fabrication, logistique, paiement et frais de service.'],
  ['04', 'Commander et suivre', 'Payez puis suivez les jalons dans la page Suivi.'],
];

const capabilityRows = [
  ['Matériaux', 'FR-4, aluminium, cuivre core, flex, Rogers/PTFE selon revue.'],
  ['Finitions', 'HASL lead-free, ENIG, OSP, immersion silver.'],
  ['Tests', 'Flying probe, AOI, full electrical test selon configuration.'],
  ['Logistique', 'Coordination France, transport vers l’Afrique et suivi client.'],
];

const homeCapabilityGroups = [
  {
    label: 'PCB fabrication',
    count: '11 specs',
    description: 'Options principales coordonnees via partenaires.',
    headers: ['Item', 'Specifications', 'Note'],
    rows: [
      ['Materiaux', 'FR4, flex, aluminium, copper core, Rogers, PTFE Teflon', 'Standards, thermiques, flexibles ou RF selon revue.'],
      ['Couches', '1-2, 4, 6, 8 et plus sur demande', 'Selon complexite, empilage, materiau et capacite partenaire.'],
      ['Epaisseurs', '0,4 mm a 2,0 mm courants, sur mesure possible', 'Pour prototypes, boitiers contraints et cartes rigides.'],
      ['Finitions', 'HASL sans plomb, ENIG, immersion silver, OSP, hard gold', 'Selon usage, delai, assemblage et disponibilite.'],
      ['Cuivre', '1 oz, 2 oz et cuivre plus epais sur revue', 'Pour courant, thermique et contraintes DFM.'],
      ['Masque', 'Vert, noir, blanc, bleu, rouge, jaune, mat selon disponibilite', 'La couleur depend de la ligne partenaire.'],
      ['Serigraphie', 'Blanc, noir et autres options selon masque', 'References, polarites, logos et lisibilite assemblage.'],
      ['Vias', 'Standards, tented, filled, via-in-pad sur revue', 'Les vias avances exigent une validation fichier.'],
      ['Tests electriques', 'Flying probe ou test fixture selon disponibilite', 'Controle ouvertures et courts-circuits avant expedition.'],
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
      ['HASL lead-free', 'Prototypes economiques et FR4 courants', 'Abordable, moins plat que ENIG.'],
      ['ENIG', 'Fine pitch, assemblage et prototypes premium', 'Surface plate et tres polyvalente.'],
      ['OSP', 'Production courte duree et assemblage simple', 'Stockage et manipulation a planifier.'],
      ['Immersion silver', 'Signal ou assemblage avec bonne soudabilite', 'Precautions de stockage necessaires.'],
      ['Hard gold', 'Gold fingers et surfaces d usure', 'Pour connecteurs et insertions repetees.'],
    ],
  },
];

const resourceItems = [
  ['Guide technique', 'Gerber, KiCad, EasyEDA, erreurs courantes et bases pour préparer un dossier propre.', '/guide-technique'],
  ['Capacités', 'Matériaux, finitions, vias, cuivre, assemblage et options avancées.', '/capabilities'],
  ['Comment ça marche', 'Le parcours complet entre fichiers, devis, paiement, production et livraison.', '/how-it-works'],
];

const operationalProofs = [
  ['Dossier de fabrication', 'Gerber ZIP, BOM et CPL restent attachés au devis pour éviter les échanges dispersés.'],
  ['Cadre fournisseur', 'Les options sensibles sont signalées avant paiement pour limiter les mauvaises surprises techniques.'],
  ['Suivi client', 'Chaque commande conserve ses jalons visibles : paiement, production, transit et réception.'],
  ['Logistique Afrique', 'Le parcours intègre le pays de destination dès le devis pour cadrer transport et support.'],
];

const trustAssurances = [
  ['Rôle transparent', 'Kendronics n’est pas une usine PCB : la plateforme coordonne le devis, le paiement, le suivi et le support avec des partenaires externes.', '/terms'],
  ['Fichiers protégés', 'Les fichiers de production sont associés au dossier client et utilisés pour le devis, la revue, la coordination et le support.', '/privacy'],
  ['Paiement encadré', 'Les paiements carte passent par Stripe Checkout quand disponible. Kendronics ne demande jamais les données carte par e-mail.', '/pricing'],
  ['Remboursement cadré', 'Les demandes sont étudiées selon l’état de paiement, la revue fichier, la production engagée et la logistique déjà lancée.', '/refund-policy'],
  ['Support vérifiable', `Les demandes passent par tickets ou par ${officialContactEmail}, avec contexte commande et historique de suivi.`, '/contact'],
  ['Livraison réaliste', 'Les délais dépendent de la fabrication, du pays, de la douane, du transporteur et des conditions locales.', '/how-it-works'],
];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-white text-ink">
      <Navbar />
      <Hero />
      <MobileQuickAccess />
      <ProductCatalog />
      <HomeCapabilityMatrix />
      <SmartOrdering />
      <OperationalProofs />
      <TrustAssurance />
      <TrustBlock />
      <Resources />
      <Footer />
    </main>
  );
}

function HomeCapabilityMatrix() {
  const pcbGroup = homeCapabilityGroups[0];
  const materialGroup = homeCapabilityGroups[1];
  const finishGroup = homeCapabilityGroups[2];

  return (
    <section className="bg-white px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-none">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="label-caps text-deepblue">Capacites de fabrication</p>
            <h2 className="mt-3 text-2xl font-black text-ink sm:text-3xl">Les specs essentielles en lecture compacte.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Un tableau pleine largeur pour comparer les options de fabrication sans allonger la page.
            </p>
          </div>
          <Button href="/capabilities" variant="secondary" className="h-11 lg:h-12">
            Voir le detail
          </Button>
        </div>

        <div className="overflow-hidden border border-slate-300 bg-white">
          <div className="flex flex-col gap-2 border-b border-slate-300 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#008b6d]">{pcbGroup.count}</p>
              <h3 className="text-lg font-black text-ink">{pcbGroup.label}</h3>
            </div>
            <p className="max-w-xl text-xs leading-5 text-slate-500 sm:text-right">{pcbGroup.description}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[62rem] w-full border-collapse text-left text-[13px]">
              <thead className="bg-[#d8edf8] text-[11px] font-black uppercase tracking-[0.1em] text-slate-900">
                <tr>
                  {pcbGroup.headers.map((header, index) => (
                    <th key={header} className={`${index === 0 ? 'w-[14rem]' : index === 1 ? 'w-[24rem]' : ''} border-b border-r border-slate-300 px-4 py-3 last:border-r-0`}>
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
      </div>
    </section>
  );
}

function HomeCapabilityRow({ row, stripe }: { row: string[]; stripe: boolean }) {
  return (
    <tr className={stripe ? 'bg-[#edf7fd]' : 'bg-white'}>
      {row.map((cell, index) => (
        <td key={`${cell}-${index}`} className={`${index === 0 ? 'font-normal text-[#008b6d]' : 'leading-5 text-slate-700'} border-b border-r border-slate-300 px-4 py-3 align-top last:border-r-0`}>
          {cell}
        </td>
      ))}
    </tr>
  );
}

function HomeExpandableCapabilityRow({ row, stripe, detail }: { row: string[]; stripe: boolean; detail: React.ReactNode }) {
  return (
    <tr className={stripe ? 'bg-[#edf7fd]' : 'bg-white'}>
      <td colSpan={3} className="border-b border-slate-300 p-0 align-top">
        <details className="group">
          <summary className="grid cursor-pointer list-none grid-cols-[14rem_24rem_minmax(0,1fr)] border-slate-300 outline-none marker:content-none focus:outline-none [&::-webkit-details-marker]:hidden">
            {row.map((cell, index) => (
              <span
                key={`${cell}-${index}`}
                className={`${index === 0 ? 'font-normal text-[#008b6d]' : 'leading-5 text-slate-700'} border-r border-slate-300 px-4 py-3 last:border-r-0`}
              >
                {index === 0 ? (
                  <span className="flex items-center justify-between gap-3">
                    {cell}
                    <span className="text-sm text-deepblue transition group-open:rotate-180">⌄</span>
                  </span>
                ) : (
                  cell
                )}
              </span>
            ))}
          </summary>
          <div className="border-t border-slate-300 bg-[#f8fbfd] p-4">{detail}</div>
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
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#008b6d]">{group.count}</p>
          <h4 className="text-base font-black text-ink">{group.label}</h4>
        </div>
        <p className="text-xs leading-5 text-slate-500">{group.description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-xs">
          <thead className="bg-[#d8edf8] text-[10px] font-black uppercase tracking-[0.1em] text-slate-900">
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
              <tr key={row.join(':')} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#edf7fd]'}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${cell}-${cellIndex}`}
                    className={`${cellIndex === 0 ? 'font-black text-ink' : 'leading-5 text-slate-700'} border-b border-r border-slate-300 px-3 py-2 align-top last:border-r-0`}
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
          <p className="label-caps text-deepblue">Confiance et sécurité</p>
          <h2 className="mt-3 text-2xl font-black text-ink sm:text-3xl">Ce que Kendronics promet clairement, et ce qu’il ne promet pas.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            La confiance vient d’un cadre lisible : rôle exact de la plateforme, fichiers protégés, paiement encadré, support traçable et limites réalistes sur production et livraison.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {trustAssurances.map(([title, body, href]) => (
            <a key={title} href={href} className="block border border-line bg-white p-4 transition hover:border-deepblue">
              <h3 className="text-sm font-black text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              <span className="mt-4 inline-flex text-xs font-black uppercase tracking-[0.12em] text-deepblue">Lire le cadre</span>
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
            <p className="label-caps text-deepblue">Preuves opérationnelles</p>
            <h2 className="mt-3 text-2xl font-black text-ink sm:text-3xl">Ce que le client garde sous contrôle.</h2>
          </div>
          <Button href="/how-it-works" variant="secondary" className="sm:h-12">
            Voir le parcours
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {operationalProofs.map(([title, body]) => (
            <article key={title} className="border border-line bg-slate-50 p-4">
              <h3 className="text-sm font-black text-ink">{title}</h3>
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
    <section className="relative min-h-[31.5rem] overflow-hidden bg-[#dcecf8] pt-20 text-ink sm:min-h-[40rem] sm:pt-28 lg:min-h-[29rem] lg:pt-20">
      <div className="absolute inset-0 bg-gradient-to-r from-[#eef7ff] via-[#dbeefa] to-[#c7dced]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#eef7ff] via-[#eef7ff]/82 to-[#eef7ff]/14" />
      <div className="absolute inset-x-0 bottom-[5.75rem] top-[17rem] overflow-hidden sm:inset-0 lg:left-[48%] lg:right-0 lg:top-0 lg:bottom-0">
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

      <div className="relative mx-auto flex max-w-[1180px] flex-col justify-start px-4 pb-5 pt-5 sm:px-6 sm:pb-10 sm:pt-10 lg:min-h-[430px] lg:justify-center lg:px-8">
        <div className="relative min-h-[12.75rem] max-w-[42rem] sm:min-h-[20rem] lg:min-h-[17rem]">
          {heroSlides.map((slide, index) => (
            <div key={slide.title} className="home-hero-copy absolute inset-0 flex flex-col justify-start sm:justify-center" style={{ animationDelay: `${index * 5}s` }}>
              <p className="label-caps text-[#0f8f6b]">{slide.eyebrow}</p>
              <h1 className="mt-2 max-w-2xl text-[1.45rem] font-black leading-tight tracking-tight text-ink sm:mt-4 sm:text-5xl lg:text-[3.2rem]">
                {slide.title}
              </h1>
              <p className="mt-3 max-w-xl text-xs leading-5 text-slate-600 sm:mt-5 sm:text-base sm:leading-7">
                {slide.body}
              </p>
            </div>
          ))}
        </div>

        <div className="relative mt-[10.25rem] grid grid-cols-2 gap-2 sm:mt-7 sm:flex sm:items-center sm:gap-3">
          <Button href="/quote" className="h-11 whitespace-nowrap px-2 text-xs !font-normal sm:h-12 sm:px-7 sm:text-sm">Demander un devis</Button>
          <Button href="/services" variant="secondary" className="h-11 whitespace-nowrap px-2 text-xs !font-normal sm:h-12 sm:px-7 sm:text-sm">Voir les services</Button>
          <HeroQuickQuote />
        </div>

        <div className="relative mt-4 flex gap-2 sm:hidden" aria-hidden="true">
          {heroSlides.map((slide, index) => (
            <span key={slide.title} className="home-hero-dot h-1.5 w-6 bg-ink" style={{ animationDelay: `${index * 5}s` }} />
          ))}
        </div>
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
        <h2 className="text-sm font-black text-ink">Accès rapide</h2>
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

function SmartOrdering() {
  return (
    <section className="bg-cloud px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="label-caps text-deepblue">Commande intelligente</p>
            <h2 className="mt-3 text-2xl font-black text-ink sm:text-3xl">Un parcours lisible, du fichier au suivi.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Le devis conserve le contexte technique : fichiers, configuration, vérification, paiement, jalons de fabrication et livraison.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:gap-3">
              <Button href="/quote">Commencer</Button>
              <Button href="/how-it-works" variant="secondary">Comment ça marche</Button>
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
          <p className="label-caps text-deepblue">Capacités et cadre de service</p>
          <h2 className="mt-3 text-2xl font-black text-ink sm:text-3xl">Des options techniques visibles avant validation.</h2>
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
            <h3 className="mt-3 text-xl font-black leading-tight text-ink sm:text-2xl">Un seul dossier pour le devis, le paiement, le support et la livraison.</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Kendronics sert de couche opérationnelle entre vos fichiers, les partenaires de fabrication, la logistique et le support client.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3">
              {['Prix lisible', 'Support Gerber', 'Suivi commande', 'Livraison Afrique'].map((item) => (
                <div key={item} className="flex min-h-12 items-center border border-line bg-slate-50 p-2.5 text-[13px] font-black leading-5 text-ink sm:min-h-14 sm:p-3 sm:text-sm">{item}</div>
              ))}
            </div>
          </div>
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
          <h2 className="mt-3 text-2xl font-black text-ink sm:text-3xl">Les réponses utiles avant de commander.</h2>
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
