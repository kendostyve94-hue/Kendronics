'use client';

import { useMemo, useState } from 'react';
import { calculatePCBQuote } from '../../lib/pricing';
import type { QuoteConfig } from '../../lib/quote-types';

const baseConfig: QuoteConfig = {
  productType: 'standard_pcb',
  baseMaterial: 'FR4',
  layers: 2,
  length: 80,
  width: 60,
  unit: 'mm',
  quantity: 10,
  differentDesigns: 1,
  usageType: 'consumer_industrial',
  deliveryFormat: 'single_pcb',
  thickness: '1.6mm',
  solderMaskColor: 'Green',
  silkscreenColor: 'White',
  surfaceFinish: 'HASL lead-free',
  viaCovering: 'Tented',
  productionSpeed: 'standard',
  outerCopperWeight: '1 oz',
  innerCopperWeight: '0.5 oz',
  impedanceControl: false,
  minimumViaHole: '0.3mm',
  viaDiameter: '0.6mm',
  goldFingers: false,
  castellatedHoles: false,
  edgePlating: false,
  blindBuriedVias: false,
  viaInPad: false,
  peelableMask: false,
  carbonInk: false,
  countersink: false,
  pressFitHoles: false,
  coverlayThickness: '',
  stiffenerType: '',
  stiffenerThickness: '',
  emiShieldingFilm: false,
  cuttingMethod: 'CNC',
  adhesiveType: '',
  orderNumberMarking: true,
  markingLocationSpecified: false,
  removeMarking: false,
  twoDBarcode: false,
  serialNumber: false,
  flyingProbe: true,
  fullElectricalTest: false,
  randomElectricalTest: false,
  fourWireKelvinTest: false,
  aoi: false,
  assemblyRequired: false,
  assemblySide: 'top',
  componentSourcing: 'partner_sourced',
  confirmPartsPlacement: false,
  stencilRequired: false,
  stencilType: '',
  stencilSize: '280x380mm',
  stencilThickness: '0.12mm',
  stencilFrame: false,
  electroPolishing: false,
  engraving: false,
  destinationCountry: 'SN',
  shippingMode: 'standard',
  insuranceRequired: false,
};

export function HeroQuickQuote() {
  const [config, setConfig] = useState<QuoteConfig>(baseConfig);
  const pricing = useMemo(() => calculatePCBQuote(config), [config]);

  function update<K extends keyof QuoteConfig>(key: K, value: QuoteConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  return (
    <aside className="hidden h-12 items-center overflow-hidden border border-white/70 bg-white/90 text-ink backdrop-blur-sm lg:flex">
      <SelectField label="Couches" value={config.layers} onChange={(value) => update('layers', Number(value))} options={[1, 2, 4, 6, 8, 10, 12]} />
      <NumberField label="Longueur" value={config.length} onChange={(value) => update('length', value)} />
      <NumberField label="Largeur" value={config.width} onChange={(value) => update('width', value)} />
      <NumberField label="Qte" value={config.quantity} min={1} onChange={(value) => update('quantity', value)} />
      <div className="flex h-full min-w-[8.5rem] items-center justify-center border-l border-line px-3 text-sm text-[#ff7a00]">
        {formatMoney(pricing.finalTotal)}
      </div>
      <a href="/quote" className="inline-flex h-full items-center justify-center bg-deepblue px-6 text-sm font-normal text-white transition duration-300 hover:bg-[#0b7558]">
        Finaliser
      </a>
    </aside>
  );
}

function NumberField({
  label,
  value,
  min = 1,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex h-full w-[5.9rem] items-center gap-1 border-l border-line px-2 first:border-l-0">
      <span className="sr-only">{label}</span>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-full w-full border-0 bg-transparent px-0 text-sm font-normal text-ink outline-none"
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
  options: Array<string | number | [string | number, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-full w-[7.5rem] items-center gap-1 px-3">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full w-full border-0 bg-transparent px-0 text-sm font-normal text-ink outline-none"
      >
        {options.map((option) => {
          const optionValue = Array.isArray(option) ? option[0] : option;
          const labelText = Array.isArray(option) ? option[1] : option;
          return (
            <option key={String(optionValue)} value={optionValue}>
              {labelText}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}
