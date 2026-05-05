'use client';

import { useMemo, useState } from 'react';
import { africanCountries } from '../../lib/african-countries';
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
  const selectedCountry = africanCountries.find((country) => country.iso2 === config.destinationCountry) ?? africanCountries[0];

  function update<K extends keyof QuoteConfig>(key: K, value: QuoteConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  return (
    <aside className="hidden border border-white/25 bg-white/88 p-3.5 text-ink backdrop-blur-sm lg:block">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-deepblue">Devis rapide</p>
          <h2 className="mt-1 text-lg font-black">Calcul instantane</h2>
        </div>
        <span className="rounded-full bg-[#0f8f6b] px-2.5 py-1 text-[10px] font-black text-white">Actif</span>
      </div>

      <div className="mt-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Longueur mm" value={config.length} onChange={(value) => update('length', value)} />
          <NumberField label="Largeur mm" value={config.width} onChange={(value) => update('width', value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SelectField label="Couches" value={config.layers} onChange={(value) => update('layers', Number(value))} options={[1, 2, 4, 6, 8, 10, 12]} />
          <NumberField label="Quantite" value={config.quantity} min={1} onChange={(value) => update('quantity', value)} />
        </div>
        <SelectField
          label="Destination"
          value={config.destinationCountry}
          onChange={(value) => update('destinationCountry', value)}
          options={africanCountries.slice(0, 12).map((country) => [country.iso2, country.name])}
        />
      </div>

      <div className="mt-3 border-t border-line pt-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Total calcule</p>
            <p className="mt-1 text-2xl font-black text-[#ff7a00]">{formatMoney(pricing.finalTotal)}</p>
          </div>
          <a href="/quote" className="inline-flex h-9 items-center rounded-full bg-deepblue px-4 text-xs font-black text-white">
            Finaliser
          </a>
        </div>
        <p className="mt-2 text-[11px] leading-4 text-slate-500">
          {selectedCountry.name} - {pricing.estimatedLeadTime}. Le devis complet ajoute upload Gerber et options avancees.
        </p>
      </div>
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
    <label className="block">
      <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">{label}</span>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-8 w-full border border-line bg-white px-2.5 text-xs font-black text-ink outline-none focus:border-[#0f8f6b]"
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
    <label className="block">
      <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full border border-line bg-white px-2.5 text-xs font-black text-ink outline-none focus:border-[#0f8f6b]"
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
