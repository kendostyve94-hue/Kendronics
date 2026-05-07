'use client';

import { useState } from 'react';
import type { QuoteConfig } from '../../lib/quote-types';

const baseConfig: QuoteConfig = {
  productType: 'standard_pcb',
  baseMaterial: 'FR4',
  layers: 2,
  length: 100,
  width: 100,
  unit: 'mm',
  quantity: 5,
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

  function update<K extends keyof QuoteConfig>(key: K, value: QuoteConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  return (
    <aside className="hidden h-[3.35rem] items-center gap-3 bg-white/90 p-1 text-ink backdrop-blur-sm lg:flex">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center text-slate-500">
        <CalculatorIcon />
      </div>
      <SelectField
        label="Couches"
        value={config.layers}
        onChange={(value) => update('layers', Number(value))}
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
      <DimensionField
        length={config.length}
        width={config.width}
        onLengthChange={(value) => update('length', value)}
        onWidthChange={(value) => update('width', value)}
      />
      <SelectField
        label="Quantite"
        value={config.quantity}
        onChange={(value) => update('quantity', Number(value))}
        options={[
          [5, '5 pcs'],
          [10, '10 pcs'],
          [20, '20 pcs'],
          [50, '50 pcs'],
          [100, '100 pcs'],
        ]}
      />
      <a href="/quote" className="inline-flex h-full min-w-[10rem] items-center justify-center bg-[#0b74ff] px-7 text-base font-black text-white transition duration-300 hover:bg-[#075fd1]">
        Voir mon devis
      </a>
    </aside>
  );
}

function DimensionField({
  length,
  width,
  onLengthChange,
  onWidthChange,
}: {
  length: number;
  width: number;
  onLengthChange: (value: number) => void;
  onWidthChange: (value: number) => void;
}) {
  return (
    <div className="flex h-11 w-[12rem] items-center justify-center gap-2 bg-slate-100 px-4 text-sm">
      <label className="min-w-0 flex-1">
        <span className="sr-only">Longueur</span>
        <input
          type="number"
          min={1}
          value={length}
          onChange={(event) => onLengthChange(Number(event.target.value))}
          className="h-full w-full border-0 bg-transparent px-0 text-center text-sm font-normal text-ink outline-none"
        />
      </label>
      <span className="text-slate-500">x</span>
      <label className="min-w-0 flex-1">
        <span className="sr-only">Largeur</span>
        <input
          type="number"
          min={1}
          value={width}
          onChange={(event) => onWidthChange(Number(event.target.value))}
          className="h-full w-full border-0 bg-transparent px-0 text-center text-sm font-normal text-ink outline-none"
        />
      </label>
      <span className="shrink-0 text-slate-500">mm</span>
    </div>
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
    <label className="flex h-11 w-[8.5rem] items-center bg-slate-100 px-4">
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

function CalculatorIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="3" width="14" height="18" />
      <path d="M8 7h8M8 11h2M12 11h2M16 11h.01M8 15h2M12 15h2M16 15h.01M8 19h2M12 19h2M16 19h.01" />
    </svg>
  );
}
