import type { Metadata } from 'next';
import { BlogIndex } from '../../components/blog/BlogIndex';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { blogArticles, blogCategoryLabels } from '../../lib/blog-content';

export const metadata: Metadata = {
  title: 'Blog Kendronics | Guides PCB pour les builders africains',
  description:
    'Guides PCB, export Gerber, KiCad, EasyEDA, commande, logistique et startup hardware pour les builders africains utilisant Kendronics.',
  keywords: [
    'PCB design Africa',
    'Gerber export tutorial',
    'KiCad PCB guide',
    'EasyEDA Gerber',
    'PCB ordering Africa',
    'hardware startup Africa',
    'PCB logistics Africa',
  ],
  openGraph: {
    title: 'Blog Kendronics | Guides PCB pour les builders africains',
    description:
      'Guides PCB, export Gerber, commande, logistique et bases de fabrication pour les projets hardware africains.',
    type: 'website',
  },
};

const heroImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=85';

const categoryStrategy = Object.values(blogCategoryLabels);

export default function BlogPage() {
  return (
    <main className="overflow-hidden bg-cloud">
      <Navbar />
      <BlogHero />
      <BlogIndex articles={blogArticles} />

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
          <div className="relative overflow-hidden rounded-3xl bg-deepblue p-8 text-white sm:p-10">
            <img
              src="https://images.pexels.com/photos/7174650/pexels-photo-7174650.jpeg?auto=compress&cs=tinysrgb&w=1800"
              alt="Close-up of PCB components"
              className="absolute inset-0 h-full w-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-deepblue via-deepblue/[0.9] to-ink/[0.72]" />
            <div className="relative">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-100">Ressources PCB</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Recevez les prochains guides de fabrication.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-100 sm:text-base">
                Inscrivez-vous pour recevoir les notes Gerber, checklists de commande et conseils logistiques publiés par Kendronics.
              </p>
              <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  type="email"
                  placeholder="vous@example.com"
                  className="h-12 rounded-xl border border-white/[0.18] bg-white px-4 text-sm font-bold text-ink outline-none focus:ring-4 focus:ring-sky-200"
                />
                <button type="button" className="h-12 rounded-xl bg-white px-6 text-sm font-black text-deepblue transition hover:bg-sky-50">
                  S’inscrire
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-signal">Thèmes utiles</p>
            <h3 className="mt-2 text-xl font-black text-ink">Guides pour préparer une commande propre</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {categoryStrategy.map((category) => (
                <span key={category} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
                  {category}
                </span>
              ))}
            </div>
            <Button href="/quote" className="mt-6 w-full">
              Demander un devis
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function BlogHero() {
  return (
    <section className="relative overflow-hidden border-b border-[#d8e1ea] bg-ink pt-[70px] text-white">
      <img src={heroImage} alt="Macro close-up of a printed circuit board" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.84] to-deepblue/[0.56]" />
      <div className="relative mx-auto max-w-[1368px] px-4 py-8 sm:px-6 sm:py-10 lg:px-5 lg:py-12">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-xl border border-white/[0.18] bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur-xl">
            Blog
          </p>
          <h1 className="mt-5 text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Guides PCB pour les builders hardware africains.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
            Des ressources pratiques pour préparer les fichiers Gerber, comprendre les options de fabrication et organiser une livraison suivie.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button href="/quote">Demander un devis</Button>
            <Button href="#articles" variant="secondary">
              Voir les guides
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
