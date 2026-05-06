import { Footer } from '../layout/Footer';
import { Navbar } from '../layout/Navbar';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { LegalDocument } from '../../lib/legal-content';
import { officialContactEmail } from '../../lib/official-contact';

const heroImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=85';

const legalDocumentLinks = [
  ['Conditions Générales de Vente', '/terms#conditions-generales-de-vente'],
  ['Conditions Générales d’Utilisation', '/terms#conditions-generales-utilisation'],
  ['Politique de confidentialité', '/terms#politique-confidentialite'],
  ['Politique de cookies', '/terms#politique-cookies'],
  ['Mentions légales', '/terms#mentions-legales'],
];

export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  return (
    <main className="overflow-hidden bg-cloud">
      <Navbar />
      <section className="relative min-h-[58vh] overflow-hidden bg-ink text-white">
        <img src={heroImage} alt="Macro close-up of a printed circuit board" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.86] to-deepblue/[0.6]" />
        <div className="relative mx-auto flex min-h-[58vh] max-w-[1440px] items-end px-4 pb-16 pt-36 sm:px-6 lg:px-8">
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

      <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
        <Card glass className="p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Dernière mise à jour</p>
              <p className="mt-2 text-lg font-black text-ink">{document.lastUpdated}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Pour toute question liée à ces documents, contactez le support Kendronics.
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Documents</p>
              <div className="mt-4 grid gap-2 text-sm font-black sm:grid-cols-2">
                {legalDocumentLinks.map(([label, href]) => (
                  <a key={label} className="block rounded-xl border border-slate-200 bg-white/70 px-3 py-3 text-slate-600 transition hover:border-sky-200 hover:text-deepblue" href={href}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {document.sections.map((section) => (
            <Card key={section.title} id={section.id} className="scroll-mt-28 p-6 sm:p-7">
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
        </div>

        <div className="relative mt-6 overflow-hidden rounded-3xl bg-deepblue p-6 text-white sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-100">Besoin d’aide ?</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Contacter le support Kendronics.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-sky-100">
              Utilisez les tickets support ou {officialContactEmail}.
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
      </section>

      <Footer />
    </main>
  );
}
