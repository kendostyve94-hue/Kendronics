'use client';

import { useMemo, useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { PricingSummary } from '../../components/quote/PricingSummary';
import { africanCountries } from '../../lib/african-countries';
import { calculatePCBQuote } from '../../lib/pricing';
import { validateQuoteConfig } from '../../lib/quote-pricing';
import type { QuoteConfig } from '../../lib/quote-types';

const productCards: Array<{
  value: QuoteConfig['productType'];
  title: string;
  description: string;
}> = [
  {
    value: 'standard_pcb',
    title: 'Standard PCB/PCBA',
    description: 'Rigid FR-4, quick prototype, small batch and assembly-ready files.',
  },
  {
    value: 'advanced_pcb',
    title: 'Advanced PCB/PCBA',
    description: 'HDI, impedance, high-frequency materials and reliability options.',
  },
  {
    value: 'smt_stencil',
    title: 'SMT Stencil',
    description: 'Prototype or production stencil ordered together with PCB.',
  },
  {
    value: 'pcb_assembly',
    title: 'PCB Assembly',
    description: 'BOM, CPL, component sourcing and SMT/THT assembly request.',
  },
];

const initialConfig: QuoteConfig = {
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

const quantityOptions = [5, 10, 15, 20, 25, 30, 50, 75, 100, 150, 200, 300, 500, 1000, 2000];

type ShippingRateSelection = {
  id: string;
  carrier: string;
  service: string;
  amount: number;
  currency: string;
  transitTime?: string;
};

export default function QuotePage() {
  const [config, setConfig] = useState<QuoteConfig>(initialConfig);
  const [saved, setSaved] = useState(false);

  const selectedCountry = useMemo(
    () => africanCountries.find((country) => country.iso2 === config.destinationCountry) ?? africanCountries[0],
    [config.destinationCountry],
  );
  const pricing = useMemo(() => calculatePCBQuote(config), [config]);
  const errors = useMemo(() => validateQuoteConfig(config), [config]);

  function update<K extends keyof QuoteConfig>(key: K, value: QuoteConfig[K]) {
    setSaved(false);
    setConfig((current) => ({ ...current, [key]: value }));
  }

  function clearLiveShippingFields(current: QuoteConfig): QuoteConfig {
    return {
      ...current,
      liveShippingRateId: undefined,
      liveShippingCarrier: undefined,
      liveShippingService: undefined,
      liveShippingAmount: undefined,
      liveShippingCurrency: undefined,
      liveShippingTransitTime: undefined,
    };
  }

  function updateDestinationCountry(value: string) {
    setSaved(false);
    setConfig((current) => ({
      ...clearLiveShippingFields(current),
      destinationCountry: value,
    }));
  }

  function updateShippingMode(value: QuoteConfig['shippingMode']) {
    setSaved(false);
    setConfig((current) => ({
      ...clearLiveShippingFields(current),
      shippingMode: value,
    }));
  }

  function selectLiveShippingRate(rate: ShippingRateSelection) {
    setSaved(false);
    setConfig((current) => ({
      ...current,
      liveShippingRateId: rate.id,
      liveShippingCarrier: rate.carrier,
      liveShippingService: rate.service,
      liveShippingAmount: rate.amount,
      liveShippingCurrency: rate.currency,
      liveShippingTransitTime: rate.transitTime,
    }));
  }

  return (
    <main className="min-h-screen bg-[#f3f5f7] text-[#1f2933]">
      <Navbar />

      <section className="border-b border-slate-200 bg-white pt-32">
        <div className="mx-auto max-w-[1280px] px-4 pb-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500">
                Ship to: <span className="text-[#0f8f6b]">{selectedCountry.name}</span> / {selectedCountry.logisticsZone}
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Online PCB Quote</h1>
            </div>
            <a href="/how-it-works" className="text-sm font-bold text-[#0f8f6b] hover:text-[#096b51]">
              Instructions For Ordering &gt;
            </a>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {productCards.map((product) => (
              <button
                key={product.value}
                type="button"
                onClick={() => update('productType', product.value)}
                className={`flex min-h-24 items-start gap-3 rounded-sm border bg-white p-4 text-left transition ${
                  config.productType === product.value
                    ? 'border-[#0f8f6b] shadow-[inset_0_3px_0_#0f8f6b]'
                    : 'border-slate-200 hover:border-[#0f8f6b]/55'
                }`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-[#e8f7f2] text-xs font-black text-[#0f8f6b]">
                  PCB
                </span>
                <span>
                  <span className="block text-sm font-black text-slate-950">{product.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{product.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1280px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="space-y-5">
          <Panel title="Devis Express PCB" description="Une seule zone prend en charge Gerber, BOM et CPL." defaultOpen>
            <UnifiedUpload
              gerberFileName={config.gerberFileName}
              bomFileName={config.bomFileName}
              cplFileName={config.cplFileName}
              onGerber={(name) => update('gerberFileName', name)}
              onBom={(name) => update('bomFileName', name)}
              onCpl={(name) => update('cplFileName', name)}
            />
          </Panel>

          <Panel title="Paramètres de base" description="Materiau, couches, dimensions, quantite et type de produit." defaultOpen>
            <CardOptions
              value={config.baseMaterial}
              onChange={(value) => update('baseMaterial', value as QuoteConfig['baseMaterial'])}
              options={[
                ['FR4', 'Up to 20 layers, controlled impedance, low cost.'],
                ['Flex', 'Thin flexible polymer film, low weight.'],
                ['Aluminum', 'Better thermal conductivity for LED and power.'],
                ['Copper Core', 'High heat dissipation for high-power designs.'],
                ['Rogers', 'High-frequency and low-loss dielectric.'],
                ['PTFE Teflon', 'High-frequency, high-temperature applications.'],
              ]}
            />
            <QuoteRow label="Layers" help="Odd layer counts are normally adjusted to the next even count by manufacturers.">
              <Pills value={config.layers} onChange={(value) => update('layers', Number(value))} options={[1, 2, 4, 6, 8, 10, 12, 14, 16]} />
            </QuoteRow>
            <QuoteRow label="Dimensions" help="Dimension of the single PCB or panel you upload.">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_110px]">
                <NumberBox label="Length" value={config.length} onChange={(value) => update('length', value)} />
                <NumberBox label="Width" value={config.width} onChange={(value) => update('width', value)} />
                <SelectBox value={config.unit} onChange={(value) => update('unit', value as QuoteConfig['unit'])} options={['mm', 'inch']} />
              </div>
            </QuoteRow>
            <QuoteRow label="PCB Qty" help="Choose a common quantity or enter a custom value.">
              <div className="space-y-3">
                <Pills value={config.quantity} onChange={(value) => update('quantity', Number(value))} options={quantityOptions} />
                <NumberBox label="Custom Qty" value={config.quantity} min={1} onChange={(value) => update('quantity', value)} />
              </div>
            </QuoteRow>
            <QuoteRow label="Product Type" help="Medical and aerospace requirements add higher validation cost.">
              <Pills
                value={config.usageType}
                onChange={(value) => update('usageType', value as QuoteConfig['usageType'])}
                options={[
                  ['consumer_industrial', 'Industrial/Consumer electronics'],
                  ['aerospace', 'Aerospace'],
                  ['medical', 'Medical'],
                ]}
              />
            </QuoteRow>
          </Panel>

          <Panel title="Spécifications PCB" description="Epaisseur, couleur, finition, cuivre et recouvrement des vias.">
            <QuoteRow label="Different Design" help="Number of unique designs separated by v-cuts, mouse bites or milling slots.">
              <Pills value={config.differentDesigns} onChange={(value) => update('differentDesigns', Number(value))} options={[1, 2, 3, 4]} />
            </QuoteRow>
            <QuoteRow label="Delivery Format" help="Single board, customer panel, or panel created by the supplier.">
              <Pills
                value={config.deliveryFormat}
                onChange={(value) => update('deliveryFormat', value as QuoteConfig['deliveryFormat'])}
                options={[
                  ['single_pcb', 'Single PCB'],
                  ['customer_panel', 'Panel by Customer'],
                  ['panel_by_partner', 'Panel by Supplier'],
                ]}
              />
            </QuoteRow>
            <QuoteRow label="PCB Thickness" help="Finished board thickness. Thin and thick boards can affect price.">
              <Pills value={config.thickness} onChange={(value) => update('thickness', String(value))} options={['0.8mm', '1.0mm', '1.2mm', '1.6mm', '2.0mm']} />
            </QuoteRow>
            <QuoteRow label="PCB Color" help="Green is normally the fastest and cheapest solder mask color.">
              <ColorPills value={config.solderMaskColor} onChange={(value) => update('solderMaskColor', value)} />
            </QuoteRow>
            <QuoteRow label="Silkscreen" help="Printed reference designators and labels.">
              <Pills value={config.silkscreenColor} onChange={(value) => update('silkscreenColor', String(value))} options={['White', 'Black', 'Yellow']} />
            </QuoteRow>
            <QuoteRow label="Surface Finish" help="HASL is affordable; ENIG adds flatness, shelf life and tighter tolerances.">
              <Pills value={config.surfaceFinish} onChange={(value) => update('surfaceFinish', String(value))} options={['HASL lead-free', 'ENIG', 'OSP', 'Immersion silver']} />
            </QuoteRow>
            <QuoteRow label="Via Covering" help="Le recouvrement des vias influence la fabrication et le cout.">
              <Pills value={config.viaCovering} onChange={(value) => update('viaCovering', String(value))} options={['Tented', 'Plugged', 'Epoxy filled']} />
            </QuoteRow>
            <QuoteRow label="Outer Copper Weight" help="Copper weight on outer layers.">
              <Pills value={config.outerCopperWeight} onChange={(value) => update('outerCopperWeight', String(value))} options={['1 oz', '2 oz', '3 oz']} />
            </QuoteRow>
            <QuoteRow label="Inner Copper Weight" help="Copper thickness on internal layers for multilayer boards.">
              <Pills value={config.innerCopperWeight} onChange={(value) => update('innerCopperWeight', String(value))} options={['0.5 oz', '1 oz', '2 oz']} />
            </QuoteRow>
          </Panel>

          <Panel title="Options de haute spécification" description="Precision, tests, marquage et processus speciaux.">
            <QuoteRow label="Min via hole size / diameter" help="Small vias can increase manufacturing precision cost.">
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectBox value={config.minimumViaHole} onChange={(value) => update('minimumViaHole', value)} options={['0.2mm', '0.25mm', '0.3mm', '0.4mm']} />
                <SelectBox value={config.viaDiameter} onChange={(value) => update('viaDiameter', value)} options={['0.45mm', '0.5mm', '0.6mm', '0.8mm']} />
              </div>
            </QuoteRow>
            <QuoteRow label="Mark on PCB" help="Choose order mark, barcode, serial number or mark removal.">
              <div className="grid gap-3 md:grid-cols-3">
                <Switch label="Order Number" checked={config.orderNumberMarking} onChange={(value) => update('orderNumberMarking', value)} />
                <Switch label="Specify Position" checked={config.markingLocationSpecified} onChange={(value) => update('markingLocationSpecified', value)} />
                <Switch label="Remove Mark" checked={config.removeMarking} onChange={(value) => update('removeMarking', value)} />
                <Switch label="2D Barcode" checked={config.twoDBarcode} onChange={(value) => update('twoDBarcode', value)} />
                <Switch label="Serial Number" checked={config.serialNumber} onChange={(value) => update('serialNumber', value)} />
              </div>
            </QuoteRow>
            <QuoteRow label="Electrical Test" help="Testing choices affect quality assurance and lead time.">
              <div className="grid gap-3 md:grid-cols-3">
                <Switch label="Flying Probe" checked={config.flyingProbe} onChange={(value) => update('flyingProbe', value)} />
                <Switch label="Full Test" checked={config.fullElectricalTest} onChange={(value) => update('fullElectricalTest', value)} />
                <Switch label="Random Test" checked={config.randomElectricalTest} onChange={(value) => update('randomElectricalTest', value)} />
                <Switch label="4-Wire Kelvin" checked={config.fourWireKelvinTest} onChange={(value) => update('fourWireKelvinTest', value)} />
                <Switch label="AOI" checked={config.aoi} onChange={(value) => update('aoi', value)} />
              </div>
            </QuoteRow>
            <QuoteRow label="Special Processes" help="Advanced process options are reviewed before production.">
              <div className="grid gap-3 md:grid-cols-3">
                <Switch label="Impedance Control" checked={config.impedanceControl} onChange={(value) => update('impedanceControl', value)} />
                <Switch label="Gold Fingers" checked={config.goldFingers} onChange={(value) => update('goldFingers', value)} />
                <Switch label="Castellated Holes" checked={config.castellatedHoles} onChange={(value) => update('castellatedHoles', value)} />
                <Switch label="Edge Plating" checked={config.edgePlating} onChange={(value) => update('edgePlating', value)} />
                <Switch label="Blind/Buried Vias" checked={config.blindBuriedVias} onChange={(value) => update('blindBuriedVias', value)} />
                <Switch label="Via-in-pad" checked={config.viaInPad} onChange={(value) => update('viaInPad', value)} />
                <Switch label="Peelable Mask" checked={config.peelableMask} onChange={(value) => update('peelableMask', value)} />
                <Switch label="Carbon Ink" checked={config.carbonInk} onChange={(value) => update('carbonInk', value)} />
                <Switch label="Countersink" checked={config.countersink} onChange={(value) => update('countersink', value)} />
                <Switch label="Press-fit Holes" checked={config.pressFitHoles} onChange={(value) => update('pressFitHoles', value)} />
              </div>
            </QuoteRow>
          </Panel>

          <Panel title="Options avancées" description="Flex, assemblage, stencil et livraison.">
            <QuoteRow label="Coverlay / Stiffener" help="Add reinforcement and coverlay information for flexible circuits.">
              <div className="grid gap-3 md:grid-cols-3">
                <SelectBox value={config.coverlayThickness} onChange={(value) => update('coverlayThickness', value)} options={['', '12.5um', '25um', '50um']} />
                <SelectBox value={config.stiffenerType} onChange={(value) => update('stiffenerType', value)} options={['', 'FR4', 'PI', 'Steel']} />
                <SelectBox value={config.stiffenerThickness} onChange={(value) => update('stiffenerThickness', value)} options={['', '0.1mm', '0.2mm', '0.3mm']} />
                <Switch label="EMI Shielding Film" checked={config.emiShieldingFilm} onChange={(value) => update('emiShieldingFilm', value)} />
                <SelectBox value={config.cuttingMethod} onChange={(value) => update('cuttingMethod', value)} options={['CNC', 'Laser']} />
                <SelectBox value={config.adhesiveType} onChange={(value) => update('adhesiveType', value)} options={['', 'Acrylic', 'Epoxy']} />
              </div>
            </QuoteRow>
            <QuoteRow label="Assembly request" help="BOM and CPL files are required before cart validation.">
              <div className="grid gap-3 md:grid-cols-3">
                <Switch label="Assemble PCB boards" checked={config.assemblyRequired} onChange={(value) => update('assemblyRequired', value)} />
                <SelectBox value={config.assemblySide} onChange={(value) => update('assemblySide', value)} options={['top', 'bottom', 'both']} />
                <SelectBox value={config.componentSourcing} onChange={(value) => update('componentSourcing', value)} options={['partner_sourced', 'customer_supplied', 'mixed']} />
                <Switch label="Confirm Parts Placement" checked={config.confirmPartsPlacement} onChange={(value) => update('confirmPartsPlacement', value)} />
              </div>
            </QuoteRow>
            <QuoteRow label="Stencil options" help="Add stencil type, size, frame and polishing options.">
              <div className="grid gap-3 md:grid-cols-3">
                <Switch label="Order together with PCB" checked={config.stencilRequired} onChange={(value) => update('stencilRequired', value)} />
                <SelectBox value={config.stencilType} onChange={(value) => update('stencilType', value)} options={['', 'prototype', 'production', 'smt']} />
                <SelectBox value={config.stencilSize} onChange={(value) => update('stencilSize', value)} options={['200x200mm', '280x380mm', '370x470mm']} />
                <SelectBox value={config.stencilThickness} onChange={(value) => update('stencilThickness', value)} options={['0.10mm', '0.12mm', '0.15mm', '0.18mm']} />
                <Switch label="Frame" checked={config.stencilFrame} onChange={(value) => update('stencilFrame', value)} />
                <Switch label="Electropolishing" checked={config.electroPolishing} onChange={(value) => update('electroPolishing', value)} />
                <Switch label="Engraving" checked={config.engraving} onChange={(value) => update('engraving', value)} />
              </div>
            </QuoteRow>
            <QuoteRow label="Destination" help="Country affects Africa delivery charge and estimated lead time.">
              <div className="grid gap-3 md:grid-cols-3">
                <SelectBox
                  value={config.destinationCountry}
                  onChange={(value) => update('destinationCountry', value)}
                  options={africanCountries.map((country) => [country.iso2, country.name])}
                />
                <SelectBox value={selectedCountry.logisticsZone} onChange={() => undefined} options={[selectedCountry.logisticsZone]} />
                <SelectBox value={config.shippingMode} onChange={(value) => update('shippingMode', value as QuoteConfig['shippingMode'])} options={['economy', 'standard', 'express']} />
                <Switch label="Insurance" checked={config.insuranceRequired} onChange={(value) => update('insuranceRequired', value)} />
              </div>
            </QuoteRow>
          </Panel>

          {saved ? (
            <div className="rounded-sm border border-[#b9ebda] bg-[#eefbf6] p-4 text-sm font-bold text-[#116b52]">
              Quote saved locally. Supplier validation remains required before final checkout.
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          <PricingSummary
            pricing={pricing}
            errors={errors}
            onSave={() => setSaved(true)}
            productionSpeed={config.productionSpeed}
            onProductionSpeedChange={(value) => update('productionSpeed', value)}
            countries={africanCountries}
            destinationCountry={config.destinationCountry}
            onDestinationCountryChange={updateDestinationCountry}
            shippingMode={config.shippingMode}
            onShippingModeChange={updateShippingMode}
            selectedLiveShippingRateId={config.liveShippingRateId}
            onLiveShippingRateSelect={selectLiveShippingRate}
          />
          <SupportCard />
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Panel({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-sm border border-slate-200 bg-white shadow-sm" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-slate-100 px-4 py-3">
        <span>
          <span className="block text-base font-black text-slate-950">{title}</span>
          <span className="mt-0.5 block text-xs leading-5 text-slate-500">{description}</span>
        </span>
        <span className="text-xl font-black text-slate-800 transition group-open:rotate-180">⌄</span>
      </summary>
      <div>{children}</div>
    </details>
  );
}

function QuoteRow({ label, help, children }: { label: string; help: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 lg:grid-cols-[190px_1fr]">
      <div>
        <h3 className="text-sm font-black text-slate-900">{label}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{help}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function UnifiedUpload({
  gerberFileName,
  bomFileName,
  cplFileName,
  onGerber,
  onBom,
  onCpl,
}: {
  gerberFileName?: string;
  bomFileName?: string;
  cplFileName?: string;
  onGerber: (name: string) => void;
  onBom: (name: string) => void;
  onCpl: (name: string) => void;
}) {
  return (
    <div className="bg-[#eaf2fb] px-5 py-8 text-center">
      <label className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-full bg-[#0877ff] px-12 py-4 text-base font-black text-white shadow-sm transition hover:bg-[#0068e8]">
        <input
          type="file"
          accept=".zip,.rar"
          required
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onGerber(file.name);
          }}
        />
        <span className="text-xl">⇧</span>
        <span>{gerberFileName ?? 'Ajouter Gerber'}</span>
      </label>
      <p className="mt-5 text-sm text-slate-500">Accepte uniquement les fichiers zip ou rar, Max 100 Mo, Voir exemple &gt;.</p>
      <p className="mt-3 text-sm text-slate-500">Tous les televersements sont effectues en toute securite et dans le respect de la confidentialite</p>
      <div className="mx-auto mt-5 grid max-w-2xl gap-3 sm:grid-cols-2">
        <CompactFile label="BOM" fileName={bomFileName} accept=".csv,.xlsx,.xls" onFile={onBom} />
        <CompactFile label="CPL" fileName={cplFileName} accept=".csv,.xlsx,.xls" onFile={onCpl} />
      </div>
    </div>
  );
}

function CompactFile({
  label,
  fileName,
  accept,
  onFile,
}: {
  label: string;
  fileName?: string;
  accept: string;
  onFile: (name: string) => void;
}) {
  return (
    <label className="cursor-pointer rounded-sm border border-dashed border-slate-300 bg-white/70 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-[#0877ff]">
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file.name);
        }}
      />
      {fileName ?? `Ajouter ${label}`}
    </label>
  );
}

function CardOptions({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
      {options.map(([option, description]) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`min-h-28 rounded-sm border p-4 text-left transition ${
            value === option ? 'border-[#0f8f6b] bg-[#eefbf6]' : 'border-slate-200 hover:border-[#0f8f6b]/55'
          }`}
        >
          <span className="block text-sm font-black text-slate-950">{option}</span>
          <span className="mt-2 block text-xs leading-5 text-slate-500">{description}</span>
        </button>
      ))}
    </div>
  );
}

function Pills({
  value,
  onChange,
  options,
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  options: Array<string | number | [string | number, string]>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((item) => {
        const optionValue = Array.isArray(item) ? item[0] : item;
        const label = Array.isArray(item) ? item[1] : item;
        return (
          <button
            key={String(optionValue)}
            type="button"
            onClick={() => onChange(optionValue)}
            className={`min-h-10 rounded-sm border px-4 text-sm font-bold transition ${
              value === optionValue ? 'border-[#0f8f6b] bg-[#0f8f6b] text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-[#0f8f6b]/55'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ColorPills({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const colors = [
    ['Green', '#1f9d55'],
    ['Red', '#dc2626'],
    ['Yellow', '#facc15'],
    ['Blue', '#2563eb'],
    ['White', '#ffffff'],
    ['Black', '#111827'],
    ['Purple', '#7c3aed'],
    ['Matte black', '#020617'],
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {colors.map(([label, color]) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(label)}
          className={`flex min-h-11 items-center gap-2 rounded-sm border px-4 text-sm font-bold transition ${
            value === label ? 'border-[#0f8f6b] bg-[#eefbf6] text-[#0f6f54]' : 'border-slate-200 bg-white text-slate-700 hover:border-[#0f8f6b]/55'
          }`}
        >
          <span className="h-4 w-4 rounded-full border border-slate-300" style={{ backgroundColor: color }} />
          {label}
        </button>
      ))}
    </div>
  );
}

function NumberBox({
  label,
  value,
  min = 0,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-500">{label}</span>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full rounded-sm border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-[#0f8f6b] focus:ring-2 focus:ring-[#0f8f6b]/15"
      />
    </label>
  );
}

function SelectBox({
  value,
  onChange,
  options,
}: {
  value: string | number;
  onChange: (value: string) => void;
  options: Array<string | number | [string | number, string]>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-sm border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-[#0f8f6b] focus:ring-2 focus:ring-[#0f8f6b]/15"
    >
      {options.map((item) => {
        const optionValue = Array.isArray(item) ? item[0] : item;
        const label = Array.isArray(item) ? item[1] : item;
        return (
          <option key={String(optionValue)} value={optionValue}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-sm border px-3 text-sm font-bold transition ${
      checked ? 'border-[#0f8f6b] bg-[#eefbf6] text-[#0f6f54]' : 'border-slate-200 bg-white text-slate-700 hover:border-[#0f8f6b]/55'
    }`}>
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#0f8f6b]" />
    </label>
  );
}

function SupportCard() {
  return (
    <aside className="rounded-sm border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Need help?</h2>
      <div className="mt-4 space-y-3 text-sm">
        <a href="/contact" className="block rounded-sm border border-slate-200 p-3 font-bold text-[#0f8f6b] hover:border-[#0f8f6b]">
          Online Chat &gt;
          <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">Fast reply for quote questions.</span>
        </a>
        <a href="/contact" className="block rounded-sm border border-slate-200 p-3 font-bold text-[#0f8f6b] hover:border-[#0f8f6b]">
          Email Us &gt;
          <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">Contact support for supplier review.</span>
        </a>
        <a href="/faq" className="block rounded-sm border border-slate-200 p-3 font-bold text-[#0f8f6b] hover:border-[#0f8f6b]">
          Help Center &gt;
          <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">Get instant answers.</span>
        </a>
      </div>
    </aside>
  );
}
