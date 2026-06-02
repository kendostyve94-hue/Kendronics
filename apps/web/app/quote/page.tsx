'use client';

import { useEffect, useMemo, useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { PricingSummary } from '../../components/quote/PricingSummary';
import { africanCountries } from '../../lib/african-countries';
import { getApiBaseUrl } from '../../lib/api-base-url';
import { readFreshAuthSession } from '../../lib/auth-session';
import { readScopedLocalStorage, writeScopedLocalStorage } from '../../lib/user-scoped-storage';
import { calculatePCBQuote } from '../../lib/pricing';
import { validateQuoteConfig } from '../../lib/quote-pricing';
import type { PricingBreakdown, QuoteConfig } from '../../lib/quote-types';

const productCards: Array<{
  value: QuoteConfig['productType'];
  title: string;
  description: string;
  visual: 'standard' | 'advanced' | 'flex' | 'assembly' | 'stencil' | 'cnc';
  badge?: string;
}> = [
  {
    value: 'standard_pcb',
    title: 'PCB standard',
    description: 'FR-4 rigide, prototype rapide, petite serie et fichiers prets pour assemblage.',
    visual: 'standard',
  },
  {
    value: 'advanced_pcb',
    title: 'PCB avance / PCBA',
    visual: 'advanced',
    description: 'HDI, impedance, materiaux haute frequence et options de fiabilite.',
  },
  {
    value: 'fpc_rigid_flex',
    title: 'FPC / rigide-flex',
    description: 'Circuits flexibles, rigide-flex et electronique legere.',
    visual: 'flex',
    badge: 'NOUVEAU',
  },
  {
    value: 'pcb_assembly',
    title: 'Assemblage',
    description: 'Assemblage PCB avec coordination BOM et CPL.',
    visual: 'assembly',
  },
  {
    value: 'smt_stencil',
    title: 'Pochoir CMS',
    description: 'Options de pochoir pour production CMS.',
    visual: 'stencil',
  },
  {
    value: 'cnc_3d',
    title: 'CNC | 3D',
    description: 'Demande de fabrication avancee.',
    visual: 'cnc',
  },
];

const productVisualImages: Partial<Record<(typeof productCards)[number]['visual'], string>> = {
  standard: '/images/quote-product-standard-pcb.png',
  flex: '/images/quote-product-fpc-rigid-flex.png',
  advanced: '/images/quote-product-advanced-pcba.png',
  assembly: '/images/quote-product-assembly.png',
  stencil: '/images/quote-product-smd-stencil.png',
};

const productDefaults: Record<QuoteConfig['productType'], Partial<QuoteConfig>> = {
  standard_pcb: {
    baseMaterial: 'FR4',
    layers: 2,
    assemblyRequired: false,
    stencilRequired: false,
    impedanceControl: false,
    blindBuriedVias: false,
    viaInPad: false,
  },
  advanced_pcb: {
    baseMaterial: 'Rogers',
    layers: 4,
    assemblyRequired: false,
    stencilRequired: false,
    impedanceControl: true,
    surfaceFinish: 'ENIG',
  },
  fpc_rigid_flex: {
    baseMaterial: 'Flex',
    layers: 2,
    assemblyRequired: false,
    stencilRequired: false,
    coverlayThickness: '25um',
    stiffenerType: 'PI',
    cuttingMethod: 'Laser',
  },
  pcb_assembly: {
    baseMaterial: 'FR4',
    layers: 2,
    assemblyRequired: true,
    stencilRequired: true,
    assemblySide: 'top',
    componentSourcing: 'partner_sourced',
    confirmPartsPlacement: false,
  },
  smt_stencil: {
    baseMaterial: 'FR4',
    layers: 2,
    assemblyRequired: false,
    stencilRequired: true,
    stencilType: 'SMT',
    stencilSize: '280x380mm',
    stencilThickness: '0.12mm',
    stencilFrame: true,
  },
  cnc_3d: {
    baseMaterial: 'Aluminum',
    layers: 2,
    assemblyRequired: false,
    stencilRequired: false,
    cuttingMethod: 'CNC',
    surfaceFinish: 'HASL lead-free',
  },
};

const initialConfig: QuoteConfig = {
  productType: 'standard_pcb',
  baseMaterial: 'FR4',
  layers: 2,
  length: 80,
  width: 60,
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

type EditableOrder = {
  id: string;
  orderNumber: string;
  destinationCountryIso2: string;
  quoteSnapshot?: {
    productType: QuoteConfig['productType'];
    gerberFileId: string;
    layers: number;
    lengthMm: number;
    widthMm: number;
    quantity: number;
    shippingMode: QuoteConfig['shippingMode'];
    configSnapshot?: Record<string, unknown> | null;
  };
};

type UploadResponse = {
  uploadId: string;
  uploadUrl?: string;
  analysis?: {
    widthMm?: number;
    heightMm?: number;
    detectedLayers?: number;
    holesCount: number;
    hasSlots: boolean;
    boardAreaCm2?: number;
    complexity: 'low' | 'medium' | 'high' | 'unknown';
    parserConfidence: number;
    warnings: string[];
  };
};

type PresignUploadResponse = {
  uploadId: string;
  uploadUrl: string;
  expiresAt: string;
  status: 'pending_scan' | 'uploaded';
};

type ApiPricingPreview = {
  partnerManufacturingCost: number;
  partnerHandlingCost: number;
  ChinaToFranceLogistics: number;
  FranceProcessingFee: number;
  FranceToAfricaDelivery: number;
  customsRiskBuffer: number;
  paymentProcessingFee: number;
  KendronicsServiceFee: number;
  totalBeforeTax: number;
  taxesIfApplicable: number;
  finalTotal : number;
  supplier?: string;
  supplierEstimatedPrice?: number;
  pcbClientPrice?: number;
  smartBufferMultiplier?: number;
  smartBufferRiskScore?: number;
  smartBufferConfidence?: 'low' | 'medium' | 'high';
  smartBufferBucketKey?: string;
  supplierLeadTimeDays?: number;
  productionBuildDays?: number;
  buildOptions?: PricingBreakdown['buildOptions'];
};

type PricingPreviewState = {
  status: 'local' | 'loading' | 'direct' | 'error';
  message: string;
};

type QuotePanelId = 'base' | 'specs' | 'highSpec' | 'advanced';
type MobileSheetId =
  | 'baseMaterial'
  | 'layers'
  | 'quantity'
  | 'usage'
  | 'deliveryFormat'
  | 'thickness'
  | 'solderMask'
  | 'surfaceFinish'
  | 'viaCovering'
  | 'copper'
  | 'marking'
  | 'testing'
  | 'special'
  | 'flex'
  | 'destination';

const apiBaseUrl = getApiBaseUrl();
const quoteWorkflowImage = '/images/quote-workflow.png';
const customerOrdersStorageKey = 'kendronics.customer.orders';

function readNumberParam(params: URLSearchParams, key: string, fallback: number): number {
  const value = Number(params.get(key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readProductTypeParam(params: URLSearchParams): QuoteConfig['productType'] {
  const value = params.get('productType');
  return productCards.some((product) => product.value === value) ? (value as QuoteConfig['productType']) : initialConfig.productType;
}

function getInitialConfigFromUrl(): QuoteConfig {
  if (typeof window === 'undefined') return initialConfig;

  const params = new URLSearchParams(window.location.search);
  if (!params.has('productType') && !params.has('layers') && !params.has('length') && !params.has('width') && !params.has('quantity') && !params.has('thickness')) {
    return initialConfig;
  }

  const productType = readProductTypeParam(params);

  return {
    ...initialConfig,
    ...productDefaults[productType],
    productType,
    layers: readNumberParam(params, 'layers', initialConfig.layers),
    length: readNumberParam(params, 'length', initialConfig.length),
    width: readNumberParam(params, 'width', initialConfig.width),
    quantity: readNumberParam(params, 'quantity', initialConfig.quantity),
    thickness: params.get('thickness') || initialConfig.thickness,
  };
}

export default function QuotePage() {
  const initialQuoteConfig = useMemo(() => getInitialConfigFromUrl(), []);
  const [config, setConfig] = useState<QuoteConfig>(() => initialQuoteConfig);
  const [saved, setEnregistre] = useState(false);
  const [gerberUpload, setGerberUpload] = useState<UploadState>({ status: 'idle' });
  const [quoteSave, setQuoteSave] = useState<QuoteSaveState>({ status: 'idle' });
  const [openPanel, setOpenPanel] = useState<QuotePanelId>('base');
  const [mobileSheet, setMobileSheet] = useState<MobileSheetId | null>(null);
  const [selectedProductTitle, setSelectedProductTitle] = useState(productCards.find((product) => product.value === initialQuoteConfig.productType)?.title ?? productCards[0].title);
  const [apiPricing, setApiPricing] = useState<PricingBreakdown | null>(null);
  const [pricingPreview, setPricingPreview] = useState<PricingPreviewState>({
    status: 'loading',
    message: 'Calcul...',
  });
  const [editOrder, setEditOrder] = useState<EditableOrder | null>(null);

  const selectedCountry = useMemo(
    () => africanCountries.find((country) => country.iso2 === config.destinationCountry) ?? africanCountries[0],
    [config.destinationCountry],
  );
  const localPricing = useMemo(() => calculatePCBQuote(config), [config]);
  const pricing = apiPricing ?? localPricing;
  const mobilePcbPrice = pricing.pcbClientPrice ?? pricing.supplierEstimatedPrice ?? pricing.partnerManufacturingCost;
  const errors = useMemo(() => validateQuoteConfig(config), [config]);
  const pricingSummarySaveState = quoteSave.status === 'saved' && gerberUpload.status === 'idle' ? 'idle' : quoteSave.status;

  function resetQuoteFormForNewOrder() {
    const nextConfig = initialConfig;
    setConfig(nextConfig);
    setGerberUpload({ status: 'idle' });
    setApiPricing(null);
    setEditOrder(null);
    setOpenPanel('base');
    setMobileSheet(null);
    setSelectedProductTitle(productCards.find((product) => product.value === nextConfig.productType)?.title ?? productCards[0].title);
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadEditableOrder() {
      const orderId = new URLSearchParams(window.location.search).get('orderId');
      if (!orderId) return;

      try {
        const session = await readFreshAuthSession();
        if (!session) throw new Error('Session expiree.');

        const response = await fetch(`${apiBaseUrl}/api/orders/${orderId}`, {
          headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
        });
        if (!response.ok) throw new Error('Commande introuvable.');

        const order = (await response.json()) as EditableOrder;
        if (cancelled || !order.quoteSnapshot) return;

        const nextConfig = configFromOrder(order);
        setEditOrder(order);
        setConfig(nextConfig);
        setSelectedProductTitle(productCards.find((product) => product.value === nextConfig.productType)?.title ?? productCards[0].title);
        setGerberUpload({
          status: 'uploaded',
          uploadId: order.quoteSnapshot.gerberFileId,
          message: `Commande ${order.orderNumber} chargee pour modification.`,
        });
        setQuoteSave({ status: 'idle', message: `Modification de la commande ${order.orderNumber}` });
      } catch (error) {
        if (!cancelled) {
          setQuoteSave({
            status: 'error',
            message: error instanceof Error ? error.message : 'Impossible de charger la commande a modifier.',
          });
        }
      }
    }

    void loadEditableOrder();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      try {
        const session = await readFreshAuthSession();
        if (cancelled) return;

        setPricingPreview({
          status: 'loading',
          message: 'Calcul...',
        });

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (session?.accessToken) {
          headers.Authorization = `Bearer ${session.accessToken}`;
        }

        const response = await fetch(`${apiBaseUrl}/api/pricing/preview`, {
          method: 'POST',
          headers,
          body: JSON.stringify(buildPricingPayload(config, gerberUpload.uploadId)),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('API pricing preview failed.');
        }

        const data = (await response.json()) as ApiPricingPreview;
        if (!cancelled) {
          const normalizedPricing = normalizeApiPricingPreview(data, localPricing);
          setApiPricing(normalizedPricing);
          setPricingPreview({
            status: normalizedPricing.pricingSource === 'supplier_api' ? 'direct' : 'local',
            message:
              normalizedPricing.pricingSource === 'supplier_api'
                ? 'Prix de fabrication applique. Aucune production n est lancee a cette etape.'
                : "Prix estime affiche: le calcul final sera confirme avant le lancement.",
          });
        }
      } catch (error) {
        if (!cancelled && !(error instanceof DOMException && error.name === 'AbortError')) {
          setApiPricing(null);
          setPricingPreview({
            status: 'error',
            message: 'Apercu indisponible. Le prix estime reste visible, puis le devis sera recalcule avant commande.',
          });
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [config, gerberUpload.uploadId, localPricing]);

  function update<K extends keyof QuoteConfig>(key: K, value: QuoteConfig[K]) {
    setEnregistre(false);
    setQuoteSave({ status: 'idle' });
    setConfig((current) => ({
      ...current,
      [key]: value,
      ...(key === 'buildTimeOptionId' || key === 'buildTimeDays' || key === 'buildTimeLabel'
        ? {}
        : { buildTimeOptionId: undefined, buildTimeDays: undefined, buildTimeLabel: undefined }),
    }));
  }

  function selectProduct(product: (typeof productCards)[number]) {
    setEnregistre(false);
    setQuoteSave({ status: 'idle' });
    setSelectedProductTitle(product.title);
    setOpenPanel(product.value === 'fpc_rigid_flex' || product.value === 'cnc_3d' ? 'advanced' : product.value === 'pcb_assembly' || product.value === 'smt_stencil' ? 'highSpec' : 'base');
    setConfig((current) => ({
      ...current,
      ...productDefaults[product.value],
      productType: product.value,
      liveShippingRateId: undefined,
      liveShippingCarrier: undefined,
      liveShippingService: undefined,
      liveShippingAmount: undefined,
      liveShippingCurrency: undefined,
      liveShippingTransitTime: undefined,
      buildTimeOptionId: undefined,
      buildTimeDays: undefined,
      buildTimeLabel: undefined,
    }));
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
    setEnregistre(false);
    setConfig((current) => ({
      ...clearLiveShippingFields(current),
      destinationCountry: value,
    }));
  }

  function updateShippingMode(value: QuoteConfig['shippingMode']) {
    setEnregistre(false);
    setConfig((current) => ({
      ...clearLiveShippingFields(current),
      shippingMode: value,
    }));
  }

  function selectLiveShippingRate(rate: ShippingRateSelection) {
    setEnregistre(false);
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

  function selectBuildTimeOption(option: NonNullable<PricingBreakdown['buildOptions']>[number]) {
    setEnregistre(false);
    setConfig((current) => ({
      ...current,
      productionSpeed: option.speed,
      buildTimeOptionId: option.id,
      buildTimeDays: option.buildDays,
      buildTimeLabel: option.label,
    }));
  }

  async function uploadGerber(file: File) {
    setEnregistre(false);
    setQuoteSave({ status: 'idle' });
    setGerberUpload({ status: 'uploading', message: 'Televersement du ZIP Gerber en cours...' });

    try {
      const session = await readFreshAuthSession();
      if (!session) {
        throw new Error('Connectez-vous avant de televerser un fichier Gerber.');
      }

      const uploadedFile = await uploadGerberDirectToStorage(file, session.accessToken);
      applyGerberAnalysis(file.name, uploadedFile.analysis);
      setGerberUpload({
        status: 'uploaded',
        uploadId: uploadedFile.uploadId,
        message: uploadedFile.analysis
          ? `Gerber analyse: ${uploadedFile.analysis.detectedLayers ?? config.layers} couches, ${formatDimension(uploadedFile.analysis.widthMm)} x ${formatDimension(uploadedFile.analysis.heightMm)} mm.`
          : 'ZIP Gerber televerse. Analyse indisponible.',
      });
    } catch (error) {
      setGerberUpload({
        status: 'error',
        message: error instanceof Error ? error.message : 'Televersement impossible pour le moment.',
      });
    }
  }

  function applyGerberAnalysis(fileName: string, analysis: UploadResponse['analysis']) {
    setEnregistre(false);
    setQuoteSave({ status: 'idle' });
    setConfig((current) => {
      if (!analysis) return { ...current, gerberFileName: fileName };

      return {
        ...current,
        gerberFileName: fileName,
        layers: analysis.detectedLayers ?? current.layers,
        length: analysis.widthMm && analysis.heightMm ? Math.max(analysis.widthMm, analysis.heightMm) : current.length,
        width: analysis.widthMm && analysis.heightMm ? Math.min(analysis.widthMm, analysis.heightMm) : current.width,
        unit: 'mm',
        parserConfidence: analysis.parserConfidence,
        gerberComplexity: analysis.complexity,
        holesCount: analysis.holesCount,
        hasSlots: analysis.hasSlots,
        detectedLayers: analysis.detectedLayers,
        detectedWidthMm: analysis.widthMm,
        detectedHeightMm: analysis.heightMm,
        boardAreaCm2: analysis.boardAreaCm2,
      };
    });
  }

  async function uploadGerberDirectToStorage(file: File, accessToken: string): Promise<UploadResponse> {
    let presignResponse: Response;
    try {
      presignResponse = await fetch(`${apiBaseUrl}/api/uploads/presign`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          mimeType: 'application/zip',
          fileSizeBytes: file.size,
        }),
      });
    } catch {
      throw new Error("Impossible de contacter l'API pour preparer l'upload.");
    }

    if (!presignResponse.ok) {
      const error = await presignResponse.json().catch(() => null);
      throw new Error(Array.isArray(error?.message) ? error.message.join(' ') : error?.message ?? 'Televersement impossible pour le moment.');
    }

    const presignedUpload = (await presignResponse.json()) as PresignUploadResponse;

    let storageResponse: Response;
    try {
      storageResponse = await fetch(presignedUpload.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/zip',
        },
        body: file,
      });
    } catch {
      throw new Error("Impossible d'envoyer le fichier vers le stockage securise.");
    }

    if (!storageResponse.ok) {
      throw new Error(`Le stockage securise a refuse le fichier (${storageResponse.status}).`);
    }

    let confirmResponse: Response;
    try {
      confirmResponse = await fetch(`${apiBaseUrl}/api/uploads/confirm`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uploadId: presignedUpload.uploadId }),
      });
    } catch {
      throw new Error("Impossible de lancer l'analyse du fichier Gerber.");
    }

    if (!confirmResponse.ok) {
      const error = await confirmResponse.json().catch(() => null);
      throw new Error(Array.isArray(error?.message) ? error.message.join(' ') : error?.message ?? 'Analyse Gerber impossible pour le moment.');
    }

    return confirmResponse.json() as Promise<UploadResponse>;
  }

  async function saveQuote() {
    setEnregistre(false);
    setQuoteSave({ status: 'saving', message: 'Sauvegarde du devis...' });

    try {
      const session = await readFreshAuthSession();
      if (!session) {
        window.dispatchEvent(new CustomEvent('kendronics:open-auth-required', { detail: { panel: 'login', step: 'choice' } }));
        throw new Error('Connectez-vous ou creez un compte pour ajouter ce devis au panier.');
      }

      if (errors.length > 0) {
        throw new Error(errors[0]);
      }

      if (!gerberUpload.uploadId) {
        throw new Error('Televersez un fichier Gerber ZIP avant de sauvegarder le devis.');
      }

      if (editOrder) {
        const orderResponse = await fetch(`${apiBaseUrl}/api/orders/${editOrder.id}/quote`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildQuotePayload(config, gerberUpload.uploadId)),
        });

        if (!orderResponse.ok) {
          const error = await orderResponse.json().catch(() => null);
          throw new Error(Array.isArray(error?.message) ? error.message.join(' ') : error?.message ?? "La commande n'a pas pu etre modifiee.");
        }

        const order = (await orderResponse.json()) as EditableOrder;
        rememberCustomerOrder(order.id);
        setEnregistre(true);
        resetQuoteFormForNewOrder();
        setQuoteSave({
          status: 'saved',
          orderId: order.id,
          message: `Commande ${order.orderNumber} modifiee. Le nouveau devis est rattache a la meme commande et suivra le controle technique avant capture.`,
        });
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/pricing/quote`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildQuotePayload(config, gerberUpload.uploadId)),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(Array.isArray(error?.message) ? error.message.join(' ') : error?.message ?? 'Impossible de sauvegarder le devis.');
      }

      const quote = (await response.json()) as { id: string; breakdown?: { supplier?: string } };
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
      setEnregistre(true);
      resetQuoteFormForNewOrder();
      setQuoteSave({
        status: 'saved',
        quoteId: quote.id,
        orderId: order.id,
        message:
          quote.breakdown?.supplier && quote.breakdown.supplier !== 'local_calibrated_supplier_estimate'
            ? `Commande soumise: ${order.orderNumber}. Le montant sera d'abord autorise, puis capture uniquement si les fichiers sont acceptes.`
            : `Commande soumise: ${order.orderNumber}. Le montant sera d'abord autorise, puis capture uniquement si les fichiers sont acceptes.`,
      });
    } catch (error) {
      setQuoteSave({
        status: 'error',
        message: error instanceof Error ? error.message : 'Impossible de sauvegarder le devis.',
      });
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#1f2933]">
      <Navbar />
      <section className="border-b border-slate-200 bg-[#eef6fb] pt-[4.35rem] sm:pt-[4.85rem]">
        <div className="mx-auto max-w-[1280px] px-3 pb-2 sm:px-6 sm:pb-3 lg:px-8">
          <div className="mb-1 grid gap-0 sm:mb-3 sm:gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(26rem,48rem)_minmax(0,1fr)] lg:items-center">
            <div>
              <div className="text-xs font-medium text-slate-500">
                Livraison vers : <span className="text-[#0f8f6b]">{selectedCountry.name}</span> / {selectedCountry.logisticsZone}
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">Devis PCB en ligne</h1>
            </div>
            <div className="-my-1 flex justify-center overflow-hidden sm:my-0">
              <img
                src={quoteWorkflowImage}
                alt="Demande en ligne, telechargement du fichier PCB, verification, paiement, suivi fabrication, livraison et reception confirmee."
                className="h-auto w-full max-w-[48rem] object-contain mix-blend-multiply"
              />
            </div>
            <a href="/how-it-works" className="hidden text-xs font-medium text-[#0f8f6b] hover:text-[#096b51] sm:inline sm:text-sm lg:justify-self-end">
              Instructions de commande &gt;
            </a>
          </div>
          <div className="quote-product-strip overflow-x-auto">
            <div className="grid min-w-[980px] grid-cols-6 gap-2">
            {productCards.map((product) => {
              const isSelected = config.productType === product.value;

              return (
                <button
                  key={`${product.title}-${product.value}`}
                  type="button"
                  onClick={() => selectProduct(product)}
                  className={`relative flex h-16 items-center gap-2 rounded-sm border px-2 text-left transition sm:gap-3 sm:px-3 ${
                    isSelected
                      ? 'border-[#0f8f6b] bg-[#0f8f6b]'
                      : 'border-slate-200 bg-white hover:border-[#0f8f6b]/55'
                  }`}
                >
                  {product.badge ? <span className="absolute right-0 top-0 bg-[#00a63e] px-1 text-[10px] font-semibold text-white">{product.badge}</span> : null}
                  <ProductVisual kind={product.visual} />
                  <span className="min-w-0 flex-1">
                    <span className={`line-clamp-2 block overflow-hidden break-words text-[11px] font-semibold leading-3.5 sm:text-sm sm:leading-4 ${isSelected ? 'text-white' : 'text-slate-950'}`}>{product.title}</span>
                  </span>
                </button>
              );
            })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1280px] gap-3 px-3 py-3 pb-40 sm:gap-5 sm:px-6 sm:py-5 sm:pb-5 lg:grid-cols-[minmax(0,1fr)_330px] lg:px-8">
        <div className="space-y-2 sm:space-y-4">
          <Panel
            title="Devis PCB express"
            description="Une seule zone prend en charge Gerber, BOM et CPL."
            isOpen
            onToggle={() => undefined}
            showToggle={false}
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
            title="Selection des specifications PCB"
            description="Type de carte, dimensions, couches, materiau et options de production."
            isOpen
            onToggle={() => undefined}
            showToggle={false}
          >
            <CardOptions
              value={config.baseMaterial}
              onChange={(value) => update('baseMaterial', value as QuoteConfig['baseMaterial'])}
              options={[
                ['FR4', 'Jusqu a 20 couches, impedance controlee, cout contenu.'],
                ['Flex', 'Film polymere flexible fin, poids reduit.'],
                ['Aluminium', 'Meilleure conductivite thermique pour LED et puissance.'],
                ['Copper Core', 'Forte dissipation thermique pour designs haute puissance.'],
                ['Rogers', 'Dielectrique haute frequence et faible perte.'],
                ['PTFE Teflon', 'Applications haute frequence et haute temperature.'],
              ]}
            />
            <PanelGrid>
              <MobileSheetRow label="Couches" help="Les nombres impairs sont souvent ajustes au nombre pair superieur par les fabricants." summary={`${config.layers} couches`} sheetId="layers" openSheet={mobileSheet} onOpenSheet={setMobileSheet} estimatedPcbPrice={mobilePcbPrice}>
                <Pills value={config.layers} onChange={(value) => update('layers', Number(value))} options={[1, 2, 4, 6, 8, 10, 12, 14, 16]} />
              </MobileSheetRow>
              <QuoteRow label="Dimensions" help="Dimensions du PCB seul ou du panneau televerse." className="border-b-0 sm:border-b" mobileWide>
                <div className="quote-field-surface grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4.25rem] items-end gap-1.5 sm:grid-cols-[1fr_1fr_82px] sm:gap-3">
                  <NumberBox label="Longueur" value={config.length} onChange={(value) => update('length', value)} />
                  <NumberBox label="Largeur" value={config.width} onChange={(value) => update('width', value)} />
                  <SelectBox value={config.unit} onChange={(value) => update('unit', value as QuoteConfig['unit'])} options={['mm', 'inch']} />
                </div>
              </QuoteRow>
              <MobileSheetRow label="Quantite PCB" help="Choisissez une quantite courante ou entrez une valeur personnalisee." summary={`${config.quantity} pcs`} sheetId="quantity" openSheet={mobileSheet} onOpenSheet={setMobileSheet} estimatedPcbPrice={mobilePcbPrice} mobileWide>
                <div className="space-y-2 sm:space-y-3">
                  <Pills value={config.quantity} onChange={(value) => update('quantity', Number(value))} options={quantityOptions} />
                  <NumberBox label="Quantite personnalisee" value={config.quantity} min={1} onChange={(value) => update('quantity', value)} />
                </div>
              </MobileSheetRow>
              <MobileSheetRow label="Type d'usage" help="Les exigences medicales et aerospatiales ajoutent des couts de validation." summary={String(config.usageType).replaceAll('_', ' ')} sheetId="usage" openSheet={mobileSheet} onOpenSheet={setMobileSheet} estimatedPcbPrice={mobilePcbPrice}>
                <Pills
                  value={config.usageType}
                  onChange={(value) => update('usageType', value as QuoteConfig['usageType'])}
                  options={[
                    ['consumer_industrial', 'Electronique industrielle / grand public'],
                    ['aerospace', 'Aerospatial'],
                    ['medical', 'Medical'],
                  ]}
                />
              </MobileSheetRow>
            </PanelGrid>
          </Panel>

          <Panel
            title="Specifications PCB"
            description="Epaisseur, couleur, finition, cuivre et recouvrement des vias."
            isOpen
            onToggle={() => undefined}
            showToggle={false}
          >
            <PanelGrid>
              <QuoteRow label="Designs differents" help="Nombre de designs uniques separes par V-cut, mouse bites ou fraisage.">
                <Pills value={config.differentDesigns} onChange={(value) => update('differentDesigns', Number(value))} options={[1, 2, 3, 4]} />
              </QuoteRow>
              <MobileSheetRow label="Format de livraison" help="Carte seule, panneau client ou panneau cree par le service de fabrication." summary={String(config.deliveryFormat).replaceAll('_', ' ')} sheetId="deliveryFormat" openSheet={mobileSheet} onOpenSheet={setMobileSheet} estimatedPcbPrice={mobilePcbPrice}>
                <Pills
                  value={config.deliveryFormat}
                  onChange={(value) => update('deliveryFormat', value as QuoteConfig['deliveryFormat'])}
                  options={[
                    ['single_pcb', 'PCB seul'],
                    ['customer_panel', 'Panneau client'],
                    ['panel_by_partner', 'Panneau fabrication'],
                  ]}
                />
              </MobileSheetRow>
              <MobileSheetRow label="Epaisseur PCB" help="Epaisseur finale de la carte. Les cartes fines ou epaisses influencent le prix." summary={config.thickness} sheetId="thickness" openSheet={mobileSheet} onOpenSheet={setMobileSheet} estimatedPcbPrice={mobilePcbPrice}>
                <Pills value={config.thickness} onChange={(value) => update('thickness', String(value))} options={['0.8mm', '1.0mm', '1.2mm', '1.6mm', '2.0mm']} />
              </MobileSheetRow>
              <MobileSheetRow label="Couleur PCB" help="Le vert est generalement la couleur de masque la plus rapide et economique." summary={config.solderMaskColor} sheetId="solderMask" openSheet={mobileSheet} onOpenSheet={setMobileSheet} estimatedPcbPrice={mobilePcbPrice}>
                <ColorPills value={config.solderMaskColor} onChange={(value) => update('solderMaskColor', value)} />
              </MobileSheetRow>
              <QuoteRow label="Serigraphie" help="References et libelles imprimes sur la carte." className="quote-mobile-solid-white">
                <div className="quote-field-surface">
                  <Pills value={config.silkscreenColor} onChange={(value) => update('silkscreenColor', String(value))} options={['White', 'Black', 'Yellow']} />
                </div>
              </QuoteRow>
              <MobileSheetRow label="Finition de surface" help="HASL est economique ; ENIG apporte planeite, duree de stockage et tolerances plus serrees." summary={config.surfaceFinish} sheetId="surfaceFinish" openSheet={mobileSheet} onOpenSheet={setMobileSheet} estimatedPcbPrice={mobilePcbPrice}>
                <Pills value={config.surfaceFinish} onChange={(value) => update('surfaceFinish', String(value))} options={['HASL lead-free', 'ENIG', 'OSP', 'Immersion silver']} />
              </MobileSheetRow>
              <MobileSheetRow label="Recouvrement des vias" help="Le recouvrement des vias influence la fabrication et le cout." summary={config.viaCovering} sheetId="viaCovering" openSheet={mobileSheet} onOpenSheet={setMobileSheet} estimatedPcbPrice={mobilePcbPrice}>
                <Pills value={config.viaCovering} onChange={(value) => update('viaCovering', String(value))} options={['Tented', 'Plugged', 'Epoxy filled']} />
              </MobileSheetRow>
              <MobileSheetRow label="Cuivre externe" help="Epaisseur de cuivre sur les couches externes." summary={`${config.outerCopperWeight} / ${config.innerCopperWeight}`} sheetId="copper" openSheet={mobileSheet} onOpenSheet={setMobileSheet} estimatedPcbPrice={mobilePcbPrice}>
                <Pills value={config.outerCopperWeight} onChange={(value) => update('outerCopperWeight', String(value))} options={['1 oz', '2 oz', '3 oz']} />
              </MobileSheetRow>
              <QuoteRow label="Cuivre interne" help="Epaisseur de cuivre sur les couches internes des cartes multicouches." className="quote-mobile-solid-white quote-mobile-full-bleed">
                <div className="quote-field-surface">
                  <Pills value={config.innerCopperWeight} onChange={(value) => update('innerCopperWeight', String(value))} options={['0.5 oz', '1 oz', '2 oz']} />
                </div>
              </QuoteRow>
            </PanelGrid>
          </Panel>

          <Panel
            title="Options de haute specification"
            description="Precision, tests, marquage et procedes speciaux."
            isOpen={openPanel === 'highSpec'}
            onToggle={() => setOpenPanel('highSpec')}
          >
            <PanelGrid>
              <QuoteRow label="Taille trou via / diametre" help="Les petits vias peuvent augmenter le cout de precision." mobileWide>
                <div className="quote-field-surface grid grid-cols-2 gap-2 sm:gap-3">
                  <SelectBox value={config.minimumViaHole} onChange={(value) => update('minimumViaHole', value)} options={['0.2mm', '0.25mm', '0.3mm', '0.4mm']} />
                  <SelectBox value={config.viaDiameter} onChange={(value) => update('viaDiameter', value)} options={['0.45mm', '0.5mm', '0.6mm', '0.8mm']} />
                </div>
              </QuoteRow>
              <MobileSheetRow label="Marquage PCB" help="Choisissez numero de commande, code-barres, serie ou suppression du marquage." summary={config.orderNumberMarking ? 'Numero de commande' : 'A configurer'} sheetId="marking" openSheet={mobileSheet} onOpenSheet={setMobileSheet} estimatedPcbPrice={mobilePcbPrice} mobileWide>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  <Switch label="Numero de commande" checked={config.orderNumberMarking} onChange={(value) => update('orderNumberMarking', value)} />
                  <Switch label="Position precisee" checked={config.markingLocationSpecified} onChange={(value) => update('markingLocationSpecified', value)} />
                  <Switch label="Supprimer marquage" checked={config.removeMarking} onChange={(value) => update('removeMarking', value)} />
                  <Switch label="Code-barres 2D" checked={config.twoDBarcode} onChange={(value) => update('twoDBarcode', value)} />
                  <Switch label="Numero de serie" checked={config.serialNumber} onChange={(value) => update('serialNumber', value)} />
                </div>
              </MobileSheetRow>
              <MobileSheetRow label="Test electrique" help="Les choix de test influencent qualite et delai." summary={config.flyingProbe ? 'Flying Probe' : 'A configurer'} sheetId="testing" openSheet={mobileSheet} onOpenSheet={setMobileSheet} estimatedPcbPrice={mobilePcbPrice} mobileWide>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  <Switch label="Flying Probe" checked={config.flyingProbe} onChange={(value) => update('flyingProbe', value)} />
                  <Switch label="Test complet" checked={config.fullElectricalTest} onChange={(value) => update('fullElectricalTest', value)} />
                  <Switch label="Test aleatoire" checked={config.randomElectricalTest} onChange={(value) => update('randomElectricalTest', value)} />
                  <Switch label="4-Wire Kelvin" checked={config.fourWireKelvinTest} onChange={(value) => update('fourWireKelvinTest', value)} />
                  <Switch label="AOI" checked={config.aoi} onChange={(value) => update('aoi', value)} />
                </div>
              </MobileSheetRow>
              <MobileSheetRow label="Procedes speciaux" help="Les options avancees sont revues avant production." summary="Options de fabrication" sheetId="special" openSheet={mobileSheet} onOpenSheet={setMobileSheet} estimatedPcbPrice={mobilePcbPrice} mobileWide>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  <Switch label="Impedance controlee" checked={config.impedanceControl} onChange={(value) => update('impedanceControl', value)} />
                  <Switch label="Gold Fingers" checked={config.goldFingers} onChange={(value) => update('goldFingers', value)} />
                  <Switch label="Castellated Holes" checked={config.castellatedHoles} onChange={(value) => update('castellatedHoles', value)} />
                  <Switch label="Placage de bord" checked={config.edgePlating} onChange={(value) => update('edgePlating', value)} />
                  <Switch label="Vias borgnes/enterres" checked={config.blindBuriedVias} onChange={(value) => update('blindBuriedVias', value)} />
                  <Switch label="Via-in-pad" checked={config.viaInPad} onChange={(value) => update('viaInPad', value)} />
                  <Switch label="Masque pelable" checked={config.peelableMask} onChange={(value) => update('peelableMask', value)} />
                  <Switch label="Encre carbone" checked={config.carbonInk} onChange={(value) => update('carbonInk', value)} />
                  <Switch label="Fraisage conique" checked={config.countersink} onChange={(value) => update('countersink', value)} />
                  <Switch label="Trous press-fit" checked={config.pressFitHoles} onChange={(value) => update('pressFitHoles', value)} />
                </div>
              </MobileSheetRow>
            </PanelGrid>
          </Panel>

          <Panel
            title="Options avancees"
            description="Flex, fabrication avancee et livraison."
            isOpen={openPanel === 'advanced'}
            onToggle={() => setOpenPanel('advanced')}
          >
            <MobileSheetRow label="Coverlay / renfort" help="Ajoutez les informations de renfort et coverlay pour les circuits flexibles." summary={config.coverlayThickness || config.stiffenerType || 'Optionnel'} sheetId="flex" openSheet={mobileSheet} onOpenSheet={setMobileSheet} estimatedPcbPrice={mobilePcbPrice}>
              <div className="grid gap-3 md:grid-cols-3">
                <SelectBox value={config.coverlayThickness} onChange={(value) => update('coverlayThickness', value)} options={['', '12.5um', '25um', '50um']} />
                <SelectBox value={config.stiffenerType} onChange={(value) => update('stiffenerType', value)} options={['', 'FR4', 'PI', 'Steel']} />
                <SelectBox value={config.stiffenerThickness} onChange={(value) => update('stiffenerThickness', value)} options={['', '0.1mm', '0.2mm', '0.3mm']} />
                <Switch label="Film blindage EMI" checked={config.emiShieldingFilm} onChange={(value) => update('emiShieldingFilm', value)} />
                <SelectBox value={config.cuttingMethod} onChange={(value) => update('cuttingMethod', value)} options={['CNC', 'Laser']} />
                <SelectBox value={config.adhesiveType} onChange={(value) => update('adhesiveType', value)} options={['', 'Acrylic', 'Epoxy']} />
              </div>
            </MobileSheetRow>
            <MobileSheetRow label="Destination" help="Le pays influence les frais de livraison Afrique et le delai estime." summary={`${selectedCountry.name} / ${config.shippingMode}`} sheetId="destination" openSheet={mobileSheet} onOpenSheet={setMobileSheet} estimatedPcbPrice={mobilePcbPrice}>
              <div className="grid gap-3 md:grid-cols-3">
                <SelectBox
                  value={config.destinationCountry}
                  onChange={updateDestinationCountry}
                  options={africanCountries.map((country) => [country.iso2, country.name])}
                />
                <SelectBox value={selectedCountry.logisticsZone} onChange={() => undefined} options={[selectedCountry.logisticsZone]} />
                <SelectBox value={config.shippingMode} onChange={(value) => update('shippingMode', value as QuoteConfig['shippingMode'])} options={['economy', 'standard', 'express']} />
                <Switch label="Assurance" checked={config.insuranceRequired} onChange={(value) => update('insuranceRequired', value)} />
              </div>
            </MobileSheetRow>
          </Panel>

          {saved ? (
            <div className="rounded-sm border border-[#b9ebda] bg-[#eefbf6] p-3 text-sm font-medium text-[#116b52] sm:p-4">
              Commande enregistree. Le montant est autorise au paiement, puis capture uniquement apres acceptation technique des fichiers.
            </div>
          ) : null}
          {quoteSave.status === 'error' ? (
            <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 sm:p-4">
              {quoteSave.message}
            </div>
          ) : null}
          {quoteSave.status === 'saved' && quoteSave.message ? (
            <div className="rounded-sm border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700 sm:p-4">
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
            saveState={pricingSummarySaveState}
            productionSpeed={config.productionSpeed}
            onProductionSpeedChange={(value) => update('productionSpeed', value)}
            selectedBuildTimeOptionId={config.buildTimeOptionId}
            onBuildTimeOptionSelect={selectBuildTimeOption}
            quantity={config.quantity}
            countries={africanCountries}
            destinationCountry={config.destinationCountry}
            onDestinationCountryChange={updateDestinationCountry}
            shippingMode={config.shippingMode}
            onShippingModeChange={updateShippingMode}
            selectedLiveShippingRateId={config.liveShippingRateId}
            onLiveShippingRateSelect={selectLiveShippingRate}
            pricingPreview={pricingPreview}
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

function buildPricingPayload(config: QuoteConfig, gerberFileId?: string) {
  return {
    productType: config.productType,
    gerberFileId,
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
      gerberFileId,
      gerberFileName: config.gerberFileName,
      bomFileName: config.bomFileName,
      cplFileName: config.cplFileName,
    },
  };
}

function buildQuotePayload(config: QuoteConfig, gerberFileId: string) {
  return {
    ...buildPricingPayload(config, gerberFileId),
    gerberFileId,
  };
}

function configFromOrder(order: EditableOrder): QuoteConfig {
  const quote = order.quoteSnapshot;
  if (!quote) return initialConfig;
  const snapshot = quote.configSnapshot ?? {};
  const productType = productCards.some((product) => product.value === quote.productType) ? quote.productType : initialConfig.productType;

  return {
    ...initialConfig,
    ...productDefaults[productType],
    ...snapshot,
    productType,
    layers: quote.layers,
    length: quote.lengthMm,
    width: quote.widthMm,
    unit: 'mm',
    quantity: quote.quantity,
    destinationCountry: order.destinationCountryIso2 || stringSnapshot(snapshot.destinationCountry) || initialConfig.destinationCountry,
    shippingMode: quote.shippingMode,
    gerberFileId: quote.gerberFileId,
    gerberFileName: stringSnapshot(snapshot.gerberFileName) || stringSnapshot(snapshot.gerberFileId) || 'Fichier Gerber rattache',
  } as QuoteConfig;
}

function stringSnapshot(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function normalizeApiPricingPreview(data: ApiPricingPreview, fallback: PricingBreakdown): PricingBreakdown {
  const supplierEstimatedPrice = data.supplierEstimatedPrice ?? data.partnerManufacturingCost;
  const pcbClientPrice = data.pcbClientPrice ?? data.totalBeforeTax - data.FranceToAfricaDelivery;
  const pricingSource = data.supplier && data.supplier !== 'local_calibrated_supplier_estimate' ? 'supplier_api' : 'local_calibrated';

  return {
    partnerManufacturingCost: roundCurrency(supplierEstimatedPrice),
    partnerHandlingCost: roundCurrency(data.partnerHandlingCost ?? 0),
    chinaToFranceLogistics: roundCurrency(data.ChinaToFranceLogistics ?? 0),
    franceProcessingFee: roundCurrency(data.FranceProcessingFee ?? 0),
    franceToAfricaDelivery: roundCurrency(data.FranceToAfricaDelivery),
    paymentProcessingFee: roundCurrency(data.paymentProcessingFee ?? 0),
    kendronicsServiceFee: roundCurrency(data.KendronicsServiceFee),
    supplierEstimatedPrice: roundCurrency(supplierEstimatedPrice),
    pcbClientPrice: roundCurrency(pcbClientPrice),
    smartBufferMultiplier: data.smartBufferMultiplier,
    smartBufferRiskScore: data.smartBufferRiskScore,
    smartBufferConfidence: data.smartBufferConfidence,
    smartBufferBucketKey: data.smartBufferBucketKey,
    viaCoveringFee: fallback.viaCoveringFee,
    surfaceFinishFee: fallback.surfaceFinishFee,
    productionSpeedFee: fallback.productionSpeedFee,
    finalTotal : roundCurrency(data.finalTotal),
    displayTotalBeforeAdjustment: roundCurrency(data.finalTotal),
    deliveryWeightKg: fallback.deliveryWeightKg,
    shippingCarrier: fallback.shippingCarrier,
    estimatedShippingTime: fallback.estimatedShippingTime,
    estimatedLeadTime: data.supplierLeadTimeDays ? `${data.supplierLeadTimeDays} jours de production` : fallback.estimatedLeadTime,
    supplierLeadTimeDays: data.supplierLeadTimeDays ?? fallback.supplierLeadTimeDays,
    productionBuildDays: data.productionBuildDays ?? data.supplierLeadTimeDays ?? fallback.productionBuildDays,
    buildOptions: data.buildOptions ?? fallback.buildOptions,
    pricingSource,
    transparencyNote:
      pricingSource === 'supplier_api'
        ? 'Prix PCB calcule depuis le reseau de fabrication, puis ajustement Kendronics applique.'
        : fallback.transparencyNote,
  };
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatDimension(value: number | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : '?';
}

function rememberCustomerOrder(orderId: string) {
  if (typeof window === 'undefined') return;

  try {
    const current = JSON.parse(readScopedLocalStorage(customerOrdersStorageKey) ?? '[]') as string[];
    const next = [orderId, ...current.filter((id) => id !== orderId)].slice(0, 20);
    writeScopedLocalStorage(customerOrdersStorageKey, JSON.stringify(next));
    window.dispatchEvent(new Event('kendronics:orders-updated'));
  } catch {
    writeScopedLocalStorage(customerOrdersStorageKey, JSON.stringify([orderId]));
    window.dispatchEvent(new Event('kendronics:orders-updated'));
  }
}

function ProductVisual({ kind }: { kind: 'standard' | 'advanced' | 'flex' | 'assembly' | 'stencil' | 'cnc' }) {
  const image = productVisualImages[kind];

  if (image) {
    return (
      <span className="relative flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-slate-300 bg-white">
        <img src={image} alt="" className="h-full w-full object-contain" />
      </span>
    );
  }

  const colors: Record<typeof kind, string> = {
    standard: 'from-[#1fb35d] to-[#0b7f42]',
    advanced: 'from-[#2ca36b] to-[#0e6b45]',
    flex: 'from-[#d79a2b] to-[#a46f0c]',
    assembly: 'from-[#1f2937] to-[#64748b]',
    stencil: 'from-[#dbe4ec] to-[#94a3b8]',
    cnc: 'from-[#c8a47c] to-[#7c5a3a]',
  };

  return (
    <span className={`relative h-11 w-16 shrink-0 overflow-hidden rounded-sm border border-slate-300 bg-gradient-to-br ${colors[kind]}`}>
      <span className="absolute inset-x-2 top-2 h-2 rounded-sm bg-white/35" />
      <span className="absolute bottom-2 left-2 h-2 w-2 rounded-full bg-white/70" />
      <span className="absolute bottom-2 right-3 h-2 w-5 rounded-sm bg-white/45" />
      <span className="absolute left-5 top-5 h-px w-8 rotate-12 bg-white/65" />
    </span>
  );
}

function Panel({
  title,
  description,
  isOpen,
  onToggle,
  showToggle = true,
  children,
}: {
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  showToggle?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="group border-b border-slate-200 bg-white sm:rounded-sm sm:border">
      <button
        type="button"
        className="flex w-full cursor-pointer list-none items-center justify-between gap-3 bg-white px-1 py-3 text-left sm:gap-4 sm:bg-slate-50 sm:px-4 sm:py-3"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span>
          <span className="block text-sm font-medium text-slate-950 sm:text-base">{title}</span>
          <span className="mt-0.5 hidden text-xs leading-5 text-slate-500 sm:block">{description}</span>
        </span>
        {showToggle ? <span className={`text-xl font-semibold text-slate-800 transition ${isOpen ? 'rotate-180' : ''}`}>v</span> : null}
      </button>
      {isOpen ? <div className="quote-panel-body bg-[#ffffff]">{children}</div> : null}
    </section>
  );
}

function PanelGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-0 sm:block sm:p-0">{children}</div>;
}

function QuoteRow({
  label,
  help,
  className = '',
  mobileWide = false,
  children,
}: {
  label: string;
  help: string;
  className?: string;
  mobileWide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`quote-param-row grid gap-2 border-b border-slate-100 bg-white px-1 py-3 sm:rounded-none sm:border-x-0 sm:border-t-0 sm:px-4 sm:last:border-b-0 lg:grid-cols-[190px_1fr] ${className} ${
        mobileWide ? 'col-span-2' : ''
      }`}
    >
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
        <p className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">{help}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function MobileSheetRow({
  label,
  help,
  summary,
  sheetId,
  openSheet,
  onOpenSheet,
  estimatedPcbPrice,
  mobileWide = false,
  children,
}: {
  label: string;
  help: string;
  summary: string;
  sheetId: MobileSheetId;
  openSheet: MobileSheetId | null;
  onOpenSheet: (sheet: MobileSheetId | null) => void;
  estimatedPcbPrice?: number;
  mobileWide?: boolean;
  children: React.ReactNode;
}) {
  const isOpen = openSheet === sheetId;

  return (
    <>
      <div className={`quote-param-row bg-white sm:hidden ${sheetId === 'usage' ? 'border-b border-slate-100' : ''} ${mobileWide ? 'col-span-2' : ''}`}>
        <button type="button" className="flex min-h-14 w-full items-center justify-between gap-3 px-1 py-2.5 text-left" onClick={() => onOpenSheet(sheetId)}>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-900">{label}</span>
            <span className="mt-1 block truncate text-xs font-medium text-[#0f8f6b]">{summary}</span>
          </span>
          <span className="text-lg font-medium text-slate-400">+</span>
        </button>
      </div>
      <div className="hidden sm:block">
        <QuoteRow label={label} help={help} mobileWide={mobileWide}>
          {children}
        </QuoteRow>
      </div>
      {isOpen ? (
        <div className="sheet-backdrop-in fixed inset-0 z-[70] bg-slate-950/35 sm:hidden" role="dialog" aria-modal="true" aria-label={label} onClick={() => onOpenSheet(null)}>
          <div className="sheet-panel-in absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-2xl bg-[#ffffff] p-4" onClick={(event) => event.stopPropagation()}>
            {typeof estimatedPcbPrice === 'number' ? (
              <div className="quote-sheet-total sticky top-0 z-10 -mx-4 -mt-4 mb-3 flex items-center justify-between border-b border-slate-200 bg-[#ffffff] px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Cout PCB</span>
                <span className="text-lg font-semibold text-[#ff7a00]">${estimatedPcbPrice.toFixed(2)}</span>
              </div>
            ) : null}
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-300" />
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-950">{label}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">{help}</p>
              </div>
              <button type="button" className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-lg font-medium text-slate-700" onClick={() => onOpenSheet(null)} aria-label="Fermer">
                x
              </button>
            </div>
            <div>{children}</div>
          </div>
        </div>
      ) : null}
    </>
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
    <div className="bg-[#eaf2fb] px-2 py-3 text-center sm:px-4 sm:py-5">
      <div className="mx-auto grid max-w-2xl gap-2 sm:grid-cols-3">
      <label
        className={`inline-flex cursor-pointer items-center justify-center rounded-sm border px-3 py-2.5 text-sm font-semibold text-white transition sm:px-4 sm:py-3 ${
          gerberUpload.status === 'uploaded' && gerberFileName ? 'border-[#0f8f6b] bg-[#0f8f6b] hover:bg-[#0b7558]' : 'border-[#0877ff] bg-[#0877ff] hover:bg-[#0068e8]'
        } ${gerberUpload.status === 'uploading' ? 'cursor-not-allowed opacity-75' : ''}`}
      >
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
        <span>{gerberUpload.status === 'uploading' ? 'Upload en cours...' : gerberFileName ?? 'Ajouter Gerber'}</span>
      </label>
        <CompactFile label="BOM" fileName={bomFileName} accept=".csv,.xlsx,.xls" onFile={onBom} />
        <CompactFile label="CPL" fileName={cplFileName} accept=".csv,.xlsx,.xls" onFile={onCpl} />
      </div>
      {gerberUpload.message ? (
        <p className={`mt-3 text-xs font-medium ${gerberUpload.status === 'error' ? 'text-red-600' : 'text-[#0f8f6b]'}`}>{gerberUpload.message}</p>
      ) : null}
      <p className="mt-2 text-xs text-slate-500">Gerber ZIP max 50 Mo. BOM et CPL optionnels.</p>
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
    <label className="cursor-pointer rounded-sm border border-dashed border-slate-300 bg-white/70 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#0877ff] sm:px-4 sm:py-3">
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
    <div className="quote-param-row grid grid-cols-2 gap-2 p-2 sm:gap-3 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
      {options.map(([option, description]) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`min-h-14 rounded-sm border p-2.5 text-left transition sm:min-h-28 sm:p-4 ${
            value === option ? 'border-[#0f8f6b] bg-[#eefbf6]' : 'border-slate-200 hover:border-[#0f8f6b]/55'
          }`}
        >
          <span className="block text-sm font-medium text-slate-950">{option}</span>
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
    <div className="flex flex-wrap gap-1 sm:gap-2">
      {options.map((item) => {
        const optionValue = Array.isArray(item) ? item[0] : item;
        const label = Array.isArray(item) ? item[1] : item;
        return (
          <button
            key={String(optionValue)}
            type="button"
            onClick={() => onChange(optionValue)}
            className={`min-h-8 rounded-sm border px-2.5 text-xs font-medium transition sm:min-h-10 sm:px-4 sm:text-sm ${
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
    <div className="flex flex-wrap gap-1 sm:gap-2">
      {colors.map(([label, color]) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(label)}
          className={`flex min-h-8 items-center gap-1.5 rounded-sm border px-2.5 text-xs font-medium transition sm:min-h-11 sm:gap-2 sm:px-4 sm:text-sm ${
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
      <span className="mb-1 block text-[11px] font-medium text-slate-500 sm:text-xs">{label}</span>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-9 w-full rounded-sm border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-950 outline-none transition focus:border-[#0f8f6b] focus:ring-2 focus:ring-[#0f8f6b]/15 sm:h-11 sm:px-3"
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
      className="h-9 w-full rounded-sm border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-950 outline-none transition focus:border-[#0f8f6b] focus:ring-2 focus:ring-[#0f8f6b]/15 sm:h-11 sm:px-3"
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
    <label className={`flex min-h-9 cursor-pointer items-center justify-between gap-2 rounded-sm border px-2.5 text-[11px] font-medium transition sm:min-h-11 sm:gap-3 sm:px-3 sm:text-sm ${
      checked ? 'border-[#0f8f6b] bg-[#eefbf6] text-[#0f6f54]' : 'border-slate-200 bg-white text-slate-700 hover:border-[#0f8f6b]/55'
    }`}>
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#0f8f6b]" />
    </label>
  );
}
