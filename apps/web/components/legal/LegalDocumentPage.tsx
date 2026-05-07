import { Footer } from '../layout/Footer';
import { Navbar } from '../layout/Navbar';
import { Button } from '../ui/Button';
import type { LegalDocument } from '../../lib/legal-content';
import { officialContactEmail } from '../../lib/official-contact';

const heroImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=85';

const legalDocumentLinks = [
  ['Conditions Generales de Vente', '/terms#conditions-generales-de-vente'],
  ['Conditions Generales d’Utilisation', '/terms#conditions-generales-utilisation'],
  ['Politique de confidentialite', '/terms#politique-confidentialite'],
  ['Politique de cookies', '/terms#politique-cookies'],
  ['Mentions legales', '/terms#mentions-legales'],
];

const moreLinkTargets: Record<string, string> = {
  'conditions-generales-de-vente': '/terms/conditions-generales-de-vente',
};

function renderParagraphWithMoreLink(paragraph: string, sectionId?: string) {
  const marker = 'voir plus...';
  const markerIndex = paragraph.toLowerCase().indexOf(marker);

  if (markerIndex === -1) {
    return paragraph;
  }

  const before = paragraph.slice(0, markerIndex).trimEnd();
  const after = paragraph.slice(markerIndex + marker.length);

  return (
    <>
      {before}
      {before ? ' ' : ''}
      <a
        className="text-blue-600 opacity-55 blur-[0.45px] underline-offset-4 transition hover:text-blue-700 hover:opacity-100 hover:blur-0 hover:underline focus:opacity-100 focus:blur-0 focus:underline"
        href={sectionId ? moreLinkTargets[sectionId] ?? `#${sectionId}` : '#'}
      >
        voir plus...
      </a>
      {after}
    </>
  );
}

export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  return (
    <main className="overflow-hidden bg-cloud">
      <Navbar />
      <section className="relative min-h-[58vh] overflow-hidden bg-ink text-white">
        <img src={heroImage} alt="Macro close-up of a printed circuit board" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.86] to-deepblue/[0.6]" />
        <div className="relative mx-auto flex min-h-[58vh] max-w-[1440px] items-end px-4 pb-16 pt-36 sm:px-6 lg:px-8">
          <div>
            <p className="inline-flex rounded-sm border border-white/[0.18] bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-sky-100 backdrop-blur-xl">
              {document.eyebrow}
            </p>
            <h1 className="mt-7 max-w-5xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              {document.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">{document.description}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-none px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-6 border-b border-slate-200 pb-8 lg:grid-cols-[0.9fr_1.4fr] lg:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-signal">Derniere mise a jour</p>
              <p className="mt-2 text-lg text-ink">{document.lastUpdated}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Pour toute question liee a ces documents, contactez le support Kendronics.
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-signal">Documents</p>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                {legalDocumentLinks.map(([label, href]) => (
                  <a key={label} className="block py-2 text-slate-600 transition hover:text-deepblue hover:underline" href={href}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-10">
            {document.sections.map((section) => (
              <section key={section.title} id={section.id} className="scroll-mt-28">
                <h2 className="text-2xl font-semibold tracking-tight text-ink">{section.title}</h2>
                <div className="mt-4 space-y-4">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-slate-600 sm:text-base">
                      {renderParagraphWithMoreLink(paragraph, section.id)}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="relative mt-10 overflow-hidden rounded-sm bg-deepblue p-6 text-white sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-sky-100">Besoin d’aide ?</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Contacter le support Kendronics.</h2>
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
        </div>
      </section>

      <Footer />
    </main>
  );
}
