import { africanCountries } from './african-countries';
import type { PricingBreakdown, QuoteConfig } from './quote-types';

export interface SupplierPricingProvider {
  name: string;
  getQuote(config: QuoteConfig): PricingBreakdown | Promise<PricingBreakdown>;
}

type CalibrationAnchor = {
  layers: number;
  maxAreaCm2: number;
  quantity: number;
  priceUsd: number;
};

const PCBWAY_PUBLIC_ANCHORS: CalibrationAnchor[] = [
  { layers: 1, maxAreaCm2: 100, quantity: 10, priceUsd: 5 },
  { layers: 2, maxAreaCm2: 100, quantity: 10, priceUsd: 5 },
  { layers: 4, maxAreaCm2: 100, quantity: 10, priceUsd: 48 },
];

const USD_TO_EUR = 0.92;

const zoneDeliveryFee: Record<string, number> = {
  AFRICA_NORTH: 19,
  AFRICA_WEST: 26,
  AFRICA_CENTRAL: 34,
  AFRICA_EAST: 29,
  AFRICA_SOUTHERN: 32,
  AFRICA_ISLANDS: 38,
};

const zoneDeliveryDays: Record<string, number> = {
  AFRICA_NORTH: 10,
  AFRICA_WEST: 14,
  AFRICA_CENTRAL: 18,
  AFRICA_EAST: 16,
  AFRICA_SOUTHERN: 17,
  AFRICA_ISLANDS: 20,
};

const transparencyNote =
  'Prix calcule par Kendronics a partir des parametres selectionnes. Le prix final peut etre valide apres verification fournisseur.';

export class LocalPricingProvider implements SupplierPricingProvider {
  name = 'local_calibrated';

  getQuote(config: QuoteConfig): PricingBreakdown {
    return calculateLocalCalibratedQuote(config);
  }
}

export class FutureSupplierApiProvider implements SupplierPricingProvider {
  name = 'supplier_api';

  constructor(private readonly endpoint = '/api/supplier-pricing/pcb') {}

  async getQuote(config: QuoteConfig): Promise<PricingBreakdown> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSupplierPayload(config)),
    });

    if (!response.ok) {
      throw new Error('Supplier pricing API unavailable');
    }

    const data = await response.json();
    return {
      ...data,
      pricingSource: 'supplier_api',
      transparencyNote,
    };
  }
}

const localPricingProvider = new LocalPricingProvider();

export function calculatePCBQuote(config: QuoteConfig): PricingBreakdown {
  return localPricingProvider.getQuote(config);
}

export function toSupplierPayload(config: QuoteConfig) {
  const dimensions = normalizeDimensions(config);
  const country = africanCountries.find((item) => item.iso2 === config.destinationCountry) ?? africanCountries[0];

  return {
    country: country.name,
    countryCode: country.iso2,
    shipType: config.shippingMode,
    boardType: boardTypeFor(config.deliveryFormat),
    designInPanel: config.differentDesigns,
    length: dimensions.lengthMm,
    width: dimensions.widthMm,
    qty: config.quantity,
    layers: config.layers,
    material: materialForSupplier(config.baseMaterial),
    thickness: parseFloat(config.thickness) || 1.6,
    solderMask: config.solderMaskColor,
    silkscreen: config.silkscreenColor,
    surfaceFinish: config.surfaceFinish,
    viaCovering: config.viaCovering,
    productionSpeed: config.productionSpeed,
    outerCopperWeight: config.outerCopperWeight,
    innerCopperWeight: config.innerCopperWeight,
    minHoleSize: parseFloat(config.minimumViaHole) || 0.3,
    goldFingers: yesNo(config.goldFingers),
    castellatedHoles: yesNo(config.castellatedHoles),
    edgePlating: yesNo(config.edgePlating),
    blindBuriedVias: yesNo(config.blindBuriedVias),
    viaInPad: yesNo(config.viaInPad),
    carbonMask: yesNo(config.carbonInk),
    countersink: yesNo(config.countersink),
    pressFitHoles: yesNo(config.pressFitHoles),
  };
}

