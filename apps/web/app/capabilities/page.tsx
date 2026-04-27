import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Section } from '../../components/ui/Section';

const heroImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=85';

const capabilityRows = [
  ['Materials', 'FR4, Flex, Aluminum, Copper Core, Rogers, PTFE Teflon', 'Available through manufacturing partners for standard, flexible, thermal, and RF-focused PCB requests.'],
  ['Layers', '1-2, 4, 6, 8, and higher by request', 'Layer count depends on design complexity, material, stackup, and partner review.'],
  ['Thicknesses', 'Common ranges from 0.4 mm to 2.0 mm, with custom review', 'Useful for compact electronics, standard FR4 boards, rigid panels, and thicker mechanical requirements.'],
  ['Surface finishes', 'HASL lead-free, ENIG, immersion silver, OSP, hard gold by request', 'Finish availability depends on material, application, lead time, and partner capability.'],
  ['Copper weights', '1 oz, 2 oz, and heavier copper by review', 'Higher copper weights support current handling and thermal needs, subject to DFM checks.'],
  ['Solder mask colors', 'Green, black, white, blue, red, yellow, matte variants by availability', 'Color options vary by material and partner manufacturing line.'],
  ['Silkscreen options', 'White, black, and other options by board color and partner support', 'Used for reference designators, polarity marks, logos, and assembly readability.'],
  ['Via options', 'Standard vias, tented vias, filled vias, via-in-pad by review', 'Advanced via structures require file and manufacturability review before confirmation.'],
  ['Electrical testing', 'Flying probe or fixture-based testing where available', 'Helps catch opens and shorts before shipment, especially on production and dense boards.'],
  ['PCBA availability', 'SMT and mixed assembly requests by BOM/CPL review', 'Assembly support is available through partner review, not as an automatic factory guarantee.'],
  ['SMT stencil availability', 'Framed and frameless stencil options by request', 'Useful for local assembly, prototypes, and small-batch solder paste application.'],
];

const materialRows = [
  ['FR4', 'General-purpose rigid PCBs', 'Best default for prototypes and small batches.', 'Broadly available'],
  ['Flex', 'Flexible circuits and bend zones', 'Useful when the PCB must fold or fit constrained enclosures.', 'Partner review'],
  ['Aluminum', 'LED and thermal boards', 'Improves heat spreading for power and lighting applications.', 'Partner review'],
  ['Copper Core', 'High thermal transfer designs', 'Supports demanding thermal paths for power electronics.', 'Advanced review'],
  ['Rogers', 'RF and high-frequency designs', 'Chosen when dielectric control matters more than standard FR4 cost.', 'Advanced review'],
  ['PTFE Teflon', 'Specialized RF or low-loss designs', 'Used for high-frequency or low-loss requirements with tighter constraints.', 'Advanced review'],
];

const finishRows = [
  ['HASL lead-free', 'Cost-conscious prototypes and common FR4 boards', 'Affordable and widely understood, with less flatness than ENIG.'],
  ['ENIG', 'Fine pitch, assembly, and premium prototypes', 'Flat, solderable, and suitable for many assembly-focused designs.'],
  ['OSP', 'Short lifecycle production and simple assembly', 'Plan carefully because shelf life and handling can matter.'],
  ['Immersion silver', 'Signal-sensitive or assembly-focused boards', 'Good solderability, with storage and handling considerations.'],
  ['Hard gold', 'Gold fingers and wear surfaces', 'Used where connector durability matters.'],
];

const advancedOptions = [
  ['Gold fingers', 'Edge connector plating available through partners for card-edge contacts, test fixtures, or repeated insertion requirements.'],
  ['Castellated holes', 'Half-hole board edges for module-style mounting and daughterboard integration, subject to panelization review.'],
  ['Via-in-pad and filled vias', 'Advanced via structures can be reviewed for dense layouts, BGAs, and high-performance routing needs.'],
  ['Controlled impedance review', 'Available through advanced partner requests when stackup, material, and trace geometry need tighter coordination.'],
  ['PCBA request path', 'Assembly availability depends on BOM quality, CPL accuracy, component sourcing, and partner review.'],
  ['SMT stencil request path', 'Stencil options can be coordinated alongside bare board or assembly-oriented orders.'],
];

const visualCards = [
  ['Quote-first', 'Select core specs in the quote flow, then escalate advanced options for review.'],
  ['Partner-reviewed', 'Special materials, vias, finishes, and assembly requests are confirmed through partner capability checks.'],
  ['Africa-aware', 'Capability choices stay connected to logistics, payment, and destination-country delivery planning.'],
];

