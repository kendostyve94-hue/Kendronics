'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';

const productCards = [
  {
    title: 'PCB standard',
    tag: 'FR-4',
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
    details: ['BOM et CPL requis', 'Sourcing composants', 'Preparation production'],
    price: 'Sur demande',
    time: 'Controle fichiers',
    href: '/quote',
    image: '/images/product-pcba-assembly.png',
    cta: 'Preparer un PCBA',
  },
  {
    title: 'Stencil SMT',
    tag: 'CMS',
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
    details: ['Verification ZIP', 'Conseils DFM', 'Aide debutant'],
    price: 'Support guide',
    time: 'Avant paiement',
    href: '/guide-technique',
    image: '/images/hero-pcb-color-variants-transparent.png',
    cta: 'Ouvrir le guide',
  },
];

type ProductCard = (typeof productCards)[number];
const defaultProductIndex = productCards.findIndex((card) => card.title === 'PCB avance');

export function ProductCatalog() {
  const [activeIndex, setActiveIndex] = useState(defaultProductIndex);
  const activeCard = productCards[activeIndex] ?? productCards[defaultProductIndex] ?? productCards[0];

  return (
    <section className="bg-white px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="label-caps text-deepblue">Solutions electroniques</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-ink sm:text-3xl lg:text-4xl">Un catalogue clair pour passer au devis.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Retrouvez les formats les plus demandes, avec les informations essentielles visibles au premier coup d oeil.
            </p>
          </div>
          <Button href="/services" variant="secondary" className="hidden sm:inline-flex lg:h-12 lg:px-7">Tout explorer</Button>
        </div>

        <div className="mt-7 flex gap-2 overflow-x-auto border-b border-line pb-0 lg:mt-9 lg:grid lg:grid-cols-6 lg:overflow-visible">
          {productCards.map((card, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={card.title}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative min-h-14 min-w-[10.5rem] px-2 pb-4 text-left text-sm transition lg:min-w-0 lg:text-center ${
                  isActive ? 'font-black text-ink' : 'font-medium text-slate-500 hover:text-ink'
                }`}
              >
                {card.title}
                <span className={`absolute bottom-0 left-0 h-0.5 w-full ${isActive ? 'bg-ink' : 'bg-transparent'}`} />
              </button>
            );
          })}
        </div>

        <div className="grid overflow-hidden border-b border-line bg-[#eef7ff] md:grid-cols-[1.15fr_0.85fr] md:items-stretch lg:min-h-[31rem] xl:grid-cols-[1.35fr_0.65fr]">
          <div className="relative min-h-[13.5rem] overflow-hidden bg-[#eef7ff] md:min-h-[25rem] lg:min-h-[29rem]">
            <img
              key={activeCard.image}
              src={activeCard.image}
              alt=""
              className="absolute inset-0 h-full w-full object-contain object-center p-3 md:p-6 lg:p-8"
            />
          </div>

          <article className="bg-white p-4 md:p-7 lg:max-w-[26rem] lg:self-center">
            <p className="label-caps text-deepblue">{activeCard.tag}</p>
            <h3 className="mt-2 text-xl font-black text-ink md:mt-3 md:text-2xl lg:text-3xl">{activeCard.title}</h3>
            <ul className="mt-3 space-y-2 bg-slate-50 p-3 text-sm leading-6 text-slate-600 md:mt-5 md:space-y-3 md:p-4">
              {activeCard.details.map((detail) => (
                <li key={detail} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-deepblue" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600 md:mt-6">
              <p><span className="font-black text-ink">{activeCard.price}</span></p>
              <p>{activeCard.time}</p>
            </div>
            <div className="mt-4 grid gap-3 md:mt-6">
              <a href={activeCard.href} className="inline-flex h-11 items-center justify-center rounded-sm bg-deepblue px-5 text-sm font-normal text-white transition hover:bg-[#0b7558]">
                {activeCard.cta}
              </a>
              <a href="/quote" className="inline-flex h-11 items-center justify-center rounded-sm border border-line bg-white px-5 text-sm font-normal text-ink transition hover:border-deepblue hover:text-deepblue">
                Demande un devis
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