function calculateLocalCalibratedQuote(config: QuoteConfig): PricingBreakdown {
  const country = africanCountries.find((item) => item.iso2 === config.destinationCountry) ?? africanCountries[0];
  const dimensions = normalizeDimensions(config);
  const areaCm2 = Math.max(1, (dimensions.lengthMm * dimensions.widthMm) / 100);
  const normalizedArea = Math.max(areaCm2, 100);
  const quantity = Math.max(1, config.quantity);
  const anchor = getAnchor(config.layers);

  const basePrototypePrice = anchor.priceUsd * USD_TO_EUR;
  const areaMultiplier = Math.pow(normalizedArea / anchor.maxAreaCm2, 0.86);
  const quantityMultiplier = quantity <= anchor.quantity ? 1 : Math.pow(quantity / anchor.quantity, 0.72);
  const layerMultiplier = getLayerMultiplier(config.layers, anchor.layers);
  const materialMultiplier = getMaterialMultiplier(config.baseMaterial);
  const finishMultiplier = getSurfaceFinishMultiplier(config.surfaceFinish);
  const surfaceFinishFee = getSurfaceFinishFee(config.surfaceFinish, areaCm2, quantity);
  const thicknessMultiplier = getThicknessMultiplier(config.thickness);
  const colorMultiplier = getColorMultiplier(config.solderMaskColor);
  const copperMultiplier = getCopperMultiplier(config.outerCopperWeight, config.innerCopperWeight, config.layers);
  const designMultiplier = 1 + Math.max(0, config.differentDesigns - 1) * 0.12;
  const panelMultiplier = config.deliveryFormat === 'single_pcb' ? 1 : config.deliveryFormat === 'customer_panel' ? 1.1 : 1.16;
  const usageMultiplier = config.usageType === 'medical' ? 1.28 : config.usageType === 'aerospace' ? 1.34 : 1;
  const precisionCost = getPrecisionCost(config);
  const viaCoveringFee = getViaCoveringFee(config.viaCovering, areaCm2, quantity);
  const testingCost = getTestingCost(config);
  const assemblyCost = getAssemblyCost(config);
  const stencilCost = getStencilCost(config);

  const partnerManufacturingCost =
    basePrototypePrice *
      areaMultiplier *
      quantityMultiplier *
      layerMultiplier *
      materialMultiplier *
      finishMultiplier *
      thicknessMultiplier *
      colorMultiplier *
      copperMultiplier *
      designMultiplier *
      panelMultiplier *
      usageMultiplier +
    precisionCost +
    viaCoveringFee +
    surfaceFinishFee +
    testingCost +
    assemblyCost +
    stencilCost;

  const partnerHandlingCost = 3.8 + partnerManufacturingCost * 0.055 + (config.removeMarking ? 2.5 : 0) + (config.twoDBarcode ? 1.8 : 0);
  const grossWeightKg = estimateGrossWeightKg(dimensions.lengthMm, dimensions.widthMm, config.thickness, quantity, config.layers);
  const volumeWeightKg = Math.max(grossWeightKg, (dimensions.lengthMm * dimensions.widthMm * 18 * quantity) / 5000000);
  const chinaToFranceLogistics = 8.5 + Math.min(48, volumeWeightKg * 7.2) + (config.shippingMode === 'express' ? 7 : 0);
  const franceProcessingFee = 7.5 + (config.assemblyRequired ? 6 : 0) + (config.productType === 'advanced_pcb' ? 4 : 0);
  const modeMultiplier = config.shippingMode === 'express' ? 1.55 : config.shippingMode === 'economy' ? 0.82 : 1;
  const localFranceToAfricaDelivery = (zoneDeliveryFee[country.logisticsZone] ?? 30) * modeMultiplier + volumeWeightKg * 5.8 + (config.insuranceRequired ? 7 : 0);
  const franceToAfricaDelivery =
    typeof config.liveShippingAmount === 'number' && Number.isFinite(config.liveShippingAmount)
      ? config.liveShippingAmount
      : localFranceToAfricaDelivery;
  const productionSpeedFee = getProductionSpeedFee(config);
  const subtotal = partnerManufacturingCost + partnerHandlingCost + chinaToFranceLogistics + franceProcessingFee + franceToAfricaDelivery + productionSpeedFee;
  const kendronicsServiceFee = Math.max(10, subtotal * 0.145);
  const paymentProcessingFee = (subtotal + kendronicsServiceFee) * 0.029 + 0.3;
  const finalTotal = subtotal + kendronicsServiceFee + paymentProcessingFee;
  const leadTimeDays = getLeadTimeDays(config, country.logisticsZone);
  const displayTotalBeforeAdjustment = finalTotal + Math.max(2, finalTotal * 0.08);

  return {
    partnerManufacturingCost: round(partnerManufacturingCost),
    partnerHandlingCost: round(partnerHandlingCost),
    chinaToFranceLogistics: round(chinaToFranceLogistics),
    franceProcessingFee: round(franceProcessingFee),
    franceToAfricaDelivery: round(franceToAfricaDelivery),
    paymentProcessingFee: round(paymentProcessingFee),
    kendronicsServiceFee: round(kendronicsServiceFee),
    viaCoveringFee: round(viaCoveringFee),
    surfaceFinishFee: round(surfaceFinishFee),
    productionSpeedFee: round(productionSpeedFee),
    finalTotal: round(finalTotal),
    displayTotalBeforeAdjustment: round(displayTotalBeforeAdjustment),
    deliveryWeightKg: round(volumeWeightKg),
    shippingCarrier: getShippingCarrierLabel(config),
    estimatedShippingTime: config.liveShippingTransitTime ?? (config.shippingMode === 'express' ? '2-4 business days' : config.shippingMode === 'economy' ? '7-12 business days' : '4-7 business days'),
    estimatedLeadTime: `${leadTimeDays} business days`,
    pricingSource: 'local_calibrated',
    transparencyNote,
  };
}

