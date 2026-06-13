import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Section } from '../../components/ui/Section';

const heroImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=85';

const timelineSteps = [
  {
    title: 'Concevoir le PCB',
    body: 'Préparez la carte dans KiCad, EasyEDA, Altium, Eagle ou un autre outil capable d’exporter des Gerbers de production.',
  },
  {
    title: 'Exporter le ZIP Gerber',
    body: 'Regroupez couches cuivre, masque de soudure, sérigraphie, perçages, contour et autres fichiers de fabrication dans un seul ZIP.',
  },
  {
    title: 'Téléverser sur Kendronics',
    body: 'Ajoutez le ZIP Gerber dans le parcours de devis afin que les fichiers restent attachés à votre demande client.',
  },
  {
    title: 'Configurer les spécifications',
    body: 'Choisissez couches, dimensions, quantité, matériau, épaisseur, masque, finition, assemblage et pays de destination.',
  },
  {
    title: 'Obtenir une estimation',
    body: 'Consultez un devis client qui combine configuration de carte, hypothèses logistiques, paiement et destination.',
  },
  {
    title: 'Payer de façon sécurisée',
    body: 'Payez par carte via Stripe quand disponible, avec une architecture prévue pour les parcours Mobile Money pris en charge.',
  },
  {
    title: 'Coordination Kendronics',
    body: 'Kendronics coordonne la demande avec un partenaire de fabrication externe. Kendronics reste l’intermédiaire et la plateforme logistique, pas l’usine.',
  },
  {
    title: 'Fabrication partenaire',
    body: 'Le partenaire externe produit les cartes selon les fichiers transmis et les options de fabrication sélectionnées.',
  },
  {
    title: 'Traitement logistique France',
    body: 'La commande est reçue, contrôlée et préparée dans le flux de coordination France avant l’expédition suivante.',
  },
  {
    title: 'Acheminement vers l’Afrique',
    body: 'L’expédition est orientée vers le pays africain sélectionné avec jalons de livraison et de douane adaptés.',
  },
  {
    title: 'Suivre la commande',
    body: 'Les clients suivent les mises à jour publiques, les jalons, le transporteur et l’estimation de livraison quand elle est disponible.',
  },
];

const gerberGuide = [
  ['Contour de carte', 'Ajoutez le contour mécanique pour identifier les dimensions finales et les chemins de découpe.'],
  ['Couches cuivre', 'Exportez toutes les couches cuivre nécessaires, y compris les couches internes pour les cartes multicouches.'],
  ['Masque et sérigraphie', 'Incluez les couches de masque et de légende pour clarifier les marquages et zones de cuivre exposées.'],
  ['Fichiers de perçage', 'Ajoutez les perçages métallisés et non métallisés pour trous, vias et points de montage.'],
  ['ZIP unique', 'Téléversez un seul ZIP Gerber, nommé clairement avec le projet ou la révision.'],
  ['Fichiers assemblage', 'Pour les demandes PCBA, préparez BOM et CPL afin de vérifier l’assemblage séparément.'],
];

const paymentPoints = [
  ['Paiement carte Stripe', 'Les paiements carte passent par Stripe quand disponible. Kendronics ne demande pas d’envoyer des données carte par support.'],
  ['Parcours Mobile Money prêt', 'L’architecture prévoit des flux orientés Mobile Money pour les marchés et prestataires compatibles.'],
  ['Devis avant paiement', 'Le client configure la commande et relit le devis avant paiement afin de garder le contexte attaché au suivi.'],
];

const deliveryPoints = [
  ['Production externe', 'La fabrication est réalisée par des partenaires PCB externes, pas par des usines détenues par Kendronics.'],
  ['Coordination France', 'Kendronics utilise une couche de coordination en France pour traitement, logistique et préparation d’expédition.'],
  ['Destination Afrique', 'La livraison tient compte du pays sélectionné, des transporteurs disponibles, de la douane et du suivi.'],
];

const faqs = [
  [
    'Kendronics est-il un fabricant PCB ?',
    'Non. Kendronics est une plateforme de commande, paiement, coordination, logistique, suivi et support qui travaille avec des partenaires externes.',
  ],
  [
    'Puis-je envoyer directement des fichiers KiCad ou EasyEDA ?',
    'Le devis attend surtout des exports de production, généralement un ZIP Gerber. Les fichiers natifs peuvent aider au support, mais les Gerbers servent de base fabrication.',
  ],
  [
    'Que se passe-t-il si mon ZIP Gerber pose problème ?',
    'Utilisez l’assistance Gerber ou les tickets support. L’objectif est de résoudre les questions fichier avant qu’elles ne créent des retards.',
  ],
  [
    'Le suivi public affiche-t-il les détails fournisseur ?',
    'Non. Le suivi public reste adapté au client et évite les données sensibles fournisseur, admin ou prix.',
  ],
];

const componentPlan = [
  ['Parcours client', '#timeline'],
  ['Préparation Gerber', '#gerber-file-guide'],
  ['Paiement', '#payment-explanation'],
  ['Livraison', '#delivery-explanation'],
  ['Questions utiles', '#faq-preview'],
];