export default function CapabilitiesPage() {
  return (
    <main className="overflow-hidden bg-cloud">
      <Navbar />
      <CapabilitiesHero />

      <Section
        id="technical-capabilities"
        eyebrow="Technical capability tables"
        title="PCB options available through our manufacturing partners."
        description="These capabilities describe what Kendronics can help customers request and coordinate through external manufacturing partners. Final availability depends on file review, material selection, destination timing, and partner confirmation."
      >
        <CapabilityTable
          headers={['Capability', 'Options', 'Customer note']}
          rows={capabilityRows}
        />
      </Section>

      <Section
        id="material-comparison"
        eyebrow="Material comparison"
        title="Choose the material family that matches the board use case."
        description="FR4 covers most prototypes and small batches. Specialized materials such as Flex, Aluminum, Copper Core, Rogers, and PTFE Teflon are available through manufacturing partners when the design requires them."
      >
        <CapabilityTable
          headers={['Material', 'Typical use', 'Why choose it', 'Availability']}
          rows={materialRows}
        />
      </Section>

      <Section
        id="finish-comparison"
        eyebrow="Finish comparison"
        title="Surface finishes affect solderability, cost, storage, and connector behavior."
        description="Kendronics helps customers select a sensible finish before coordinating the request with partner manufacturing capacity."
      >
        <CapabilityTable
          headers={['Finish', 'Typical fit', 'Practical note']}
          rows={finishRows}
        />
      </Section>

      <Section
        id="advanced-options"
        eyebrow="Advanced options"
        title="Special features for boards that need more than the default quote path."
        description="Advanced features are reviewed through the request context because manufacturability depends on files, stackup, tolerances, and partner capability."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {advancedOptions.map(([title, body]) => (
            <Card key={title} glass className="p-6 transition duration-300 hover:-translate-y-1 hover:shadow-glass">
              <h3 className="text-lg font-black text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        id="partner-note"
        eyebrow="Partner manufacturing note"
        title="Kendronics coordinates capability access. Partners manufacture the boards."
        description="Kendronics is an ordering, payment, logistics, tracking, and support platform. It does not claim to own the factories or production lines behind these capabilities."
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
          <Card className="p-6">
            <h2 className="text-2xl font-black tracking-tight text-ink">How capability requests are handled</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Standard options can move through the quote flow quickly. Specialized materials, heavy copper, gold fingers,
              castellated holes, via-in-pad, controlled impedance, PCBA, and stencil requests may require partner review
              before price, lead time, or manufacturability can be confirmed.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              This keeps the customer experience clear while protecting sensitive supplier, pricing, and admin details.
              Customers see customer-safe order status, support updates, and tracking milestones.
            </p>
          </Card>
          <Card className="overflow-hidden">
            <div className="image-reflection relative overflow-hidden">
              <img
                src="https://images.pexels.com/photos/7285976/pexels-photo-7285976.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Engineer inspecting a printed circuit board"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            </div>
            <div className="p-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Visual strategy</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The page uses real PCB photography, dense comparison tables, and subtle glass cards to communicate technical depth without implying factory ownership.
              </p>
            </div>
          </Card>
        </div>
      </Section>

      <Section id="cta" className="pt-4">
        <div className="relative overflow-hidden rounded-3xl bg-deepblue p-8 text-white shadow-2xl shadow-sky-950/25 sm:p-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
          <img
            src="https://images.pexels.com/photos/7174650/pexels-photo-7174650.jpeg?auto=compress&cs=tinysrgb&w=1800"
            alt="Close-up of PCB components"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deepblue via-deepblue/[0.9] to-ink/[0.72]" />
          <div className="relative">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-100">Ready to configure?</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Start with a quote, then request partner-reviewed options when needed.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-100 sm:text-base">
              Upload Gerbers, choose core specs, select destination country, and use the order context for advanced partner manufacturing review.
            </p>
          </div>
          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col">
            <Button href="/quote" variant="light">
              Get Quote
            </Button>
            <Button href="/services" variant="secondary">
              View Services
            </Button>
          </div>
        </div>
      </Section>

      <Footer />
    </main>
  );
}

function CapabilitiesHero() {
  return (
    <section className="relative min-h-[78vh] overflow-hidden bg-ink text-white">
      <img src={heroImage} alt="Macro close-up of a printed circuit board" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.82] to-deepblue/[0.56]" />
      <div className="relative mx-auto grid min-h-[78vh] max-w-7xl gap-10 px-4 pb-24 pt-36 sm:px-6 lg:grid-cols-[1fr_26rem] lg:items-center lg:px-8">
        <div>
          <p className="inline-flex rounded-xl border border-white/[0.18] bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur-xl">
            Technical capabilities
          </p>
          <h1 className="mt-7 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            Manufacturing options available through our PCB partners.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            Explore materials, stackups, finishes, copper weights, via options, PCBA, and stencil availability that Kendronics can help coordinate through external manufacturing partners.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/quote">Get Quote</Button>
            <Button href="#technical-capabilities" variant="secondary">
              View Tables
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
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-100">Capability path</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm font-black">
                {['Specs', 'Review', 'Quote'].map((item) => (
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

function CapabilityTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
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
