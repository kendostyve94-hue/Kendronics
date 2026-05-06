import { CreateQuoteDto } from '../dto/create-quote.dto';

export interface SupplierQuote {
  supplier: string;
  supplierQuoteId?: string;
  manufacturingPrice: number;
  shippingPrice: number;
  currency: 'EUR' | 'USD';
  leadTimeDays?: number;
  rawResponse?: Record<string, unknown>;
}

export interface SupplierPricingProvider {
  readonly name: string;
  isConfigured(): boolean;
  getPcbQuote(dto: CreateQuoteDto): Promise<SupplierQuote>;
}

export interface SupplierPcbPayload {
  productType: string;
  gerberFileId: string;
  layers: number;
  lengthMm: number;
  widthMm: number;
  quantity: number;
  destinationCountryIso2: string;
  shippingMode: string;
  boardType: string;
  differentDesigns: number;
  material: string;
  thicknessMm: number;
  solderMaskColor: string;
  silkscreenColor: string;
  surfaceFinish: string;
  viaCovering: string;
  productionSpeed: string;
  outerCopperWeight: string;
  innerCopperWeight: string;
  minimumHoleSizeMm: number;
  options: Record<string, boolean>;
  gerberAnalysis?: {
    parserConfidence?: number;
    complexity?: string;
    holesCount?: number;
    hasSlots?: boolean;
    detectedLayers?: number;
    boardAreaCm2?: number;
  };
}

export function toSupplierPcbPayload(dto: CreateQuoteDto): SupplierPcbPayload {
  const config = dto.configSnapshot ?? {};
  return {
    productType: dto.productType,
    gerberFileId: dto.gerberFileId,
    layers: dto.layers,
    lengthMm: dto.lengthMm,
    widthMm: dto.widthMm,
    quantity: dto.quantity,
    destinationCountryIso2: dto.destinationCountryIso2,
    shippingMode: dto.shippingMode,
    boardType: boardTypeFor(config.deliveryFormat),
    differentDesigns: numberConfig(config.differentDesigns, 1),
    material: materialForSupplier(stringConfig(config.baseMaterial, 'FR4')),
    thicknessMm: parseFloat(stringConfig(config.thickness, '1.6mm')) || 1.6,
    solderMaskColor: stringConfig(config.solderMaskColor, 'Green'),
    silkscreenColor: stringConfig(config.silkscreenColor, 'White'),
    surfaceFinish: stringConfig(config.surfaceFinish, 'HASL lead-free'),
    viaCovering: stringConfig(config.viaCovering, 'Tented'),
    productionSpeed: stringConfig(config.productionSpeed, 'standard'),
    outerCopperWeight: stringConfig(config.outerCopperWeight, '1 oz'),
    innerCopperWeight: stringConfig(config.innerCopperWeight, '0.5 oz'),
    minimumHoleSizeMm: parseFloat(stringConfig(config.minimumViaHole, '0.3mm')) || 0.3,
    options: {
      goldFingers: booleanConfig(config.goldFingers),
      castellatedHoles: booleanConfig(config.castellatedHoles),
      edgePlating: booleanConfig(config.edgePlating),
      blindBuriedVias: booleanConfig(config.blindBuriedVias),
      viaInPad: booleanConfig(config.viaInPad),
      carbonMask: booleanConfig(config.carbonInk),
      countersink: booleanConfig(config.countersink),
      pressFitHoles: booleanConfig(config.pressFitHoles),
      impedanceControl: booleanConfig(config.impedanceControl),
      slots: booleanConfig(config.hasSlots),
    },
    gerberAnalysis: {
      parserConfidence: numberConfig(config.parserConfidence, undefined),
      complexity: stringConfig(config.gerberComplexity, undefined),
      holesCount: numberConfig(config.holesCount, undefined),
      hasSlots: booleanConfig(config.hasSlots),
      detectedLayers: numberConfig(config.detectedLayers, undefined),
      boardAreaCm2: numberConfig(config.boardAreaCm2, undefined),
    },
  };
}

function boardTypeFor(value: unknown): string {
  if (value === 'customer_panel') return 'panel_as_designed';
  if (value === 'panel_by_partner') return 'panel_by_supplier';
  return 'single_pcb';
}

function materialForSupplier(value: string): string {
  return value === 'FR4' ? 'FR-4' : value;
}

function stringConfig<T extends string | undefined>(value: unknown, fallback: T): string | T {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function numberConfig<T extends number | undefined>(value: unknown, fallback: T): number | T {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function booleanConfig(value: unknown): boolean {
  return value === true;
}
