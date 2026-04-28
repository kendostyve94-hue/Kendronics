'use client';

import { useMemo, useState } from 'react';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

type FaqItem = {
  question: string;
  answer: string;
};

type FaqCategory = {
  id: string;
  title: string;
  description: string;
  items: FaqItem[];
};

const heroImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=85';

const faqCategories: FaqCategory[] = [
  {
    id: 'platform-role',
    title: 'Platform role',
    description: 'How Kendronics fits between customers, manufacturing partners, payment, logistics, and support.',
    items: [
      {
        question: 'Is Kendronics a manufacturer?',
        answer:
          'No. Kendronics is an intermediary platform for PCB ordering, payment facilitation, logistics coordination, tracking, and support. The boards are manufactured by external manufacturing partners.',
      },
      {
        question: 'Who manufactures the PCBs?',
        answer:
          'PCBs are manufactured by trusted external PCB manufacturing partners. Kendronics coordinates the customer-facing request, partner order flow, logistics, payment context, and support experience.',
      },
      {
        question: 'Why use Kendronics instead of ordering directly?',
        answer:
          'Kendronics gives African customers a clearer operational layer: quote configuration, payment flow, partner coordination, France logistics, Africa delivery planning, customer-safe tracking, and structured support tickets in one place.',
      },
    ],
  },
  {
    id: 'pcb-files',
    title: 'PCB files',
    description: 'What customers need to upload before a quote or manufacturing request can move forward.',
    items: [
      {
        question: 'What is a Gerber file?',
        answer:
          'A Gerber file is a production output from your PCB design tool. It describes copper layers, solder mask, silkscreen, board outline, and related manufacturing information used by PCB production partners.',
      },
      {
        question: 'What files do I need?',
        answer:
          'For bare PCB orders, prepare a Gerber ZIP with copper, mask, silkscreen, outline, and drill files. For PCBA requests, you may also need a BOM and CPL file for assembly review.',
      },
      {
        question: 'What happens if my files are wrong?',
        answer:
          'If files are incomplete or unclear, the order may need review before it can proceed. Kendronics support can help identify file issues, but corrected production files must come from the customer or design team.',
      },
    ],
  },
  {
    id: 'pricing',
    title: 'Pricing',
    description: 'How dynamic pricing works and why fixed public price tables can mislead.',
    items: [
      {
        question: 'How is price calculated?',
        answer:
          'Pricing combines partner manufacturing cost, partner handling, China to France logistics when applicable, France processing, France to Africa delivery, payment processing, Kendronics service fee, and any applicable customs or delivery risk buffer.',
      },
      {
        question: 'Why does delivery country affect price?',
        answer:
          'Delivery country affects carrier availability, customs complexity, routing, delivery time, and last-mile handling. The same PCB can have a different total quote depending on destination.',
      },
      {
        question: 'Are prices final?',
        answer:
          'Configurator prices are intended to reflect the selected scenario, but advanced materials, PCBA, unusual files, or logistics changes may require partner review before final confirmation.',
      },
    ],
  },
  {
    id: 'payment',
    title: 'Payment',
    description: 'How customers pay and how payment-related issues are handled.',
    items: [
      {
        question: 'How do card payments work?',
        answer:
          'Card payments are handled through Stripe checkout flows where available. Kendronics does not ask customers to send card details through email or support tickets.',
      },
      {
        question: 'Does Kendronics support Mobile Money?',
        answer:
          'The platform includes Mobile Money-ready payment architecture. Availability depends on supported providers, markets, and the active payment setup for the order flow.',
      },
      {
        question: 'How do refunds work?',
        answer:
          'Refund handling depends on order state, payment status, partner fulfillment progress, and applicable costs already committed. Support should review refund requests through the order context.',
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery',
    description: 'What customers should know about African delivery, timing, customs, and tracking.',
    items: [
      {
        question: 'Which African countries are supported?',
        answer:
          'Kendronics is designed for Africa-focused delivery coordination. Supported countries depend on current logistics coverage, carrier availability, customs constraints, and quote configuration.',
      },
      {
        question: 'How long does delivery take?',
        answer:
          'Delivery time depends on manufacturing lead time, inbound logistics, France processing, destination country, customs handling, carrier routing, and local delivery conditions.',
      },
      {
        question: 'Can customs cause delays?',
        answer:
          'Yes. Customs checks, documentation, duties, carrier workflows, and local delivery conditions can create delays. When applicable, the quote may include a customs or delivery risk buffer.',
      },
      {
        question: 'How does tracking work?',
        answer:
          'Public tracking shows customer-safe status, timeline, estimated delivery, destination country, and carrier or tracking number when available. It does not expose supplier, admin, or sensitive pricing data.',
      },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    description: 'How customers get help before, during, and after an order.',
    items: [
      {
        question: 'How do I contact support?',
        answer:
          'Use the support flow or order context where available. Clear order IDs, file details, destination country, and payment status help support respond faster.',
      },
      {
        question: 'How do I open a ticket?',
        answer:
          'Open a support ticket from the relevant customer flow or order page when available. Tickets keep the question attached to the order, files, tracking state, and customer-safe context.',
      },
    ],
  },
];

const allCategoryId = 'all';

export default function FaqPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(allCategoryId);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return faqCategories
      .filter((category) => activeCategory === allCategoryId || category.id === activeCategory)
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          if (!normalizedQuery) return true;
          return `${category.title} ${category.description} ${item.question} ${item.answer}`
            .toLowerCase()
            .includes(normalizedQuery);
        }),
      }))
      .filter((category) => category.items.length > 0);
  }, [activeCategory, query]);

  const resultCount = filteredCategories.reduce((total, category) => total + category.items.length, 0);

  return (
    <main className="overflow-hidden bg-cloud">
      <Navbar />
      <FaqHero />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Card glass className="p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-600">Search FAQ</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search manufacturer, Gerber, pricing, delivery, refunds..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
            </label>
            <div className="text-sm font-bold text-slate-600">
              {resultCount} {resultCount === 1 ? 'answer' : 'answers'} shown
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            <CategoryButton
              label="All"
              active={activeCategory === allCategoryId}
              onClick={() => setActiveCategory(allCategoryId)}
            />
            {faqCategories.map((category) => (
              <CategoryButton
                key={category.id}
                label={category.title}
                active={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
              />
            ))}
          </div>
        </Card>

        <div className="mt-8 space-y-8">
          {filteredCategories.map((category) => (
            <section key={category.id} id={category.id}>
              <div className="mb-4 max-w-3xl">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-signal">{category.title}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">{category.description}</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {category.items.map((item) => (
                  <FaqCard key={item.question} item={item} />
                ))}
              </div>
            </section>
          ))}

          {resultCount === 0 && (
            <Card className="p-8 text-center">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-signal">No matches</p>
              <h2 className="mt-2 text-2xl font-black text-ink">Try another search term.</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
                Search by topic, such as Gerber, Mobile Money, customs, manufacturer, tracking, delivery, or refund.
              </p>
            </Card>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-deepblue p-8 text-white shadow-2xl shadow-sky-950/25 sm:p-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
          <img
            src="https://images.pexels.com/photos/7174650/pexels-photo-7174650.jpeg?auto=compress&cs=tinysrgb&w=1800"
            alt="Close-up of PCB components"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deepblue via-deepblue/[0.9] to-ink/[0.72]" />
          <div className="relative">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-100">Still deciding?</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Start with a quote or review the full order journey.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-100 sm:text-base">
              The configurator and tracking flow keep customer-safe information separate from partner, admin, and supplier data.
            </p>
          </div>
          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col">
            <Button href="/quote" variant="light">
              Demander un devis
            </Button>
            <Button href="/how-it-works" variant="secondary">
              How It Works
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function FaqHero() {
  return (
    <section className="relative min-h-[68vh] overflow-hidden bg-ink text-white">
      <img src={heroImage} alt="Macro close-up of a printed circuit board" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.84] to-deepblue/[0.56]" />
      <div className="relative mx-auto flex min-h-[68vh] max-w-7xl items-end px-4 pb-20 pt-36 sm:px-6 lg:px-8">
        <div>
          <p className="inline-flex rounded-xl border border-white/[0.18] bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur-xl">
            FAQ
          </p>
          <h1 className="mt-7 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            Clear answers for PCB ordering, payment, delivery, and support.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            Kendronics is an intermediary platform, not a PCB manufacturer. These answers explain how customers work with Kendronics and external manufacturing partners.
          </p>
        </div>
      </div>
    </section>
  );
}

function CategoryButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 shrink-0 rounded-xl px-4 text-sm font-black transition ${
        active ? 'bg-deepblue text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-deepblue'
      }`}
    >
      {label}
    </button>
  );
}

function FaqCard({ item }: { item: FaqItem }) {
  return (
    <Card className="p-6 transition duration-300 hover:-translate-y-1 hover:shadow-glass">
      <h3 className="text-lg font-black text-ink">{item.question}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
    </Card>
  );
}
