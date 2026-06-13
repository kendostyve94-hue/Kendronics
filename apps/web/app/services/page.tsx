import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Section } from '../../components/ui/Section';

const heroImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=85';

const serviceImages = [
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85',
  'https://cdn.pixabay.com/photo/2022/02/02/10/09/printed-circuit-board-6979572_1280.jpg',
  'https://images.pexels.com/photos/7285976/pexels-photo-7285976.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/7174650/pexels-photo-7174650.jpeg?auto=compress&cs=tinysrgb&w=1200',
];

const services = [
  {
    id: 'pcb-standard',
    title: 'Commande de PCB prototype',
    category: 'Prototype',
    image: serviceImages[0],
    what: 'Un parcours guidé pour les premières révisions de PCB, les prototypes et les cartes de validation.',
    audience: 'Étudiants, makers, laboratoires et fondateurs qui testent un nouveau circuit avant de passer au volume.',
    benefit: 'Les utilisateurs africains peuvent configurer, payer et suivre leurs prototypes sans gérer plusieurs interfaces fournisseurs.',
    cta: 'Deviser un prototype',
  },
  {
    id: 'pcb-petit-lot',
    title: 'Commande PCB petit lot',
    category: 'Production',
    image: serviceImages[1],
    what: 'Commande reproductible pour les petites séries lorsque le design est prêt pour pilote, validation terrain ou déploiement limité.',
    audience: 'Startups hardware, laboratoires, équipes de réparation et équipes produit qui ont besoin de petites quantités fiables.',
    benefit: 'Les équipes planifient avec des jalons clairs et une logistique adaptée au pays de destination.',
    cta: 'Lancer un petit lot',
  },
  {
    id: 'pcb-avance',
    title: 'Demande PCB avancé',
    category: 'Sur mesure',
    image: serviceImages[0],
    what: 'Un parcours pour les cartes qui demandent une revue technique, un empilage spécial, des contraintes serrées ou des spécifications non standards.',
    audience: 'Équipes travaillant sur impédance contrôlée, routage dense, matériaux spéciaux ou designs complexes.',
    benefit: 'Les équipes africaines peuvent transmettre leurs exigences avancées pour coordination avec des partenaires adaptés.',
    cta: 'Demander une revue',
  },
  {
    id: 'pcba',
    title: 'Demande PCBA',
    category: 'Assemblage',
    image: serviceImages[2],
    what: 'Un parcours d’assemblage pour les commandes qui demandent BOM, CPL et vérification avant production.',
    audience: 'Équipes qui passent de cartes nues vers prototypes assemblés, pilotes ou matériel de validation.',
    benefit: 'Les utilisateurs centralisent PCB, assemblage, paiement, support et suivi au même endroit.',
    cta: 'Demander un PCBA',
  },
  {
    id: 'stencil',
    title: 'Commande stencil SMT',
    category: 'Assemblage',
    image: serviceImages[3],
    what: 'Assistance de commande pochoir pour l assemblage CMS, la pate a braser et les petites productions.',
    audience: 'Laboratoires, ateliers et petits fabricants qui assemblent localement ou préparent une série contrôlée.',
    benefit: 'Le stencil peut être planifié avec la même commande que le PCB.',
    cta: 'Deviser un stencil',
  },
  {
    id: 'assistance-technique',
    title: 'Assistance revue Gerber',
    category: 'Fichiers',
    image: serviceImages[2],
    what: 'Assistance pour vérifier les fichiers de production avant de poursuivre la commande.',
    audience: 'Ingénieurs qui veulent sécuriser l’export Gerber, les options de carte ou la préparation avant paiement.',
    benefit: 'Réduit les retards causés par des fichiers incomplets ou ambigus.',
    cta: 'Téléverser les fichiers',
  },
  {
    id: 'paiement',
    title: 'Facilitation du paiement',
    category: 'Paiement',
    image: serviceImages[1],
    what: 'Gestion sécurisée du paiement des commandes PCB, avec paiement carte et architecture prête pour Mobile Money.',
    audience: 'Clients qui veulent un paiement plus simple pour l’achat PCB international.',
    benefit: 'Les acheteurs africains disposent d’un parcours de paiement centralisé.',
    cta: 'Voir le prix',
  },
  {
    id: 'logistique',
    title: 'Livraison Afrique et coordination logistique',
    category: 'Logistique',
    image: serviceImages[3],
    what: 'Coordination de livraison selon le pays, entre partenaires de fabrication, flux France et destinations africaines.',
    audience: 'Équipes qui expédient des cartes vers l’Afrique et veulent de la visibilité sur les délais.',
    benefit: 'Les utilisateurs planifient avec contexte pays, douane et mises à jour pratiques.',
    cta: 'Planifier la livraison',
  },
  {
    id: 'suivi',
    title: 'Suivi de commande',
    category: 'Visibilité',
    image: serviceImages[0],
    what: 'Une expérience de suivi publique et sécurisée pour statut, timeline, transporteur et estimation de livraison.',
    audience: 'Clients et équipes qui veulent suivre l’avancée sans accéder aux données admin ou fournisseur.',
    benefit: 'Les équipes gardent de la visibilité du paiement jusqu’à la livraison.',
    cta: 'Suivre une commande',
    href: '/tracking',
  },
  {
    id: 'support',
    title: 'Tickets de support professionnels',
    category: 'Support',
    image: serviceImages[2],
    what: 'Tickets structurés pour les questions de commande, livraison, fichiers et suivi opérationnel.',
    audience: 'Clients qui ont besoin d’un support fiable sur devis, paiement, production ou expédition.',
    benefit: 'Les équipes disposent d’un canal clair au lieu de messages dispersés.',
    cta: 'Contacter le support',
    href: '#support-options',
  },
];

