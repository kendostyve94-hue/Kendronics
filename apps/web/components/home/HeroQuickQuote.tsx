'use client';

import { useMemo, useState } from 'react';
import type { QuoteConfig } from '../../lib/quote-types';

type ProductOption = {
  label: string;
  value: QuoteConfig['productType'];
};

const productOptions: ProductOption[] = [
  { label: 'Circuits imprimes', value: 'standard_pcb' },
  { label: 'Assemblage (PCBA)', value: 'pcb_assembly' },
  { label: 'FPC/Rigide-Flex', value: 'fpc_rigid_flex' },
  { label: 'PCB avance', value: 'advanced_pcb' },
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
    <aside className="w-full border border-[#d8e2ea] bg-white text-ink">
      <div className="grid grid-cols-[6.4rem_minmax(0,1fr)] sm:grid-cols-[8.8rem_1fr]">
        <nav className="grid border-r border-[#d8e2ea] bg-[#0f8f6b] text-white">
          {productOptions.map((option) => {
            const isActive = option.value === productType;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setProductType(option.value)}
                className={`min-h-7 border-b border-white/20 px-2 text-left text-[10px] font-normal leading-3 transition last:border-b-0 sm:min-h-8 sm:px-3 sm:text-xs ${
                  isActive ? 'bg-white text-ink' : 'bg-[#0f8f6b] hover:bg-[#0b7558]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 bg-white p-2.5 sm:p-3">
          <div className="mb-1.5">
            <h1 className="text-base font-black leading-tight text-[#0f8f6b] sm:text-lg">Devis immediat</h1>
            <p className="mt-0.5 text-[11px] leading-4 text-slate-500">Configurez et lancez votre demande.</p>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div className="col-span-2">
              <p className="mb-0.5 text-[11px] font-normal text-ink">Dimension</p>
              <div className="grid grid-cols-[1fr_auto_1fr_auto] border border-[#aeb8c2] bg-white">
                <NumberInput label="Longueur" value={length} onChange={setLength} />
                <span className="grid w-7 place-items-center border-l border-r border-[#aeb8c2] text-xs font-normal text-slate-600">x</span>
                <NumberInput label="Largeur" value={width} onChange={setWidth} />
                <span className="grid w-9 place-items-center border-l border-[#aeb8c2] text-[11px] font-normal text-ink">mm</span>
              </div>
            </div>

            <SelectField
              label="Quantite"
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
              label="Epaisseur"
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

          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <a href={quoteHref} className="inline-flex min-h-8 items-center justify-center bg-[#0f8f6b] px-3 text-xs font-black text-white transition hover:bg-[#0b7558]">
              Finaliser
            </a>
            <a href="/capabilities" className="inline-flex min-h-8 items-center justify-center border border-[#0f8f6b] bg-white px-3 text-xs font-black text-ink transition hover:bg-[#f4fbf8] hover:text-[#0f8f6b]">
              Capacites
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
        className="h-7 w-full border-0 bg-white px-2 text-xs text-ink outline-none placeholder:text-slate-400 sm:h-8 sm:px-3"
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
      <span className="mb-0.5 block text-[11px] font-normal text-ink">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-7 w-full border border-[#aeb8c2] bg-white px-2 text-xs text-ink outline-none sm:h-8 sm:px-3"
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
