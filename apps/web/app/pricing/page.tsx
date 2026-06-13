import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Section } from '../../components/ui/Section';

const heroImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=85';

const formulaParts = [
  ['Coût de fabrication partenaire', 'Coût de carte ou d’assemblage indiqué par le partenaire externe pour les specs sélectionnées.'],
  ['Traitement partenaire', 'Préparation, emballage ou coûts opérationnels côté partenaire attachés à la production.'],
  ['Logistique Chine vers France', 'Acheminement depuis le lieu de production partenaire vers le flux de coordination France quand applicable.'],
  ['Traitement France', 'Réception, coordination, documentation et routage dans la couche logistique France.'],
  ['Livraison France vers Afrique', 'Livraison vers le pays africain sélectionné, avec transporteur et zone de destination.'],
  ['Frais de paiement', 'Frais prestataire et traitement checkout pour carte ou flux Mobile Money compatibles.'],
  ['Frais de service Kendronics', 'Frais plateforme pour devis, coordination, support, suivi et traitement opérationnel.'],
  ['Marge de risque douane/livraison', 'Tampon optionnel quand destination, douane, transporteur ou incertitude de livraison le justifient.'],
];

const priceDrivers = [
  ['Pays', 'Les routes, la douane, les transporteurs et le dernier kilomètre varient selon la destination.'],
  ['Quantité', 'Les petits lots portent plus de frais fixes par carte ; les volumes les répartissent autrement.'],
  ['Dimensions', 'La surface influence matériau, panelisation, coût de fabrication, poids et volume d’expédition.'],
  ['Matériau', 'FR4, flex, aluminium, Rogers, PTFE et autres matériaux ont des disponibilités et coûts différents.'],
  ['Options', 'Couches, finition, cuivre, masque, tests, PCBA, stencils et fonctions avancées modifient revue et coût.'],
];

const breakdownRows = [
  ['Fabrication', 'Coût partenaire, matériau, couches, dimensions, finition, cuivre, tests, PCBA ou stencil.'],
  ['Opérations partenaire', 'Traitement, emballage, préparation production et revue spécifique au devis.'],
  ['Logistique internationale', 'Flux Chine vers France quand applicable, fret, consolidation et préparation d’expédition.'],
  ['Opérations France', 'Traitement France, coordination logistique, documentation, contrôle et routage sortant.'],
  ['Livraison Afrique', 'Planification pays, transporteur, jalons douane et considérations dernier kilomètre.'],
  ['Paiement et plateforme', 'Traitement paiement, frais Kendronics, support, suivi et coordination opérationnelle.'],
  ['Marge de risque', 'Tampon douane ou livraison si la route, destination ou expédition le nécessite.'],
];

const scenarios = [
  {
    title: 'Prototype pour laboratoire étudiant',
    context: 'Petite quantité, FR4 standard, épaisseur courante, finition simple, sans assemblage.',
    why: 'Le prix dépend souvent du minimum de production, de la taille, du pays de destination et de la part transport.',
  },
  {
    title: 'Petite série startup hardware',
    context: 'Quantité plus élevée, specs reproductibles, livraison nécessaire pour test pilote sur un marché africain.',
    why: 'La quantité peut améliorer le coût par carte, tandis que logistique, paiement et destination influencent encore le total.',
  },
  {
    title: 'Demande PCB avancé ou PCBA',
    context: 'Plus de couches, matériau premium, ENIG, cuivre épais, revue assemblage ou besoin stencil.',
    why: 'Les options spéciales peuvent exiger revue partenaire, contrôle composants, traitement supplémentaire, délai plus long et hypothèses logistiques différentes.',
  },
];

const faqs = [
  [
    'Pourquoi ne pas publier des prix fixes ?',
    'Le prix PCB change avec fichiers, dimensions, quantité, matériau, couches, finition, pays, logistique, paiement et disponibilité partenaire. Des prix fixes seraient trompeurs.',
  ],
  [
    'Les scénarios sont-ils des devis finaux ?',
    'Non. Les scénarios expliquent les facteurs de coût. Le devis client vient du configurateur puis peut être confirmé après revue fournisseur et fichier.',
  ],
  [
    'Pourquoi le pays de destination compte ?',
    'La livraison France vers Afrique, la douane, les transporteurs et le risque de livraison varient fortement selon le pays.',
  ],
  [
    'Kendronics ajoute-t-il des frais de service ?',
    'Oui. Les frais de service couvrent devis, coordination, support, suivi, facilitation paiement et traitement logistique.',
  ],
  [
    'Qu’est-ce que la marge de risque ?',
    'Quand elle s’applique, elle couvre l’incertitude douane ou livraison sur les routes où coût et complexité peuvent varier.',
  ],
  [
    'Une demande avancée peut-elle changer après revue ?',
    'Oui. PCB avancé, PCBA, matériau, finition ou logistique peuvent nécessiter une revue partenaire avant prix et délai finaux.',
  ],
];