const workflowSteps = [
  ['Choisir', 'Sélectionnez prototype, petit lot, assemblage, stencil ou assistance technique.'],
  ['Configurer', 'Partagez fichiers, pays de destination, quantités et exigences techniques.'],
  ['Coordonner', 'Kendronics transmet la demande aux partenaires de fabrication et de logistique adaptés.'],
  ['Suivre', 'Suivez les jalons client du paiement à la livraison.'],
];

export default function ServicesPage() {
  return (
    <main className="overflow-hidden bg-cloud">
      <Navbar />
      <ServicesHero />

      <Section
        id="services-grid"
        eyebrow="Catalogue de services"
        title="Une couche opérationnelle pour commandes PCB, paiements et livraison en Afrique."
        description="Kendronics n’est pas une usine PCB. Nous aidons les clients à configurer leurs commandes, coordonner avec des partenaires externes, faciliter le paiement et suivre la livraison."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.title} service={service} />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Connexion des services"
        title="Un seul parcours, de la demande à la livraison suivie."
        description="Le catalogue permet de passer d’une demande technique au devis, au paiement, à la coordination et au support sans perdre le contexte."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {workflowSteps.map(([title, body], index) => (
            <Card key={title} glass className="p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-deepblue text-sm font-black text-white">
                {index + 1}
              </span>
              <h3 className="mt-5 text-lg font-black text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="support-options" className="pt-4">
        <div className="relative overflow-hidden rounded-3xl bg-deepblue p-8 text-white sm:p-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
          <img
            src="https://images.pexels.com/photos/7285976/pexels-photo-7285976.jpeg?auto=compress&cs=tinysrgb&w=1800"
            alt="Engineer inspecting a printed circuit board"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deepblue via-deepblue/[0.9] to-ink/[0.7]" />
          <div className="relative">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-100">Parcours client</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Commencez par un devis. Passez au support quand une revue humaine est nécessaire.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-100 sm:text-base">
              La plupart des services commencent par la configuration. PCB avancé, PCBA, revue Gerber, logistique et support utilisent ensuite ce contexte pour guider le suivi.
            </p>
          </div>
          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col">
            <Button href="/quote" variant="light">
              Demander un devis
            </Button>
            <Button href="/tracking" variant="secondary">
              Suivre une commande
            </Button>
          </div>
        </div>
      </Section>

      <Footer />
    </main>
  );
}

function ServicesHero() {
  return (
    <section className="relative overflow-hidden border-b border-[#d8e1ea] bg-ink pt-[70px] text-white">
      <img src={heroImage} alt="Macro close-up of a printed circuit board" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.82] to-deepblue/[0.56]" />
      <div className="relative mx-auto max-w-[1368px] px-4 py-8 sm:px-6 sm:py-10 lg:px-5 lg:py-12">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-xl border border-white/[0.18] bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur-xl">
            Services PCB pour l’Afrique
          </p>
          <h1 className="mt-5 text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Commande PCB et coordination logistique, sans prétendre être l’usine.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
            Kendronics aide les équipes hardware africaines à demander PCB, assemblage, stencils, revues, paiements, suivi et support dans un parcours clair.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button href="/quote">Demander un devis</Button>
            <Button href="#services-grid" variant="secondary">
              Explorer les services
            </Button>
          </div>
        </div>

        <Card glass className="hidden p-5 text-white">
          <div className="image-reflection relative overflow-hidden rounded-2xl">
            <img
              src="https://images.pexels.com/photos/7174650/pexels-photo-7174650.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Close-up of electronic board components"
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/[0.72] via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/[0.18] bg-white/[0.12] p-4 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-100">Parcours service</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm font-black">
                {['Devis', 'Coordonner', 'Suivre'].map((item) => (
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

function ServiceCard({
  service,
}: {
  service: {
    title: string;
    id: string;
    category: string;
    image: string;
    what: string;
    audience: string;
    benefit: string;
    cta: string;
    href?: string;
  };
}) {
  return (
    <Card id={service.id} className="group flex h-full scroll-mt-36 flex-col overflow-hidden transition duration-300 hover:-translate-y-1">
      <div className="image-reflection relative overflow-hidden">
        <img
          src={service.image}
          alt={`${service.title} PCB visual`}
          className="aspect-[16/10] w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
        <span className="absolute left-4 top-4 rounded-xl border border-white/[0.18] bg-white/[0.14] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white backdrop-blur-xl">
          {service.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h2 className="text-xl font-black tracking-tight text-ink">{service.title}</h2>
        <ServiceDetail label="Ce que c’est" value={service.what} />
        <ServiceDetail label="Pour qui" value={service.audience} />
        <ServiceDetail label="Bénéfice pour l’Afrique" value={service.benefit} />
        <a
          href={service.href ?? '/quote'}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-deepblue px-4 text-sm font-black text-white transition hover:bg-signal"
        >
          {service.cta}
        </a>
      </div>
    </Card>
  );
}

function ServiceDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{value}</p>
    </div>
  );
}
