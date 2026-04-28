import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Section } from '../../components/ui/Section';

const heroImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=85';

const timelineSteps = [
  {
    title: 'Design your PCB',
    body: 'Create the board in KiCad, EasyEDA, Altium, Eagle, or another EDA tool that can export production Gerbers.',
  },
  {
    title: 'Export Gerber ZIP',
    body: 'Package copper layers, solder mask, silkscreen, drill files, outline data, and other manufacturing outputs into one ZIP file.',
  },
  {
    title: 'Upload to Kendronics',
    body: 'Submit the Gerber ZIP through the quote flow so Kendronics can attach the files to your customer request.',
  },
  {
    title: 'Configure PCB specs',
    body: 'Choose layers, dimensions, quantity, material, thickness, solder mask, surface finish, assembly needs, and destination country.',
  },
  {
    title: 'Get a real-time quote',
    body: 'Review a customer-facing quote that combines board configuration, logistics assumptions, payment handling, and destination context.',
  },
  {
    title: 'Pay securely',
    body: 'Pay by Stripe card checkout where available, with Mobile Money-ready architecture for supported payment flows.',
  },
  {
    title: 'Kendronics coordinates the order',
    body: 'Kendronics places the order with a trusted external manufacturing partner. Kendronics is the intermediary and logistics platform, not the factory.',
  },
  {
    title: 'Partner manufactures the PCB',
    body: 'The external partner produces the boards according to the submitted files and selected manufacturing options.',
  },
  {
    title: 'France logistics processing',
    body: 'The order is received, checked, and processed through the France coordination flow before onward shipment.',
  },
  {
    title: 'Route to Africa',
    body: 'The shipment is routed toward the selected African destination with country-aware delivery and customs milestones.',
  },
  {
    title: 'Track the order',
    body: 'Customers follow public-safe tracking updates, timeline milestones, carrier details, and estimated delivery when available.',
  },
];

const gerberGuide = [
  ['Board outline', 'Include the mechanical outline so the manufacturing partner can identify final dimensions and cut paths.'],
  ['Copper layers', 'Export every required copper layer, from top and bottom copper to internal layers on multilayer boards.'],
  ['Solder mask and silkscreen', 'Include mask and legend layers so production markings and exposed copper areas are clear.'],
  ['Drill files', 'Add plated and non-plated drill data so holes, vias, and mounting points are interpreted correctly.'],
  ['Single ZIP package', 'Upload one compressed Gerber ZIP, named clearly enough to match your project or revision.'],
  ['Assembly extras', 'For PCBA requests, prepare BOM and CPL files so support can review assembly readiness separately.'],
];

const paymentPoints = [
  ['Stripe card checkout', 'Card payments are handled through Stripe checkout flows where available. Kendronics does not ask customers to send card details through support messages.'],
  ['Mobile Money-ready path', 'The platform architecture includes Mobile Money-oriented payment handling for markets and providers where it is enabled.'],
  ['Quote before payment', 'Customers configure the order and review the quote before moving into payment, so the request context stays attached to fulfillment.'],
];

const deliveryPoints = [
  ['External production', 'Manufacturing is performed by trusted external PCB partners, not by Kendronics-owned factories.'],
  ['France coordination', 'Kendronics uses a France-based coordination layer for order processing, logistics handling, and shipment preparation.'],
  ['African destination routing', 'Delivery planning accounts for the selected destination country, carrier availability, customs milestones, and tracking updates.'],
];

const faqs = [
  [
    'Is Kendronics a PCB manufacturer?',
    'No. Kendronics is an ordering, payment, coordination, logistics, tracking, and support platform that works with external manufacturing partners.',
  ],
  [
    'Can I use KiCad or EasyEDA files directly?',
    'The quote flow expects production exports, usually a Gerber ZIP. Native design files can be useful for support context, but Gerbers are the manufacturing handoff.',
  ],
  [
    'What happens if my Gerber ZIP has an issue?',
    'Use Gerber review assistance or support tickets. The goal is to resolve file questions before they create production or delivery delays.',
  ],
  [
    'Will public tracking show supplier details?',
    'No. Public tracking is customer-safe and avoids sensitive supplier, admin, and pricing data.',
  ],
];

const componentPlan = [
  ['Hero', '#hero'],
  ['Timeline', '#timeline'],
  ['Gerber guide', '#gerber-file-guide'],
  ['Payment explanation', '#payment-explanation'],
  ['Delivery explanation', '#delivery-explanation'],
  ['FAQ preview', '#faq-preview'],
  ['CTA', '#cta'],
];

