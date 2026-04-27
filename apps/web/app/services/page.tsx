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
    title: 'PCB prototype ordering',
    category: 'Prototype',
    image: serviceImages[0],
    what: 'A guided ordering flow for early PCB revisions, first articles, and engineering validation boards.',
    audience: 'Students, makers, research labs, and founders testing a new circuit before committing to volume.',
    benefit: 'African users get a predictable way to configure, pay for, and track prototype boards without juggling overseas supplier workflows.',
    cta: 'Quote a prototype',
  },
  {
    title: 'Small-batch PCB ordering',
    category: 'Production',
    image: serviceImages[1],
    what: 'Repeatable ordering for low-volume PCB runs when a design is ready for pilots, demos, or limited deployment.',
    audience: 'Hardware startups, university labs, repair teams, and product teams that need consistent small quantities.',
    benefit: 'Teams can plan around clear delivery milestones and country-aware logistics instead of rebuilding procurement from scratch.',
    cta: 'Start a small batch',
  },
  {
    title: 'Advanced PCB request',
    category: 'Custom',
    image: serviceImages[0],
    what: 'A request path for boards that need extra review, special stackups, tighter constraints, or non-standard specifications.',
    audience: 'Engineering teams working on controlled impedance, dense layouts, unusual materials, or more complex designs.',
    benefit: 'African teams can submit advanced requirements through Kendronics for coordination with suitable external manufacturing partners.',
    cta: 'Request review',
  },
  {
    title: 'PCBA request',
    category: 'Assembly',
    image: serviceImages[2],
    what: 'An assembly request workflow for PCB orders that need BOM, CPL, and production-readiness review.',
    audience: 'Teams moving from bare boards into assembled prototypes, pilot units, or validation hardware.',
    benefit: 'Users can centralize board and assembly coordination while keeping production details, payment, support, and tracking in one place.',
    cta: 'Request PCBA',
  },
  {
    title: 'SMT stencil ordering',
    category: 'Assembly',
    image: serviceImages[3],
    what: 'Stencil ordering support for surface-mount assembly, repeatable solder paste application, and bench production.',
    audience: 'Labs, workshops, and small manufacturers assembling boards locally or preparing controlled assembly runs.',
    benefit: 'African users can add stencil planning to the same procurement path as their PCB order instead of sourcing it separately.',
    cta: 'Quote a stencil',
  },
  {
    title: 'Gerber review assistance',
    category: 'Files',
    image: serviceImages[2],
    what: 'Customer-facing assistance for checking uploaded production files before an order moves deeper into fulfillment.',
    audience: 'Engineers who want confidence around Gerber exports, board options, or production-readiness before paying.',
    benefit: 'Reduces avoidable delays caused by unclear fabrication files, especially when international lead times matter.',
    cta: 'Upload files',
  },
  {
    title: 'Payment facilitation',
    category: 'Payments',
    image: serviceImages[1],
    what: 'Secure payment handling for PCB orders, with card checkout in place and Mobile Money-ready architecture.',
    audience: 'Customers who need a cleaner payment path for international PCB procurement.',
    benefit: 'African buyers get a single checkout-oriented experience instead of fragmented supplier payment arrangements.',
    cta: 'Get pricing',
  },
  {
    title: 'Africa delivery and logistics coordination',
    category: 'Logistics',
    image: serviceImages[3],
    what: 'Country-aware delivery coordination across manufacturing partners, the France operations flow, and African destinations.',
    audience: 'Teams shipping boards to African markets that need visibility into estimated delivery and fulfillment stages.',
    benefit: 'Users can plan around destination-country context, customs milestones, and practical delivery updates.',
    cta: 'Plan delivery',
  },
  {
    title: 'Order tracking',
    category: 'Visibility',
    image: serviceImages[0],
    what: 'A public and customer-safe tracking experience for order status, timeline, carrier details, and delivery estimates.',
    audience: 'Customers, teams, and stakeholders who need progress visibility without access to admin or supplier data.',
    benefit: 'African teams can keep projects moving with clear milestone updates from payment through delivery.',
    cta: 'Track an order',
    href: '/tracking',
  },
  {
    title: 'Professional support tickets',
    category: 'Support',
    image: serviceImages[2],
    what: 'Structured support tickets for order questions, delivery updates, file issues, and operational follow-up.',
    audience: 'Customers who need reliable support around quotes, payments, production coordination, or shipment status.',
    benefit: 'Teams get an accountable support channel instead of scattered messages during time-sensitive hardware work.',
    cta: 'Contact support',
    href: '#support-options',
  },
];

