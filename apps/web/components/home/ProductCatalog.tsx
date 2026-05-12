import { Button } from '../ui/Button';

const productCards = [
  {
    title: 'PCB standard',
    meta: 'FR-4, prototypes',
    price: 'Devis instantane',
    time: 'Production rapide',
    href: '/quote',
    image: '/images/product-pcb-standard-transparent.png',
  },
  {
    title: 'PCB petit lot',
    meta: 'Petites series',
    price: 'Prix transparent',
    time: 'Suivi client',
    href: '/services#pcb-petit-lot',
    image: '/images/product-pcb-small-batch.png',
  },
  {
    title: 'PCB avance',
    meta: 'Options techniques',
    price: 'Revue technique',
    time: 'Validation support',
    href: '/services#pcb-avance',
    image: '/images/product-pcb-advanced.png',
  },
  {
    title: 'Assemblage PCBA',
    meta: 'BOM / CPL',
    price: 'Sur demande',
    time: 'Contrôle fichiers',
    href: '/quote',
    image: '/images/product-pcba-assembly.png',
  },
  {
    title: 'Stencil SMT',
    meta: 'CMS',
    price: 'Ajout simple',
    time: 'Avec commande',
    href: '/services#stencil',
    image: '/images/product-stencil-smt.png',
  },
  {
    title: 'Assistance Gerber',
    meta: 'Support',
    price: 'Support guide',
    time: 'Avant paiement',
    href: '/guide-technique',
    image: '/images/hero-pcb-color-variants-transparent.png',
  },
];

export function ProductCatalog() {
  return (
    <section className="bg-white px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="label-caps text-deepblue">Solutions electroniques</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-ink sm:text-3xl lg:text-4xl">Un catalogue clair pour passer au devis.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Retrouvez les formats les plus demandes, avec les informations essentielles visibles au premier coup d oeil.
            </p>
          </div>
          <Button href="/services" variant="secondary" className="hidden sm:inline-flex lg:h-12 lg:px-7">Tout explorer</Button>
        </div>

        <div className="grid overflow-hidden border border-line bg-white lg:grid-cols-[15rem_1fr]">
          <aside className="grid border-b border-line bg-white lg:border-b-0 lg:border-r">
            <div className="flex min-h-[10rem] flex-col items-center justify-center border-b border-line bg-white p-5 text-center">
              <h3 className="text-lg font-black text-ink">Bon à savoir</h3>
              <p className="mt-2 text-sm leading-5 text-slate-500">Un parcours lisible, du fichier au suivi.</p>
              <a
                href="/how-it-works"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center bg-deepblue px-3 text-center text-sm font-black leading-5 text-white transition hover:bg-[#0b7558]"
              >
                Comment ça marche
              </a>
            </div>

            <div className="relative min-h-[12rem] overflow-hidden bg-white p-5">
              <h3 className="text-sm font-black leading-5 text-ink">
                <span className="text-deepblue">Review</span> Nous faisons plus
              </h3>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Assemblage électrique et mécanique, assemblage de câbles, assemblage de boîtiers, assemblage de produits finis et fabrication sous contrat.
              </p>
              <a href="/services" className="mt-2 inline-flex text-xs font-black text-deepblue">Voir plus &gt;</a>
              <img
                src="/images/quote-product-assembly.png"
                alt=""
                className="absolute -bottom-8 right-0 h-28 w-36 object-contain opacity-95"
              />
            </div>
          </aside>

          <div className="min-w-0">
            <div className="border-b border-line bg-white px-4 py-4 sm:px-6">
              <img
                src="/images/solutions-workflow.png"
                alt="Demande en ligne, telechargement du fichier PCB, verification de la commande, paiement, suivi en temps reel de la fabrication, livraison et reception confirmee."
                className="h-auto w-full object-contain"
              />
            </div>

            <div className="grid grid-cols-2 gap-px bg-line p-px md:grid-cols-3 xl:grid-cols-6">
              {productCards.map((card) => (
                <a key={card.title} href={card.href} className="group block bg-white p-3 text-center transition hover:bg-[#f3f8fc] sm:p-4">
                  <div className="flex h-24 items-center justify-center bg-[#f7fafc] sm:h-28">
                    <img src={card.image} alt="" className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-[1.04]" />
                  </div>
                  <h3 className="mt-3 text-sm font-black leading-5 text-ink">{card.title}</h3>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-deepblue">{card.meta}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    <span className="text-slate-500">{card.price}</span>
                    <br />
                    {card.time}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