function getShippingCarrierLabel(config: QuoteConfig): string {
  if (config.liveShippingCarrier) {
    return [config.liveShippingCarrier, config.liveShippingService].filter(Boolean).join(' ');
  }

  if (config.shippingMode === 'express') return 'DHL Express (DDP)';
  if (config.shippingMode === 'economy') return 'Economy Consolidated (DDP)';
  return 'Standard Express (DDP)';
}

function normalizeDimensions(config: QuoteConfig) {
  return {
    lengthMm: config.unit === 'inch' ? config.length * 25.4 : config.length,
    widthMm: config.unit === 'inch' ? config.width * 25.4 : config.width,
  };
}

function getAnchor(layers: number): CalibrationAnchor {
  if (layers <= 1) return PCBWAY_PUBLIC_ANCHORS[0];
  if (layers <= 2) return PCBWAY_PUBLIC_ANCHORS[1];
  return PCBWAY_PUBLIC_ANCHORS[2];
}

function getLayerMultiplier(layers: number, anchorLayers: number): number {
  if (layers <= anchorLayers) return 1;
  return {
    6: 1.72,
    8: 2.38,
    10: 3.08,
    12: 3.82,
    14: 4.58,
    16: 5.36,
  }[layers] ?? Math.max(1, layers / anchorLayers);
}

function getMaterialMultiplier(material: QuoteConfig['baseMaterial']): number {
  return {
    FR4: 1,
    Flex: 2.45,
    Aluminum: 1.55,
    'Copper Core': 1.72,
    Rogers: 3.15,
    'PTFE Teflon': 3.45,
  }[material];
}

function getSurfaceFinishMultiplier(finish: string): number {
  if (finish === 'ENIG') return 1.34;
  if (finish === 'OSP') return 1.08;
  if (finish === 'Immersion silver') return 1.22;
  return 1;
}

function getSurfaceFinishFee(finish: string, areaCm2: number, quantity: number): number {
  if (finish === 'HASL lead-free') return 0;
  const areaFactor = Math.max(1, (areaCm2 * quantity) / 1000);
  if (finish === 'ENIG') return 5 + areaFactor * 3.2;
  if (finish === 'Immersion silver') return 3.5 + areaFactor * 2.4;
  if (finish === 'OSP') return 1.8 + areaFactor * 1.1;
  return 0;
}

function getViaCoveringFee(viaCovering: string, areaCm2: number, quantity: number): number {
  if (!viaCovering || viaCovering === 'Tented') return 0;
  const areaFactor = Math.max(1, (areaCm2 * quantity) / 1200);
  if (viaCovering === 'Plugged') return 4.5 + areaFactor * 2.2;
  if (viaCovering === 'Epoxy filled') return 9 + areaFactor * 4.8;
  return 0;
}

function getProductionSpeedFee(config: QuoteConfig): number {
  if (config.productionSpeed === 'express_24h') return 7.5 + (config.layers > 2 ? 9 : 0);
  if (config.productionSpeed === 'pcba_24h') return config.assemblyRequired || config.productType === 'pcb_assembly' ? 12 : 0;
  return 0;
}

function getThicknessMultiplier(thickness: string): number {
  return {
    '0.8mm': 1.08,
    '1.0mm': 1.04,
    '1.2mm': 1.02,
    '1.6mm': 1,
    '2.0mm': 1.12,
  }[thickness] ?? 1;
}

function getColorMultiplier(color: string): number {
  return color === 'Green' ? 1 : color === 'White' || color === 'Matte black' ? 1.18 : 1.08;
}