export default function PricingPage() {
  return (
    <main className="overflow-hidden bg-cloud">
      <Navbar />
      <PricingHero />

      <Section
        id="pricing-formula"
        eyebrow="Structure du prix"
        title="Un prix dynamique basé sur le vrai contexte de commande PCB."
        description="Kendronics structure le prix autour de la fabrication partenaire, du traitement, de la logistique, du paiement, du service plateforme et de la destination."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <Card className="p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Calcul</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-ink">
              Total devis = fabrication + traitement + logistique + paiement + service + marge de risque applicable
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Le configurateur reste le meilleur moyen d’obtenir une estimation actuelle, car le devis dépend de la destination,
              de la quantité, des dimensions, du matériau, de la finition et des options sélectionnées.
            </p>
          </Card>
          <Card glass className="p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Étape recommandée</p>
            <h3 className="mt-2 text-xl font-black text-ink">Configurer une demande complète.</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Le devis reflète le profil sélectionné au lieu de forcer tous les clients dans une grille générique.
            </p>
            <Button href="/quote" className="mt-5 w-full">
              Demander un devis
            </Button>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {formulaParts.map(([title, body]) => (
            <CostCard key={title} title={title} body={body} />
          ))}
        </div>
      </Section>

      <Section
        id="cost-breakdown"
        eyebrow="Détail des coûts"
        title="Ce que le devis cherche à couvrir."
        description="Le total est un prix opérationnel composé, pas seulement un coût de production de carte nue."
      >
        <PricingTable headers={['Zone de coût', 'Ce que cela peut inclure']} rows={breakdownRows} />
      </Section>

      <Section
        eyebrow="Pourquoi le prix change"
        title="Pays, quantité, dimensions, matériau et options comptent tous."
        description="Deux cartes visuellement proches peuvent coûter très différemment une fois dimensions, empilage, destination et traitement inclus."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {priceDrivers.map(([title, body]) => (
            <Card key={title} glass className="p-5">
              <h3 className="text-lg font-black text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        id="order-scenarios"
        eyebrow="Cas de commande"
        title="Scénarios courants qui expliquent les coûts."
        description="Ces exemples montrent pourquoi les commandes diffèrent. Le prix final reste lié à la demande configurée et à la validation fournisseur."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {scenarios.map((scenario) => (
            <Card key={scenario.title} className="overflow-hidden transition duration-300 hover:-translate-y-1">
              <div className="image-reflection relative overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/7285976/pexels-photo-7285976.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt={`${scenario.title} PCB scenario`}
                  className="aspect-[16/10] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-black tracking-tight text-ink">{scenario.title}</h3>
                <p className="mt-4 text-sm font-bold leading-6 text-slate-700">{scenario.context}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{scenario.why}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        id="faq"
        eyebrow="Questions"
        title="Questions de prix avant devis."
        description="En bref : utilisez le configurateur pour le devis client, puis la validation fournisseur et fichier avant production finale."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map(([question, answer]) => (
            <Card key={question} className="p-6">
              <h3 className="text-lg font-black text-ink">{question}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{answer}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="cta" className="pt-4">
        <div className="relative overflow-hidden rounded-3xl bg-deepblue p-8 text-white sm:p-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
          <img
            src="https://images.pexels.com/photos/7174650/pexels-photo-7174650.jpeg?auto=compress&cs=tinysrgb&w=1800"
            alt="Close-up of PCB components"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deepblue via-deepblue/[0.9] to-ink/[0.72]" />
          <div className="relative">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-100">Devis structuré</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Le configurateur est la référence pour votre demande.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-100 sm:text-base">
              Téléversez les fichiers, choisissez les specs, sélectionnez une destination africaine et laissez le devis calculer le contexte production et livraison.
            </p>
          </div>
          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col">
            <Button href="/quote" variant="light">
              Demander un devis
            </Button>
            <Button href="/how-it-works" variant="secondary">
              Parcours client
            </Button>
          </div>
        </div>
      </Section>

      <Footer />
    </main>
  );
}

function PricingHero() {
  return (
    <section className="relative overflow-hidden border-b border-[#d8e1ea] bg-ink pt-[70px] text-white">
      <img src={heroImage} alt="Macro close-up of a printed circuit board" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.82] to-deepblue/[0.56]" />
      <div className="relative mx-auto max-w-[1368px] px-4 py-8 sm:px-6 sm:py-10 lg:px-5 lg:py-12">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-xl border border-white/[0.18] bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur-xl">
            Logique de prix
          </p>
          <h1 className="mt-5 text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Des devis dynamiques basés sur votre PCB et votre chemin de livraison.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
            Kendronics ne publie pas de grille PCB statique. Le devis évolue avec le coût partenaire,
            la logistique, le pays de destination, le paiement, les frais de service et les options sélectionnées.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button href="/quote">Configurer un devis</Button>
            <Button href="#pricing-formula" variant="secondary">
              Voir le calcul
            </Button>
          </div>
        </div>

        <Card glass className="hidden p-5 text-white">
          <div className="image-reflection relative overflow-hidden rounded-2xl">
            <img
              src="https://cdn.pixabay.com/photo/2022/02/02/10/09/printed-circuit-board-6979572_1280.jpg"
              alt="Printed circuit board detail"
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/[0.72] via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/[0.18] bg-white/[0.12] p-4 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-100">Entrées devis</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm font-black">
                {['Specs', 'Pays', 'Options'].map((item) => (
                  <span key={item} className="rounded-xl bg-white/12 px-3 py-3">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

function CostCard({ title, body }: { title: string; body: string }) {
  return (
    <Card glass className="p-5">
      <h3 className="text-base font-black text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
    </Card>
  );
}

function PricingTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-5 py-4">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row) => (
              <tr key={row.join(':')} className="align-top">
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`} className={`px-5 py-4 ${index === 0 ? 'font-black text-deepblue' : 'leading-6 text-slate-600'}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
