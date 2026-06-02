'use client';

import { useState } from 'react';

const productCards = [
  {
    title: 'PCB standard',
    tag: 'FR-4',
    meta: 'FR-4, prototypes',
    details: ['1 a 12 couches', 'HASL ou ENIG', 'Prototype et petites series'],
    price: 'Devis instantane',
    time: 'Production rapide',
    href: '/quote',
    image: '/images/product-pcb-standard-transparent.png',
    cta: 'Configurer un PCB',
  },
  {
    title: 'PCB petit lot',
    tag: 'Pilotage',
    meta: 'Petites series',
    details: ['Quantites faibles ou moyennes', 'Recommande pour tests terrain', 'Logistique Afrique incluse'],
    price: 'Prix transparent',
    time: 'Suivi client',
    href: '/services#pcb-petit-lot',
    image: '/images/product-pcb-small-batch.png',
    cta: 'Voir le pilotage',
  },
  {
    title: 'PCB avance',
    tag: 'Revue',
    meta: 'Options techniques',
    details: ['Impedance controlee', 'Materiaux speciaux', 'Options haute precision'],
    price: 'Revue technique',
    time: 'Validation support',
    href: '/services#pcb-avance',
    image: '/images/product-pcb-advanced.png',
    cta: 'Demander une revue',
  },
  {
    title: 'Assemblage PCBA',
    tag: 'BOM / CPL',
    meta: 'BOM / CPL',
    details: ['BOM et CPL requis', 'Sourcing composants', 'Preparation production'],
    price: 'Sur demande',
    time: 'Controle fichiers',
    href: '/quote',
    image: '/images/product-pcba-assembly.png',
    cta: 'Preparer un PCBA',
  },
  {
    title: 'Pochoir CMS',
    tag: 'CMS',
    meta: 'CMS',
    details: ['Pochoir prototype', 'Pochoir production', 'Planification avec PCB'],
    price: 'Ajout simple',
    time: 'Avec commande',
    href: '/services#stencil',
    image: '/images/product-stencil-smt.png',
    cta: 'Voir les stencils',
  },
  {
    title: 'Assistance Gerber',
    tag: 'Assistance',
    meta: 'Assistance',
    details: ['Verification ZIP', 'Conseils DFM', 'Aide debutant'],
    price: 'Guide assiste',
    time: 'Avant paiement',
    href: '/guide-technique',
    image: '/images/hero-pcb-color-variants-transparent.png',
    cta: 'Ouvrir le guide',
  },
];

const defaultProductIndex = productCards.findIndex((card) => card.title === 'Assemblage PCBA');

export function ProductCatalog() {
  const [activeIndex, setActiveIndex] = useState(defaultProductIndex);
  const activeCard = productCards[activeIndex] ?? productCards[defaultProductIndex] ?? productCards[0];

  return (
    <section className="bg-[#eef2f6] px-0 py-5 sm:px-4 lg:px-8">
      <div className="mx-auto max-w-none">
        <div className="grid items-start overflow-hidden border border-line bg-transparent lg:grid-cols-[15rem_1fr]">
          <aside className="grid border-b border-line bg-white lg:border-b-0 lg:border-r">
            <article className="bg-white p-4">
              <p className="label-caps text-deepblue">{activeCard.tag}</p>
              <h3 className="mt-2 text-lg font-black leading-6 text-ink">{activeCard.title}</h3>
              <ul className="mt-3 space-y-2 border border-line bg-white p-3 text-xs leading-5 text-slate-600">
                {activeCard.details.map((detail) => (
                  <li key={detail} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-deepblue" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 text-xs leading-5 text-slate-600">
                <p><span className="font-black text-ink">{activeCard.price}</span></p>
                <p>{activeCard.time}</p>
              </div>
              <div className="mt-4 grid gap-2">
                <a href={activeCard.href} className="inline-flex min-h-10 items-center justify-center bg-deepblue px-3 text-center text-xs font-normal leading-5 text-white transition hover:bg-[#0b7558]">
                  {activeCard.cta}
                </a>
                <a href="/quote" className="inline-flex min-h-10 items-center justify-center border border-line bg-white px-3 text-center text-xs font-normal leading-5 text-ink transition hover:border-deepblue hover:text-deepblue">
                  Demander un devis
                </a>
              </div>
            </article>
          </aside>

          <div className="min-w-0 bg-line">

            <div className="flex gap-2 overflow-x-auto bg-line p-px pb-2 md:grid md:grid-cols-3 md:gap-px md:overflow-visible md:pb-0 xl:grid-cols-6">
              {productCards.map((card, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={card.title}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`group block min-w-[10.25rem] bg-white p-3 text-center transition hover:bg-[#f3f8fc] sm:min-w-[11rem] sm:p-4 md:min-w-0 ${
                      isActive ? 'outline outline-2 outline-deepblue outline-offset-[-2px]' : ''
                    }`}
                  >
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
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
