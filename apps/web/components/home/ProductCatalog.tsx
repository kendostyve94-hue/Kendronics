'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';

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
    tag: 'Review',
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
    time: 'Contrôle fichiers',
    href: '/quote',
    image: '/images/product-pcba-assembly.png',
    cta: 'Preparer un PCBA',
  },
  {
    title: 'Stencil SMT',
    tag: 'CMS',
    meta: 'CMS',
    details: ['Stencil prototype', 'Stencil production', 'Planification avec PCB'],
    price: 'Ajout simple',
    time: 'Avec commande',
    href: '/services#stencil',
    image: '/images/product-stencil-smt.png',
    cta: 'Voir les stencils',
  },
  {
    title: 'Assistance Gerber',
    tag: 'Support',
    meta: 'Support',
    details: ['Verification ZIP', 'Conseils DFM', 'Aide debutant'],
    price: 'Support guide',
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
    <section className="bg-white px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 flex justify-end">
          <Button href="/services" variant="secondary" className="hidden sm:inline-flex lg:h-12 lg:px-7">Tout explorer</Button>
        </div>

        <div className="grid overflow-hidden border border-line bg-white lg:grid-cols-[15rem_1fr]">
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
                  Demande un devis
                </a>
              </div>
            </article>
          </aside>

          <div className="min-w-0">

            <div className="grid grid-cols-2 gap-px bg-line p-px md:grid-cols-3 xl:grid-cols-6">
              {productCards.map((card, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={card.title}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`group block bg-white p-3 text-center transition hover:bg-[#f3f8fc] sm:p-4 ${
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