export default function HowItWorksPage() {
  return (
    <main className="overflow-hidden bg-cloud">
      <Navbar />
      <HowItWorksHero />

      <Section
        id="journey"
        eyebrow="Parcours commande"
        title="Du fichier de conception à la livraison suivie."
        description="Le parcours Kendronics garde la demande lisible tout en séparant la coordination client des opérations de fabrication externes."
      >
        <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
          <Card glass className="p-6 lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Parcours</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Sections utiles</h2>
            <div className="mt-5 space-y-3 text-sm font-bold text-slate-600">
              {componentPlan.map(([label, href]) => (
                <a key={label} href={href} className="block rounded-xl border border-slate-200 bg-white px-3 py-3 transition hover:border-sky-200 hover:text-deepblue">
                  {label}
                </a>
              ))}
            </div>
          </Card>

          <div id="timeline" className="grid gap-4 md:grid-cols-2">
            {timelineSteps.map((step, index) => (
              <JourneyStep key={step.title} index={index + 1} title={step.title} body={step.body} />
            ))}
          </div>
        </div>
      </Section>

      <Section
        id="gerber-file-guide"
        eyebrow="Préparation Gerber"
        title="Préparez un ZIP propre avant de demander un devis."
        description="Un dossier Gerber complet aide Kendronics à coordonner la demande plus efficacement avec les partenaires de fabrication."
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_25rem]">
          <div className="grid gap-4 md:grid-cols-2">
            {gerberGuide.map(([title, body]) => (
              <Card key={title} className="p-5 transition duration-300 hover:-translate-y-1">
                <h3 className="text-lg font-black text-ink">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
              </Card>
            ))}
          </div>
          <Card className="overflow-hidden">
            <div className="image-reflection relative overflow-hidden">
              <img
                src="https://images.pexels.com/photos/7285976/pexels-photo-7285976.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Hands inspecting a printed circuit board"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            </div>
            <div className="p-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Fichiers prêts</p>
              <h3 className="mt-2 text-xl font-black text-ink">Les Gerbers sont la base de fabrication.</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Votre outil EDA reste votre environnement de conception. Kendronics utilise les exports de production pour chiffrer, vérifier, coordonner et suivre la demande.
              </p>
            </div>
          </Card>
        </div>
      </Section>

      <Section
        id="payment-explanation"
        eyebrow="Paiement"
        title="Payez après relecture du devis, avant lancement partenaire."
        description="Le paiement fait partie du parcours client et garde devis, commande, logistique et suivi dans le même dossier."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {paymentPoints.map(([title, body]) => (
            <InfoCard key={title} title={title} body={body} />
          ))}
        </div>
      </Section>

      <Section
        id="delivery-explanation"
        eyebrow="Livraison"
        title="Fabrication externe, logistique France, livraison Afrique."
        description="Kendronics coordonne le chemin entre production partenaire et livraison client sans se présenter comme l’usine qui fabrique les cartes."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {deliveryPoints.map(([title, body]) => (
            <InfoCard key={title} title={title} body={body} />
          ))}
        </div>
      </Section>

      <Section
        id="faq-preview"
        eyebrow="Questions utiles"
        title="Questions fréquentes avant commande."
        description="Ces réponses cadrent les attentes avant l’upload de fichiers ou le paiement d’une commande PCB."
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
            alt="Close-up of electronic board components"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deepblue via-deepblue/[0.9] to-ink/[0.7]" />
          <div className="relative">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-100">Prêt à commencer ?</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Téléversez les Gerbers, configurez les specs et obtenez un devis.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-100 sm:text-base">
              Kendronics conserve le dossier client connecté entre devis, paiement, coordination partenaire, logistique France, livraison Afrique, suivi et support.
            </p>
          </div>
          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col">
            <Button href="/quote" variant="light">
              Demander un devis
            </Button>
            <Button href="/services" variant="secondary">
              Voir les services
            </Button>
          </div>
        </div>
      </Section>

      <Footer />
    </main>
  );
}

function HowItWorksHero() {
  return (
    <section id="hero" className="relative overflow-hidden border-b border-[#d8e1ea] bg-ink pt-[70px] text-white">
      <img src={heroImage} alt="Macro close-up of a printed circuit board" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.82] to-deepblue/[0.56]" />
      <div className="relative mx-auto max-w-[1368px] px-4 py-8 sm:px-6 sm:py-10 lg:px-5 lg:py-12">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-xl border border-white/[0.18] bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur-xl">
            Parcours Kendronics
          </p>
          <h1 className="mt-5 text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Un parcours clair de la conception PCB à la livraison suivie en Afrique.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
            Kendronics est une plateforme intermédiaire et logistique. Les clients téléversent leurs fichiers de production, reçoivent un devis, paient de façon sécurisée et suivent des commandes fabriquées par des partenaires PCB externes.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button href="/quote">Commencer le devis</Button>
            <Button href="#journey" variant="secondary">
              Voir les étapes
            </Button>
          </div>
        </div>

        <Card glass className="hidden p-5 text-white">
          <div className="image-reflection relative overflow-hidden rounded-2xl">
            <img
              src="https://cdn.pixabay.com/photo/2022/02/02/10/09/printed-circuit-board-6979572_1280.jpg"
              alt="Printed circuit board manufacturing visual"
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/[0.72] via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/[0.18] bg-white/[0.12] p-4 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-100">Parcours</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm font-black">
                {['Fichier', 'Paiement', 'Suivi'].map((item) => (
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

function JourneyStep({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <Card glass className="relative p-5">
      <div className="flex gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-deepblue text-sm font-black text-white">
          {index}
        </span>
        <div>
          <h3 className="text-lg font-black text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
        </div>
      </div>
    </Card>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <Card className="p-6 transition duration-300 hover:-translate-y-1">
      <h3 className="text-lg font-black text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
    </Card>
  );
}
