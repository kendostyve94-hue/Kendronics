import { Footer } from '../layout/Footer';
import { Navbar } from '../layout/Navbar';

const heroImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=85';

export function LegalDetailPage({
  title,
  description,
  content,
}: {
  title: string;
  description: string;
  content: string;
}) {
  return (
    <main className="overflow-hidden bg-cloud">
      <Navbar />
      <section className="relative min-h-[52vh] overflow-hidden bg-ink text-white">
        <img src={heroImage} alt="Macro close-up of a printed circuit board" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.88] to-deepblue/[0.62]" />
        <div className="relative mx-auto flex min-h-[52vh] max-w-[1440px] items-end px-4 pb-14 pt-32 sm:px-6 lg:px-8">
          <div>
            <p className="inline-flex rounded-sm border border-white/[0.18] bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-sky-100 backdrop-blur-xl">
              Cadre legal
            </p>
            <h1 className="mt-7 max-w-5xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">{description}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-none px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
            <a href="/terms" className="text-sm text-blue-600 underline-offset-4 transition hover:text-blue-700 hover:underline">
              Retour au cadre legal
            </a>
            <span className="text-sm text-slate-500">Derniere mise a jour : April 25, 2026</span>
          </div>

          <div className="whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">
            {content.trim()}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
