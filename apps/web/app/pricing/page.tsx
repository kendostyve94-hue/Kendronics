import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Section } from '../../components/ui/Section';

const heroImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=85';

const formulaParts = [
  ['Partner manufacturing cost', 'The base board or assembly cost quoted by the external manufacturing partner for the selected specs.'],
  ['Partner handling', 'Handling, preparation, packing, or partner-side operational costs attached to production.'],
  ['China to France logistics', 'Inbound movement from partner production location toward the France coordination flow when applicable.'],
  ['France processing/logistics', 'Receiving, processing, coordination, documentation, and routing work handled through the France logistics layer.'],
  ['France to Africa delivery', 'Outbound delivery to the selected African destination country, carrier, and delivery zone.'],
  ['Payment processing', 'Payment provider fees and checkout handling for card or supported Mobile Money-oriented flows.'],
  ['Kendronics service fee', 'The platform fee for quote flow, coordination, support, tracking, and operational handling.'],
  ['Customs/delivery risk buffer', 'An optional buffer when destination, customs, carrier, or delivery uncertainty makes risk planning necessary.'],
];

const priceDrivers = [
  ['Country', 'Delivery lanes, customs complexity, carrier availability, and last-mile handling differ by destination.'],
  ['Quantity', 'Small runs can carry higher per-board setup and logistics share; larger runs may distribute fixed costs differently.'],
  ['Dimensions', 'Board area affects material use, panelization, manufacturing cost, weight, and shipping volume.'],
  ['Material', 'FR4, Flex, Aluminum, Rogers, PTFE, and other materials have different partner availability and cost profiles.'],
  ['Options', 'Layers, finish, copper weight, solder mask, testing, PCBA, stencils, and advanced features change partner review and cost.'],
];

const breakdownRows = [
  ['Manufacturing', 'Partner manufacturing cost, material, layers, dimensions, finish, copper weight, testing, PCBA, stencil needs.'],
  ['Partner operations', 'Partner handling, packaging, production-side preparation, and quote-specific review effort.'],
  ['International logistics', 'China to France logistics when applicable, freight handling, consolidation, and shipment preparation.'],
  ['France operations', 'France processing, logistics coordination, documentation, inspection flow, and outbound routing.'],
  ['Africa delivery', 'Country-aware delivery planning, carrier selection, customs milestones, and last-mile considerations.'],
  ['Payment and platform', 'Payment processing, Kendronics service fee, support, tracking, and operational coordination.'],
  ['Risk buffer', 'Customs or delivery uncertainty buffer if the lane, destination, or shipment profile requires it.'],
];

const scenarios = [
  {
    title: 'Prototype board for a student lab',
    context: 'Small quantity, standard FR4, common thickness, simple finish, no assembly.',
    why: 'The price is usually driven by minimum production economics, board size, chosen destination country, and shipping share.',
  },
  {
    title: 'Small-batch hardware startup run',
    context: 'Higher quantity, repeatable specs, delivery needed for pilot testing in an African market.',
    why: 'Quantity may improve per-board economics, while logistics, payment, and destination-country delivery still affect the total.',
  },
  {
    title: 'Advanced PCB or PCBA request',
    context: 'More layers, premium material, ENIG, heavier copper, assembly review, or stencil needs.',
    why: 'Special options can require partner review, component checks, extra handling, longer lead time, and different logistics assumptions.',
  },
];

const faqs = [
  [
    'Why not publish fixed prices?',
    'PCB pricing changes with files, board dimensions, quantity, material, layers, finish, destination country, logistics lane, payment method, and partner availability. Fixed prices would be misleading.',
  ],
  [
    'Are scenario descriptions final quotes?',
    'No. Scenario descriptions explain cost drivers. A customer quote is generated from the configurator and then confirmed through supplier and file validation.',
  ],
  [
    'Why does destination country matter?',
    'France to Africa delivery, customs handling, carrier availability, and delivery risk can vary significantly by destination country.',
  ],
  [
    'Does Kendronics add a service fee?',
    'Yes. The Kendronics service fee supports quote flow, coordination, support, tracking, payment facilitation, and logistics handling.',
  ],
  [
    'What is the risk buffer?',
    'When applicable, it helps account for customs or delivery uncertainty on lanes where shipment cost or delivery complexity can vary.',
  ],
  [
    'Can advanced requests change after review?',
    'Yes. Advanced PCB, PCBA, material, finish, or logistics requests may need partner review before final price and lead time are confirmed.',
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
        title="Transparent dynamic pricing for real PCB order contexts."
        description="Kendronics structures pricing around partner manufacturing, handling, logistics, payment, platform service, and destination-specific delivery assumptions."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <Card className="p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Calcul</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-ink">
              Total quote = manufacturing + handling + logistics + payment + service + applicable risk buffer
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              The configurator is the best way to see the current result because the quote depends on your destination,
              quantity, dimensions, material, finish, and selected options.
            </p>
          </Card>
          <Card glass className="p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Etape recommandee</p>
            <h3 className="mt-2 text-xl font-black text-ink">Configurer une demande complete.</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              It reflects the selected order profile instead of forcing every customer into a generic price table.
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
        eyebrow="Detail des couts"
        title="What the quote is trying to account for."
        description="The total is a composed operational price, not only a bare board production number."
      >
        <PricingTable headers={['Cost area', 'What it can include']} rows={breakdownRows} />
      </Section>

      <Section
        eyebrow="Why pricing changes"
        title="Country, quantity, dimensions, material, and options all matter."
        description="Two boards that look similar in a screenshot can price very differently once real dimensions, stackup, destination, and handling assumptions are included."
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
        title="Common scenarios that explain cost drivers."
        description="These examples show why different orders price differently. Final customer pricing is tied to the configured request and supplier validation."
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
        title="Pricing questions customers ask before quoting."
        description="The short version: use the configurator for the customer quote, then rely on supplier and file validation before final production."
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
            <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-100">Devis structure</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              The configurator is the source of truth for your order.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-100 sm:text-base">
              Upload files, choose specs, select an African destination, and let the quote flow calculate the current request from the selected production and delivery context.
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
    <section className="relative min-h-[78vh] overflow-hidden bg-ink text-white">
      <img src={heroImage} alt="Macro close-up of a printed circuit board" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.82] to-deepblue/[0.56]" />
      <div className="relative mx-auto grid min-h-[78vh] max-w-7xl gap-10 px-4 pb-24 pt-36 sm:px-6 lg:grid-cols-[1fr_26rem] lg:items-center lg:px-8">
        <div>
          <p className="inline-flex rounded-xl border border-white/[0.18] bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur-xl">
            Logique de prix
          </p>
          <h1 className="mt-7 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            Dynamic quotes built around your real PCB and delivery path.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            Kendronics does not publish static PCB price tables. The quote changes with manufacturing partner cost,
            logistics, destination country, payment processing, service fee, and selected board options.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/quote">Configurer un devis</Button>
            <Button href="#pricing-formula" variant="secondary">
              Voir le calcul
            </Button>
          </div>
        </div>

        <Card glass className="hidden p-5 text-white lg:block">
          <div className="image-reflection relative overflow-hidden rounded-2xl">
            <img
              src="https://cdn.pixabay.com/photo/2022/02/02/10/09/printed-circuit-board-6979572_1280.jpg"
              alt="Printed circuit board detail"
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/[0.72] via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/[0.18] bg-white/[0.12] p-4 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-100">Quote inputs</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm font-black">
                {['Specs', 'Country', 'Options'].map((item) => (
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