const workflowSteps = [
  ['Choose', 'Select prototype, batch, assembly, stencil, or support-led service needs.'],
  ['Configure', 'Share files, destination country, quantities, and technical requirements.'],
  ['Coordinate', 'Kendronics routes the request through trusted external manufacturing and logistics partners.'],
  ['Track', 'Follow customer-safe milestones through payment, fulfillment, delivery, and support.'],
];

export default function ServicesPage() {
  return (
    <main className="overflow-hidden bg-cloud">
      <Navbar />
      <ServicesHero />

      <Section
        id="services-grid"
        eyebrow="Service catalog"
        title="A premium operating layer for PCB orders, payments, and Africa delivery."
        description="Kendronics is not a PCB factory. We help customers configure orders, coordinate with trusted external manufacturing partners, facilitate payment, and track delivery to African destinations."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.title} service={service} />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="How services connect"
        title="One flow from request to tracked delivery."
        description="The service catalog is designed so customers can move from a technical request into quoting, payment, fulfillment coordination, and support without losing context."
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
        <div className="relative overflow-hidden rounded-3xl bg-deepblue p-8 text-white shadow-2xl shadow-sky-950/25 sm:p-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
          <img
            src="https://images.pexels.com/photos/7285976/pexels-photo-7285976.jpeg?auto=compress&cs=tinysrgb&w=1800"
            alt="Engineer inspecting a printed circuit board"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deepblue via-deepblue/[0.9] to-ink/[0.7]" />
          <div className="relative">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-100">CTA strategy</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Start with a quote. Escalate to support when the request needs human review.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-100 sm:text-base">
              Most services route customers to the quote flow first. Advanced PCB, PCBA, Gerber review, logistics, and support use that request context to guide follow-up without exposing supplier or admin details.
            </p>
          </div>
          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col">
            <Button href="/quote" variant="light">
              Get Quote
            </Button>
            <Button href="/tracking" variant="secondary">
              Track Order
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
    <section className="relative min-h-[78vh] overflow-hidden bg-ink text-white">
      <img src={heroImage} alt="Macro close-up of a printed circuit board" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.82] to-deepblue/[0.56]" />
      <div className="relative mx-auto grid min-h-[78vh] max-w-7xl gap-10 px-4 pb-24 pt-36 sm:px-6 lg:grid-cols-[1fr_26rem] lg:items-center lg:px-8">
        <div>
          <p className="inline-flex rounded-xl border border-white/[0.18] bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur-xl">
            PCB services for Africa
          </p>
          <h1 className="mt-7 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            PCB ordering and logistics coordination, without pretending to be the factory.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            Kendronics helps African hardware teams request boards, assembly, stencils, reviews, payments, tracking, and support through a clear customer-facing workflow.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/quote">Get Quote</Button>
            <Button href="#services-grid" variant="secondary">
              Explore services
            </Button>
          </div>
        </div>

        <Card glass className="hidden p-5 text-white lg:block">
          <div className="image-reflection relative overflow-hidden rounded-2xl">
            <img
              src="https://images.pexels.com/photos/7174650/pexels-photo-7174650.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Close-up of electronic board components"
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/[0.72] via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/[0.18] bg-white/[0.12] p-4 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-100">Service path</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm font-black">
                {['Quote', 'Coordinate', 'Track'].map((item) => (
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
    <Card className="group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-glass">
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
        <ServiceDetail label="What it is" value={service.what} />
        <ServiceDetail label="Who it is for" value={service.audience} />
        <ServiceDetail label="Benefit for African users" value={service.benefit} />
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