function getCopperMultiplier(outer: string, inner: string, layers: number): number {
  const outerValue = parseFloat(outer) || 1;
  const innerValue = parseFloat(inner) || 0.5;
  return 1 + Math.max(0, outerValue - 1) * 0.24 + (layers > 2 ? Math.max(0, innerValue - 0.5) * 0.16 : 0);
}

function getPrecisionCost(config: QuoteConfig): number {
  const specialOptions = countTrue([
    config.impedanceControl,
    config.goldFingers,
    config.castellatedHoles,
    config.edgePlating,
    config.blindBuriedVias,
    config.viaInPad,
    config.peelableMask,
    config.carbonInk,
    config.countersink,
    config.pressFitHoles,
  ]);
  const viaCost = parseFloat(config.minimumViaHole) < 0.3 || parseFloat(config.viaDiameter) < 0.6 ? 6.5 : 0;
  const flexCost = config.baseMaterial === 'Flex' ? countTrue([Boolean(config.coverlayThickness), Boolean(config.stiffenerType), config.emiShieldingFilm]) * 7 : 0;
  return specialOptions * 6.8 + viaCost + flexCost;
}

function getTestingCost(config: QuoteConfig): number {
  return (
    (config.flyingProbe ? 4.5 : 0) +
    (config.fullElectricalTest ? 7.5 : 0) +
    (config.randomElectricalTest ? 3 : 0) +
    (config.fourWireKelvinTest ? 9 : 0) +
    (config.aoi ? 6 : 0)
  );
}

function getAssemblyCost(config: QuoteConfig): number {
  if (!config.assemblyRequired && config.productType !== 'pcb_assembly') return 0;
  const sideMultiplier = config.assemblySide === 'both' ? 1.5 : 1;
  const sourcingMultiplier = config.componentSourcing === 'partner_sourced' ? 1.2 : config.componentSourcing === 'mixed' ? 1.1 : 1;
  return (28 + config.quantity * 0.62) * sideMultiplier * sourcingMultiplier + (config.confirmPartsPlacement ? 0 : 4);
}

function getStencilCost(config: QuoteConfig): number {
  if (!config.stencilRequired && config.productType !== 'smt_stencil') return 0;
  const sizeCost = config.stencilSize === '370x470mm' ? 18 : config.stencilSize === '280x380mm' ? 10 : 0;
  return 22 + sizeCost + (config.stencilFrame ? 18 : 0) + (config.electroPolishing ? 9 : 0) + (config.engraving ? 5 : 0);
}

function estimateGrossWeightKg(lengthMm: number, widthMm: number, thickness: string, quantity: number, layers: number): number {
  const thicknessMm = parseFloat(thickness) || 1.6;
  const boardVolumeCm3 = (lengthMm / 10) * (widthMm / 10) * (thicknessMm / 10);
  const densityFactor = layers > 4 ? 2.25 : 2.05;
  const netWeightKg = (boardVolumeCm3 * densityFactor * quantity) / 1000;
  return Math.max(0.08, netWeightKg * 1.45 + 0.05);
}

function getLeadTimeDays(config: QuoteConfig, logisticsZone: string): number {
  const productionDays =
    (config.productionSpeed === 'express_24h' ? 1 : 2) +
    (config.layers > 2 ? 2 : 0) +
    (config.layers > 6 ? 3 : 0) +
    (config.baseMaterial !== 'FR4' ? 3 : 0) +
    (config.assemblyRequired ? 4 : 0) +
    countTrue([config.impedanceControl, config.blindBuriedVias, config.viaInPad]) * 2;
  const logisticsDays = zoneDeliveryDays[logisticsZone] ?? 16;
  const speedDays = config.productionSpeed === 'express_24h' ? -1 : 0;
  const modeDays = config.shippingMode === 'express' ? -4 : config.shippingMode === 'economy' ? 4 : 0;
  return Math.max(6, productionDays + logisticsDays + modeDays + speedDays);
}

function boardTypeFor(format: QuoteConfig['deliveryFormat']): string {
  if (format === 'customer_panel') return 'Panel PCB as design';
  if (format === 'panel_by_partner') return 'Panel PCB by Supplier';
  return 'Single PCB';
}

function materialForSupplier(material: QuoteConfig['baseMaterial']): string {
  return material === 'FR4' ? 'FR-4' : material;
}

function yesNo(value: boolean): 'Yes' | 'No' {
  return value ? 'Yes' : 'No';
}

function countTrue(values: boolean[]): number {
  return values.filter(Boolean).length;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
