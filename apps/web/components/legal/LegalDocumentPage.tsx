import { Footer } from '../layout/Footer';
import { Navbar } from '../layout/Navbar';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { LegalDocument } from '../../lib/legal-content';
import { officialContactEmail } from '../../lib/official-contact';

const heroImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=85';

export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  return (
    <main className="overflow-hidden bg-cloud">
      <Navbar />
      <section className="relative min-h-[58vh] overflow-hidden bg-ink text-white">
        <img src={heroImage} alt="Macro close-up of a printed circuit board" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.86] to-deepblue/[0.6]" />
        <div className="relative mx-auto flex min-h-[58vh] max-w-7xl items-end px-4 pb-16 pt-36 sm:px-6 lg:px-8">
          <div>
            <p className="inline-flex rounded-xl border border-white/[0.18] bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur-xl">
              {document.eyebrow}
            </p>
            <h1 className="mt-7 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              {document.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">{document.description}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[18rem_1fr] lg:px-8">
        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <Card glass className="p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Last updated</p>
            <p className="mt-2 text-lg font-black text-ink">{document.lastUpdated}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{document.reviewNote}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Documents</p>
            <div className="mt-4 space-y-2 text-sm font-black">
              <a className="block rounded-xl border border-slate-200 px-3 py-3 text-slate-600 transition hover:border-sky-200 hover:text-deepblue" href="/terms">
                Conditions
              </a>
              <a className="block rounded-xl border border-slate-200 px-3 py-3 text-slate-600 transition hover:border-sky-200 hover:text-deepblue" href="/privacy">
                Confidentialite
              </a>
              <a className="block rounded-xl border border-slate-200 px-3 py-3 text-slate-600 transition hover:border-sky-200 hover:text-deepblue" href="/refund-policy">
                Refunds
              </a>
              <a className="block rounded-xl border border-slate-200 px-3 py-3 text-slate-600 transition hover:border-sky-200 hover:text-deepblue" href="/cookie-policy">
                Cookies
              </a>
            </div>
          </Card>
        </aside>

        <div className="space-y-5">
          {document.sections.map((section) => (
            <Card key={section.title} className="p-6 sm:p-7">
              <h2 className="text-2xl font-black tracking-tight text-ink">{section.title}</h2>
              <div className="mt-4 space-y-4">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-slate-600 sm:text-base">
                    {paragraph}
                  </p>
                ))}
              </div>
            </Card>
          ))}

          <div className="relative overflow-hidden rounded-3xl bg-deepblue p-8 text-white sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-100">Besoin d aide ?</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Contact Kendronics support.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-sky-100">
                Utilisez les tickets support pour les commandes et {officialContactEmail} pour les demandes de confidentialite.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
              <Button href="/contact" variant="light">
                Contact
              </Button>
              <Button href="/faq" variant="secondary">
                FAQ
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
