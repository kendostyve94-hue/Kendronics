'use client';

import { useMemo, useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { PricingSummary } from '../../components/quote/PricingSummary';
import { africanCountries } from '../../lib/african-countries';
import { getApiBaseUrl } from '../../lib/api-base-url';
import { readFreshAuthSession } from '../../lib/auth-session';
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

type UploadState = {
  status: 'idle' | 'uploading' | 'uploaded' | 'error';
  uploadId?: string;
  message?: string;
};

type QuoteSaveState = {
  status: 'idle' | 'saving' | 'saved' | 'error';
  quoteId?: string;
  orderId?: string;
  message?: string;
};

type QuotePanelId = 'base' | 'specs' | 'highSpec' | 'advanced';

const apiBaseUrl = getApiBaseUrl();
const customerOrdersStorageKey = 'kendronics.customer.orders';

export default function QuotePage() {
  const [config, setConfig] = useState<QuoteConfig>(initialConfig);
  const [saved, setSaved] = useState(false);
  const [gerberUpload, setGerberUpload] = useState<UploadState>({ status: 'idle' });
  const [quoteSave, setQuoteSave] = useState<QuoteSaveState>({ status: 'idle' });
  const [openPanel, setOpenPanel] = useState<QuotePanelId>('base');

  const selectedCountry = useMemo(
    () => africanCountries.find((country) => country.iso2 === config.destinationCountry) ?? africanCountries[0],
    [config.destinationCountry],
  );
  const pricing = useMemo(() => calculatePCBQuote(config), [config]);
  const errors = useMemo(() => validateQuoteConfig(config), [config]);

  function update<K extends keyof QuoteConfig>(key: K, value: QuoteConfig[K]) {
    setSaved(false);
    setQuoteSave({ status: 'idle' });
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

  async function uploadGerber(file: File) {
    setSaved(false);
    setQuoteSave({ status: 'idle' });
    setGerberUpload({ status: 'uploading', message: 'Upload Gerber ZIP en cours...' });

    try {
      const session = await readFreshAuthSession();
      if (!session) {
        throw new Error('Connectez-vous avant de televerser un fichier Gerber.');
      }

      let presignResponse: Response;
      try {
        presignResponse = await fetch(`${apiBaseUrl}/api/uploads/presign`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type || 'application/zip',
            fileSizeBytes: file.size,
          }),
        });
      } catch {
        throw new Error("Impossible de contacter l'API Render pour preparer l'upload.");
      }

      if (!presignResponse.ok) {
        const error = await presignResponse.json().catch(() => null);
        throw new Error(Array.isArray(error?.message) ? error.message.join(' ') : error?.message ?? 'Upload impossible pour le moment.');
      }

      const presignedUpload = (await presignResponse.json()) as { uploadId: string; uploadUrl: string };
      let uploadResponse: Response;
      try {
        uploadResponse = await fetch(presignedUpload.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/zip' },
          body: file,
        });
      } catch {
        throw new Error('Cloudflare R2 bloque encore l upload. Verifiez la politique CORS du bucket.');
      }

      if (!uploadResponse.ok) {
        throw new Error(`Le stockage prive a refuse le fichier (${uploadResponse.status}).`);
      }

      update('gerberFileName', file.name);
      setGerberUpload({ status: 'uploaded', uploadId: presignedUpload.uploadId, message: 'Gerber ZIP televerse en stockage prive.' });
    } catch (error) {
      setGerberUpload({
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload impossible pour le moment.',
      });
    }
  }

  async function saveQuote() {
    setSaved(false);
    setQuoteSave({ status: 'saving', message: 'Sauvegarde du devis...' });

    try {
      const session = await readFreshAuthSession();
      if (!session) {
        throw new Error('Connectez-vous avant de sauvegarder un devis.');
      }

      if (!gerberUpload.uploadId) {
        throw new Error('Televersez un fichier Gerber ZIP avant de sauvegarder le devis.');
      }

      const response = await fetch(`${apiBaseUrl}/api/pricing/quote`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productType: config.productType,
          gerberFileId: gerberUpload.uploadId,
          layers: config.layers,
          lengthMm: toMillimeters(config.length, config.unit),
          widthMm: toMillimeters(config.width, config.unit),
          quantity: config.quantity,
          destinationCountryIso2: config.destinationCountry,
          shippingMode: config.shippingMode,
          configSnapshot: {
            ...config,
            lengthMm: toMillimeters(config.length, config.unit),
            widthMm: toMillimeters(config.width, config.unit),
            gerberFileId: gerberUpload.uploadId,
            gerberFileName: config.gerberFileName,
            bomFileName: config.bomFileName,
            cplFileName: config.cplFileName,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(Array.isArray(error?.message) ? error.message.join(' ') : error?.message ?? 'Impossible de sauvegarder le devis.');
      }

      const quote = (await response.json()) as { id: string };
      const orderResponse = await fetch(`${apiBaseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId: quote.id,
          destinationCountryIso2: config.destinationCountry,
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json().catch(() => null);
        throw new Error(Array.isArray(error?.message) ? error.message.join(' ') : error?.message ?? "Le devis est cree, mais la commande n'a pas pu etre ouverte.");
      }

      const order = (await orderResponse.json()) as { id: string; orderNumber: string };
      rememberCustomerOrder(order.id);
      setSaved(true);
      setQuoteSave({
        status: 'saved',
        quoteId: quote.id,
        orderId: order.id,
        message: `Commande ouverte: ${order.orderNumber}`,
      });
    } catch (error) {
      setQuoteSave({
        status: 'error',
        message: error instanceof Error ? error.message : 'Impossible de sauvegarder le devis.',
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f5f7] text-[#1f2933]">
      <Navbar />

      <section className="border-b border-slate-200 bg-white pt-24 sm:pt-32">
        <div className="mx-auto max-w-[1280px] px-3 pb-3 sm:px-6 sm:pb-5 lg:px-8">
          <div className="flex flex-col gap-2 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500">
                Livraison vers : <span className="text-[#0f8f6b]">{selectedCountry.name}</span> / {selectedCountry.logisticsZone}
              </div>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">Devis PCB en ligne</h1>
            </div>
            <a href="/how-it-works" className="text-xs font-bold text-[#0f8f6b] hover:text-[#096b51] sm:text-sm">
              Instructions de commande &gt;
            </a>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 md:grid-cols-2 xl:grid-cols-4">
            {productCards.map((product) => (
              <button
                key={product.value}
                type="button"
                onClick={() => update('productType', product.value)}
                className={`flex min-h-[4.75rem] items-start gap-2 rounded-sm border bg-white p-2.5 text-left transition sm:min-h-24 sm:gap-3 sm:p-4 ${
                  config.productType === product.value
                    ? 'border-[#0f8f6b]'
                    : 'border-slate-200 hover:border-[#0f8f6b]/55'
                }`}
              >
                <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-sm bg-[#e8f7f2] text-xs font-black text-[#0f8f6b] sm:grid">
                  PCB
                </span>
                <span>
                  <span className="block text-xs font-black text-slate-950 sm:text-sm">{product.title}</span>
                  <span className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">{product.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1280px] gap-3 px-3 py-3 pb-28 sm:gap-5 sm:px-6 sm:py-5 sm:pb-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="space-y-3 sm:space-y-5">
          <Panel
            title="Devis Express PCB"
            description="Une seule zone prend en charge Gerber, BOM et CPL."
            isOpen
            onToggle={() => undefined}
          >
            <UnifiedUpload
              gerberFileName={config.gerberFileName}
              bomFileName={config.bomFileName}
              cplFileName={config.cplFileName}
              gerberUpload={gerberUpload}
              onGerber={uploadGerber}
              onBom={(name) => update('bomFileName', name)}
              onCpl={(name) => update('cplFileName', name)}
            />
          </Panel>

          <Panel
            title="Paramètres de base"
            description="Materiau, couches, dimensions, quantite et type de produit."
            isOpen={openPanel === 'base'}
            onToggle={() => setOpenPanel('base')}
          >
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
            <QuoteRow label="Couches" help="Les nombres impairs sont souvent ajustes au nombre pair superieur par les fabricants.">
              <Pills value={config.layers} onChange={(value) => update('layers', Number(value))} options={[1, 2, 4, 6, 8, 10, 12, 14, 16]} />
            </QuoteRow>
            <QuoteRow label="Dimensions" help="Dimension of the single PCB or panel you upload.">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_110px]">
                <NumberBox label="Longueur" value={config.length} onChange={(value) => update('length', value)} />
                <NumberBox label="Largeur" value={config.width} onChange={(value) => update('width', value)} />
                <SelectBox value={config.unit} onChange={(value) => update('unit', value as QuoteConfig['unit'])} options={['mm', 'inch']} />
              </div>
            </QuoteRow>
            <QuoteRow label="Quantite PCB" help="Choisissez une quantite courante ou entrez une valeur personnalisee.">
              <div className="space-y-3">
                <Pills value={config.quantity} onChange={(value) => update('quantity', Number(value))} options={quantityOptions} />
                <NumberBox label="Quantite personnalisee" value={config.quantity} min={1} onChange={(value) => update('quantity', value)} />
              </div>
            </QuoteRow>
            <QuoteRow label="Type d usage" help="Les exigences medicales et aerospatiales ajoutent des couts de validation.">
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

          <Panel
            title="Spécifications PCB"
            description="Epaisseur, couleur, finition, cuivre et recouvrement des vias."
            isOpen={openPanel === 'specs'}
            onToggle={() => setOpenPanel('specs')}
          >
            <QuoteRow label="Designs differents" help="Nombre de designs uniques separes par V-cut, mouse bites ou fraisage.">
              <Pills value={config.differentDesigns} onChange={(value) => update('differentDesigns', Number(value))} options={[1, 2, 3, 4]} />
            </QuoteRow>
            <QuoteRow label="Format de livraison" help="Carte seule, panneau client ou panneau cree par le fournisseur.">
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
            <QuoteRow label="Epaisseur PCB" help="Epaisseur finale de la carte. Les cartes fines ou epaisses influencent le prix.">
              <Pills value={config.thickness} onChange={(value) => update('thickness', String(value))} options={['0.8mm', '1.0mm', '1.2mm', '1.6mm', '2.0mm']} />
            </QuoteRow>
            <QuoteRow label="Couleur PCB" help="Le vert est generalement la couleur de masque la plus rapide et economique.">
              <ColorPills value={config.solderMaskColor} onChange={(value) => update('solderMaskColor', value)} />
            </QuoteRow>
            <QuoteRow label="Serigraphie" help="References et libelles imprimes sur la carte.">
              <Pills value={config.silkscreenColor} onChange={(value) => update('silkscreenColor', String(value))} options={['White', 'Black', 'Yellow']} />
            </QuoteRow>
            <QuoteRow label="Finition de surface" help="HASL est economique; ENIG apporte planeite, duree de stockage et tolerances plus serrees.">
              <Pills value={config.surfaceFinish} onChange={(value) => update('surfaceFinish', String(value))} options={['HASL lead-free', 'ENIG', 'OSP', 'Immersion silver']} />
            </QuoteRow>
            <QuoteRow label="Via Covering" help="Le recouvrement des vias influence la fabrication et le cout.">
              <Pills value={config.viaCovering} onChange={(value) => update('viaCovering', String(value))} options={['Tented', 'Plugged', 'Epoxy filled']} />
            </QuoteRow>
            <QuoteRow label="Cuivre externe" help="Epaisseur de cuivre sur les couches externes.">
              <Pills value={config.outerCopperWeight} onChange={(value) => update('outerCopperWeight', String(value))} options={['1 oz', '2 oz', '3 oz']} />
            </QuoteRow>
            <QuoteRow label="Cuivre interne" help="Epaisseur de cuivre sur les couches internes des cartes multicouches.">
              <Pills value={config.innerCopperWeight} onChange={(value) => update('innerCopperWeight', String(value))} options={['0.5 oz', '1 oz', '2 oz']} />
            </QuoteRow>
          </Panel>

          <Panel
            title="Options de haute spécification"
            description="Precision, tests, marquage et processus speciaux."
            isOpen={openPanel === 'highSpec'}
            onToggle={() => setOpenPanel('highSpec')}
          >
            <QuoteRow label="Taille trou via / diametre" help="Les petits vias peuvent augmenter le cout de precision.">
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectBox value={config.minimumViaHole} onChange={(value) => update('minimumViaHole', value)} options={['0.2mm', '0.25mm', '0.3mm', '0.4mm']} />
                <SelectBox value={config.viaDiameter} onChange={(value) => update('viaDiameter', value)} options={['0.45mm', '0.5mm', '0.6mm', '0.8mm']} />
              </div>
            </QuoteRow>
            <QuoteRow label="Marquage PCB" help="Choisissez numero de commande, code-barres, serie ou suppression du marquage.">
              <div className="grid gap-3 md:grid-cols-3">
                <Switch label="Order Number" checked={config.orderNumberMarking} onChange={(value) => update('orderNumberMarking', value)} />
                <Switch label="Specify Position" checked={config.markingLocationSpecified} onChange={(value) => update('markingLocationSpecified', value)} />
                <Switch label="Remove Mark" checked={config.removeMarking} onChange={(value) => update('removeMarking', value)} />
                <Switch label="2D Barcode" checked={config.twoDBarcode} onChange={(value) => update('twoDBarcode', value)} />
                <Switch label="Serial Number" checked={config.serialNumber} onChange={(value) => update('serialNumber', value)} />
              </div>
            </QuoteRow>
            <QuoteRow label="Test electrique" help="Les choix de test influencent qualite et delai.">
              <div className="grid gap-3 md:grid-cols-3">
                <Switch label="Flying Probe" checked={config.flyingProbe} onChange={(value) => update('flyingProbe', value)} />
                <Switch label="Full Test" checked={config.fullElectricalTest} onChange={(value) => update('fullElectricalTest', value)} />
                <Switch label="Random Test" checked={config.randomElectricalTest} onChange={(value) => update('randomElectricalTest', value)} />
                <Switch label="4-Wire Kelvin" checked={config.fourWireKelvinTest} onChange={(value) => update('fourWireKelvinTest', value)} />
                <Switch label="AOI" checked={config.aoi} onChange={(value) => update('aoi', value)} />
              </div>
            </QuoteRow>
            <QuoteRow label="Procede speciaux" help="Les options avancees sont revues avant production.">
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

          <Panel
            title="Options avancées"
            description="Flex, assemblage, stencil et livraison."
            isOpen={openPanel === 'advanced'}
            onToggle={() => setOpenPanel('advanced')}
          >
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
            <QuoteRow label="Demande d assemblage" help="Les fichiers BOM et CPL sont requis avant validation panier.">
              <div className="grid gap-3 md:grid-cols-3">
                <Switch label="Assemble PCB boards" checked={config.assemblyRequired} onChange={(value) => update('assemblyRequired', value)} />
                <SelectBox value={config.assemblySide} onChange={(value) => update('assemblySide', value)} options={['top', 'bottom', 'both']} />
                <SelectBox value={config.componentSourcing} onChange={(value) => update('componentSourcing', value)} options={['partner_sourced', 'customer_supplied', 'mixed']} />
                <Switch label="Confirm Parts Placement" checked={config.confirmPartsPlacement} onChange={(value) => update('confirmPartsPlacement', value)} />
              </div>
            </QuoteRow>
            <QuoteRow label="Options stencil" help="Ajoutez type, taille, cadre et options de polissage du stencil.">
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
            <QuoteRow label="Destination" help="Le pays influence les frais de livraison Afrique et le delai estime.">
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
            <div className="rounded-sm border border-[#b9ebda] bg-[#eefbf6] p-3 text-sm font-bold text-[#116b52] sm:p-4">
              Devis sauvegarde cote serveur. Validation fournisseur requise avant paiement final.
            </div>
          ) : null}
          {quoteSave.status === 'error' ? (
            <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 sm:p-4">
              {quoteSave.message}
            </div>
          ) : null}
          {quoteSave.status === 'saved' && quoteSave.message ? (
            <div className="rounded-sm border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700 sm:p-4">
              <p>{quoteSave.message}</p>
              {quoteSave.orderId ? (
                <a className="mt-3 inline-flex text-[#0877ff] hover:text-[#0068e8]" href={`/orders/${quoteSave.orderId}`}>
                  Voir la commande
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-3 sm:space-y-5 lg:sticky lg:top-28 lg:self-start">
          <PricingSummary
            pricing={pricing}
            errors={errors}
            onSave={saveQuote}
            saveState={quoteSave.status}
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
        </div>
      </section>

      <Footer />
    </main>
  );
}

function toMillimeters(value: number, unit: QuoteConfig['unit']): number {
  return unit === 'inch' ? Math.round(value * 25.4 * 100) / 100 : value;
}

function rememberCustomerOrder(orderId: string) {
  if (typeof window === 'undefined') return;

  try {
    const current = JSON.parse(window.localStorage.getItem(customerOrdersStorageKey) ?? '[]') as string[];
    const next = [orderId, ...current.filter((id) => id !== orderId)].slice(0, 20);
    window.localStorage.setItem(customerOrdersStorageKey, JSON.stringify(next));
    window.dispatchEvent(new Event('kendronics:orders-updated'));
  } catch {
    window.localStorage.setItem(customerOrdersStorageKey, JSON.stringify([orderId]));
    window.dispatchEvent(new Event('kendronics:orders-updated'));
  }
}

function Panel({
  title,
  description,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="group rounded-sm border border-slate-200 bg-white">
      <button
        type="button"
        className="flex w-full cursor-pointer list-none items-center justify-between gap-3 bg-slate-100 px-3 py-2.5 text-left sm:gap-4 sm:px-4 sm:py-3"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span>
          <span className="block text-sm font-black text-slate-950 sm:text-base">{title}</span>
          <span className="mt-0.5 hidden text-xs leading-5 text-slate-500 sm:block">{description}</span>
        </span>
        <span className={`text-xl font-black text-slate-800 transition ${isOpen ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {isOpen ? <div>{children}</div> : null}
    </section>
  );
}

function QuoteRow({ label, help, children }: { label: string; help: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-b border-slate-100 px-3 py-2.5 last:border-b-0 sm:gap-3 sm:px-4 sm:py-3 lg:grid-cols-[190px_1fr]">
      <div>
        <h3 className="text-sm font-black text-slate-900">{label}</h3>
        <p className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">{help}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function UnifiedUpload({
  gerberFileName,
  bomFileName,
  cplFileName,
  gerberUpload,
  onGerber,
  onBom,
  onCpl,
}: {
  gerberFileName?: string;
  bomFileName?: string;
  cplFileName?: string;
  gerberUpload: UploadState;
  onGerber: (file: File) => void;
  onBom: (name: string) => void;
  onCpl: (name: string) => void;
}) {
  return (
    <div className="bg-[#eaf2fb] px-3 py-4 text-center sm:px-5 sm:py-8">
      <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0877ff] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0068e8] sm:gap-3 sm:px-12 sm:py-4 sm:text-base">
        <input
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          required
          disabled={gerberUpload.status === 'uploading'}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onGerber(file);
          }}
        />
        <span className="text-xl">⇧</span>
        <span>{gerberUpload.status === 'uploading' ? 'Upload en cours...' : gerberFileName ?? 'Ajouter Gerber'}</span>
      </label>
      {gerberUpload.message ? (
        <p className={`mt-5 text-sm font-bold ${gerberUpload.status === 'error' ? 'text-red-600' : 'text-[#0f8f6b]'}`}>{gerberUpload.message}</p>
      ) : null}
      <p className="mt-3 text-xs text-slate-500 sm:mt-5 sm:text-sm">ZIP Gerber, Max 50 Mo, Voir exemple &gt;.</p>
      <p className="mt-3 hidden text-sm text-slate-500 sm:block">Tous les televersements sont effectues en toute securite et dans le respect de la confidentialite</p>
      <div className="mx-auto mt-3 grid max-w-2xl gap-2 sm:mt-5 sm:gap-3 sm:grid-cols-2">
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
    <label className="cursor-pointer rounded-sm border border-dashed border-slate-300 bg-white/70 px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:border-[#0877ff] sm:px-4 sm:py-3">
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
    <div className="grid gap-2 p-3 sm:gap-3 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
      {options.map(([option, description]) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`min-h-16 rounded-sm border p-3 text-left transition sm:min-h-28 sm:p-4 ${
            value === option ? 'border-[#0f8f6b] bg-[#eefbf6]' : 'border-slate-200 hover:border-[#0f8f6b]/55'
          }`}
        >
          <span className="block text-sm font-black text-slate-950">{option}</span>
          <span className="mt-2 hidden text-xs leading-5 text-slate-500 sm:block">{description}</span>
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
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {options.map((item) => {
        const optionValue = Array.isArray(item) ? item[0] : item;
        const label = Array.isArray(item) ? item[1] : item;
        return (
          <button
            key={String(optionValue)}
            type="button"
            onClick={() => onChange(optionValue)}
            className={`min-h-9 rounded-sm border px-3 text-xs font-bold transition sm:min-h-10 sm:px-4 sm:text-sm ${
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
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {colors.map(([label, color]) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(label)}
          className={`flex min-h-9 items-center gap-2 rounded-sm border px-3 text-xs font-bold transition sm:min-h-11 sm:px-4 sm:text-sm ${
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
        className="h-10 w-full rounded-sm border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-[#0f8f6b] focus:ring-2 focus:ring-[#0f8f6b]/15 sm:h-11"
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
      className="h-10 w-full rounded-sm border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-[#0f8f6b] focus:ring-2 focus:ring-[#0f8f6b]/15 sm:h-11"
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
    <label className={`flex min-h-10 cursor-pointer items-center justify-between gap-2 rounded-sm border px-3 text-xs font-bold transition sm:min-h-11 sm:gap-3 sm:text-sm ${
      checked ? 'border-[#0f8f6b] bg-[#eefbf6] text-[#0f6f54]' : 'border-slate-200 bg-white text-slate-700 hover:border-[#0f8f6b]/55'
    }`}>
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#0f8f6b]" />
    </label>
  );
}
