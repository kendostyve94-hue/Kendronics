'use client';

import { useMemo, useState } from 'react';
import type { QuoteConfig } from '../../lib/quote-types';

type ProductOption = {
  label: string;
  value: QuoteConfig['productType'];
};

const productOptions: ProductOption[] = [
  { label: 'Circuits imprimés', value: 'standard_pcb' },
  { label: 'Assemblage (PCBA)', value: 'pcb_assembly' },
  { label: 'FPC/Rigide-Flex', value: 'fpc_rigid_flex' },
  { label: 'PCB Avancé', value: 'advanced_pcb' },
  { label: 'CNC | Impression 3D', value: 'cnc_3d' },
  { label: 'Pochoirs CMS', value: 'smt_stencil' },
];

export function HeroQuickQuote() {
  const [productType, setProductType] = useState<QuoteConfig['productType']>('standard_pcb');
  const [layers, setLayers] = useState(2);
  const [length, setLength] = useState(100);
  const [width, setWidth] = useState(100);
  const [quantity, setQuantity] = useState(10);
  const [thickness, setThickness] = useState('1.6mm');

  const quoteHref = useMemo(() => {
    const params = new URLSearchParams({
      productType,
      layers: String(layers),
      length: String(length),
      width: String(width),
      quantity: String(quantity),
      thickness,
    });

    return `/quote?${params.toString()}`;
  }, [layers, length, productType, quantity, thickness, width]);

  return (
    <aside className="w-full max-w-[45rem] border border-[#d8e2ea] bg-white text-ink">
      <div className="grid lg:grid-cols-[12.5rem_1fr]">
        <nav className="grid border-b border-[#d8e2ea] bg-[#009a43] text-white lg:border-b-0 lg:border-r">
          {productOptions.map((option) => {
            const isActive = option.value === productType;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setProductType(option.value)}
                className={`min-h-12 border-b border-white/20 px-4 text-left text-sm font-semibold transition last:border-b-0 ${
                  isActive ? 'bg-white text-ink' : 'bg-[#00a843] hover:bg-[#00953d]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </nav>

        <div className="bg-[#f4f7fa] p-5 sm:p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-black leading-tight text-[#00a651] sm:text-3xl">Devis immédiat</h1>
            <p className="mt-1 text-sm text-slate-500">Vos circuits imprimés au meilleur prix.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-black text-ink">Dimension</p>
              <div className="grid grid-cols-[1fr_auto_1fr_auto] border border-[#aeb8c2] bg-white">
                <NumberInput label="Longueur" value={length} onChange={setLength} />
                <span className="grid w-8 place-items-center border-l border-r border-[#aeb8c2] text-sm font-bold text-slate-600">x</span>
                <NumberInput label="Largeur" value={width} onChange={setWidth} />
                <span className="grid w-10 place-items-center border-l border-[#aeb8c2] text-xs font-black text-ink">mm</span>
              </div>
            </div>

            <SelectField
              label="Quantité"
              value={quantity}
              onChange={(value) => setQuantity(Number(value))}
              options={[
                [5, '5 pieces'],
                [10, '10 pieces'],
                [20, '20 pieces'],
                [50, '50 pieces'],
                [100, '100 pieces'],
                [200, '200 pieces'],
              ]}
            />

            <SelectField
              label="Couche(s)"
              value={layers}
              onChange={(value) => setLayers(Number(value))}
              options={[
                [1, '1 Couche'],
                [2, '2 Couches'],
                [4, '4 Couches'],
                [6, '6 Couches'],
                [8, '8 Couches'],
                [10, '10 Couches'],
                [12, '12 Couches'],
              ]}
            />

            <SelectField
              label="Épaisseur"
              value={thickness}
              onChange={setThickness}
              options={[
                ['0.8mm', '0.8mm'],
                ['1.0mm', '1.0mm'],
                ['1.2mm', '1.2mm'],
                ['1.6mm', '1.6mm'],
                ['2.0mm', '2.0mm'],
              ]}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <a href={quoteHref} className="inline-flex min-h-12 items-center justify-center bg-[#0f8f6b] px-5 text-sm font-black text-white transition hover:bg-[#0b7558]">
              Finaliser
            </a>
            <a href="/capabilities" className="inline-flex min-h-12 items-center justify-center border border-[#aeb8c2] bg-white px-5 text-sm font-black text-ink transition hover:border-[#0f8f6b] hover:text-[#0f8f6b]">
              Capacités
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block min-w-0">
      <span className="sr-only">{label}</span>
      <input
        type="number"
        min={1}
        value={value}
        placeholder={label}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full border-0 bg-white px-3 text-sm text-ink outline-none placeholder:text-slate-400"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | number;
  options: Array<[string | number, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-ink">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full border border-[#aeb8c2] bg-white px-3 text-sm text-ink outline-none"
      >
        {options.map(([optionValue, labelText]) => (
          <option key={String(optionValue)} value={optionValue}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}