export default function HowItWorksPage() {
  return (
    <main className="overflow-hidden bg-cloud">
      <Navbar />
      <HowItWorksHero />

      <Section
        id="journey"
        eyebrow="Order journey"
        title="From design files to tracked delivery."
        description="The Kendronics workflow keeps the customer journey clear while separating customer-facing coordination from external manufacturing operations."
      >
        <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
          <Card glass className="p-6 lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Component plan</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">Page structure</h2>
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
        eyebrow="Gerber file guide"
        title="Prepare a clean ZIP before requesting a quote."
        description="A complete Gerber package helps Kendronics coordinate the request more smoothly with external manufacturing partners."
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_25rem]">
          <div className="grid gap-4 md:grid-cols-2">
            {gerberGuide.map(([title, body]) => (
              <Card key={title} className="p-5 transition duration-300 hover:-translate-y-1 hover:shadow-glass">
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
              <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">File readiness</p>
              <h3 className="mt-2 text-xl font-black text-ink">Gerbers are the production handoff.</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Your EDA tool remains your design environment. Kendronics uses exported production files to quote, review, coordinate, and track the order request.
              </p>
            </div>
          </Card>
        </div>
      </Section>

      <Section
        id="payment-explanation"
        eyebrow="Payment explanation"
        title="Pay after quote review, before partner fulfillment."
        description="Payment is part of the customer-facing workflow. It helps keep the quote, order, logistics, and tracking records connected."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {paymentPoints.map(([title, body]) => (
            <InfoCard key={title} title={title} body={body} />
          ))}
        </div>
      </Section>

      <Section
        id="delivery-explanation"
        eyebrow="Delivery explanation"
        title="External manufacturing, France logistics, African delivery."
        description="Kendronics coordinates the path between partner production and customer delivery. It does not present itself as the factory producing the boards."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {deliveryPoints.map(([title, body]) => (
            <InfoCard key={title} title={title} body={body} />
          ))}
        </div>
      </Section>

      <Section
        id="faq-preview"
        eyebrow="FAQ preview"
        title="Common questions before ordering."
        description="These answers set expectations before a customer uploads files or pays for a PCB order."
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
        <div className="relative overflow-hidden rounded-3xl bg-deepblue p-8 text-white shadow-2xl shadow-sky-950/25 sm:p-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
          <img
            src="https://images.pexels.com/photos/7174650/pexels-photo-7174650.jpeg?auto=compress&cs=tinysrgb&w=1800"
            alt="Close-up of electronic board components"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deepblue via-deepblue/[0.9] to-ink/[0.7]" />
          <div className="relative">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-100">Ready to begin?</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Upload Gerbers, configure specs, and get a quote.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-100 sm:text-base">
              Kendronics will keep the customer-facing order record connected across quote, payment, partner coordination, France logistics, Africa delivery, tracking, and support.
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
    <section id="hero" className="relative min-h-[78vh] overflow-hidden bg-ink text-white">
      <img src={heroImage} alt="Macro close-up of a printed circuit board" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.82] to-deepblue/[0.56]" />
      <div className="relative mx-auto grid min-h-[78vh] max-w-7xl gap-10 px-4 pb-24 pt-36 sm:px-6 lg:grid-cols-[1fr_26rem] lg:items-center lg:px-8">
        <div>
          <p className="inline-flex rounded-xl border border-white/[0.18] bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur-xl">
            How it works
          </p>
          <h1 className="mt-7 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            A clear path from PCB design to tracked African delivery.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            Kendronics is an intermediary and logistics platform. Customers upload production files, receive a quote, pay securely, and track orders that are manufactured by external PCB partners.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/quote">Commencer le devis</Button>
            <Button href="#journey" variant="secondary">
              See Timeline
            </Button>
          </div>
        </div>

        <Card glass className="hidden p-5 text-white lg:block">
          <div className="image-reflection relative overflow-hidden rounded-2xl">
            <img
              src="https://cdn.pixabay.com/photo/2022/02/02/10/09/printed-circuit-board-6979572_1280.jpg"
              alt="Printed circuit board manufacturing visual"
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/[0.72] via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/[0.18] bg-white/[0.12] p-4 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-100">Journey</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm font-black">
                {['Design', 'Pay', 'Track'].map((item) => (
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
    <Card className="p-6 transition duration-300 hover:-translate-y-1 hover:shadow-glass">
      <h3 className="text-lg font-black text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
    </Card>
  );
}
