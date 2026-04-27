import type { Metadata } from 'next';
import { BlogIndex } from '../../components/blog/BlogIndex';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { blogArticles, blogCategoryLabels } from '../../lib/blog-content';

export const metadata: Metadata = {
  title: 'Kendronics Blog | PCB Guides For African Hardware Builders',
  description:
    'Educational PCB design, Gerber export, KiCad, EasyEDA, ordering, logistics, and hardware startup guides for African builders using Kendronics.',
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
    title: 'Kendronics Blog | PCB Guides For African Hardware Builders',
    description:
      'Learn PCB design, Gerber export, ordering, logistics, and manufacturing basics for African hardware projects.',
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
          <div className="relative overflow-hidden rounded-3xl bg-deepblue p-8 text-white shadow-2xl shadow-sky-950/25 sm:p-10">
            <img
              src="https://images.pexels.com/photos/7174650/pexels-photo-7174650.jpeg?auto=compress&cs=tinysrgb&w=1800"
              alt="Close-up of PCB components"
              className="absolute inset-0 h-full w-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-deepblue via-deepblue/[0.9] to-ink/[0.72]" />
            <div className="relative">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-100">Newsletter CTA</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Get practical PCB ordering and logistics guides.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-100 sm:text-base">
                A future newsletter can send design checklists, Gerber export notes, startup lessons, and Africa delivery explainers.
              </p>
              <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="h-12 rounded-xl border border-white/[0.18] bg-white px-4 text-sm font-bold text-ink outline-none focus:ring-4 focus:ring-sky-200"
                />
                <button type="button" className="h-12 rounded-xl bg-white px-6 text-sm font-black text-deepblue transition hover:bg-sky-50">
                  Join list
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-signal">SEO metadata strategy</p>
            <h3 className="mt-2 text-xl font-black text-ink">Education-first topic clusters</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {categoryStrategy.map((category) => (
                <span key={category} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
                  {category}
                </span>
              ))}
            </div>
            <Button href="/quote" className="mt-6 w-full">
              Get Quote
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
    <section className="relative min-h-[68vh] overflow-hidden bg-ink text-white">
      <img src={heroImage} alt="Macro close-up of a printed circuit board" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.84] to-deepblue/[0.56]" />
      <div className="relative mx-auto flex min-h-[68vh] max-w-7xl items-end px-4 pb-20 pt-36 sm:px-6 lg:px-8">
        <div>
          <p className="inline-flex rounded-xl border border-white/[0.18] bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur-xl">
            Blog
          </p>
          <h1 className="mt-7 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            PCB education for African hardware builders.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            Practical guides for PCB design, Gerber export, KiCad, EasyEDA, ordering, logistics, and electronics manufacturing basics.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/quote">Get Quote</Button>
            <Button href="#articles" variant="secondary">
              Browse guides
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
