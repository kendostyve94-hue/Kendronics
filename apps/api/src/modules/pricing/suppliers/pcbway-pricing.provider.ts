import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import {
  SupplierPricingProvider,
  SupplierQuote,
  toSupplierPcbPayload,
} from './supplier-pricing.provider';

@Injectable()
export class PcbWayPricingProvider implements SupplierPricingProvider {
  readonly name = 'pcbway';

  isConfigured(): boolean {
    return Boolean(this.apiKeyValue());
  }

  async getPcbQuote(dto: CreateQuoteDto): Promise<SupplierQuote> {
    const apiKey = this.apiKeyValue();
    if (!apiKey) {
      throw new ServiceUnavailableException('PCBWay quote API is not configured.');
    }

    const endpoint = this.configValue('PCBWAY_QUOTE_ENDPOINT') ?? 'https://api-partner.pcbway.com/api/Pcb/PcbQuotation';
    const payload = this.toQuotePayload(dto);
    const quoteResponse = await this.requestQuoteWithShippingFallback(endpoint, apiKey, payload);
    const { response, data } = quoteResponse;

    if (!response.ok || !data || this.isErrorResponse(data)) {
      throw new ServiceUnavailableException(this.quoteErrorMessage(response.status, data));
    }

    const priceItem = this.selectPriceItem(data.priceList ?? [], dto);
    const manufacturingPrice = Number(priceItem?.Price ?? data.Price ?? 0);
    const shippingPrice = Number(data.Shipping?.ShipCost ?? 0);
    if (!Number.isFinite(manufacturingPrice) || manufacturingPrice <= 0) {
      throw new ServiceUnavailableException('PCBWay live quote did not include a valid manufacturing price.');
    }

    return {
      supplier: this.name,
      supplierQuoteId: firstString(data.QuoteId, data.quoteId),
      manufacturingPrice: round(manufacturingPrice),
      shippingPrice: round(Number.isFinite(shippingPrice) ? shippingPrice : 0),
      currency: 'EUR',
      leadTimeDays: Number(priceItem?.BuildDays ?? data.BuildDays) || undefined,
      rawResponse: data as Record<string, unknown>,
    };
  }

  quoteRequestDiagnostics(dto: CreateQuoteDto): PcbWayQuoteDiagnostics {
    const apiKey = this.apiKeyValue();
    const payload = this.toQuotePayload(dto);

    return {
      endpoint: this.configValue('PCBWAY_QUOTE_ENDPOINT') ?? 'https://api-partner.pcbway.com/api/Pcb/PcbQuotation',
      method: 'POST',
      headerNames: ['api-key', 'Content-Type'],
      apiKeyFingerprint: this.apiKeyFingerprint(apiKey),
      payloadSummary: {
        Country: payload.Country,
        CountryCode: payload.CountryCode,
        ShipType: payload.ShipType,
        Postalcode: payload.Postalcode,
        City: payload.City,
        BoardType: payload.BoardType,
        Length: payload.Length,
        Width: payload.Width,
        Qty: payload.Qty,
        Layers: payload.Layers,
        Material: payload.Material,
        Thickness: payload.Thickness,
        SurfaceFinish: payload.SurfaceFinish,
        SolderMask: payload.SolderMask,
        Silkscreen: payload.Silkscreen,
      },
      payloadKeys: Object.keys(payload),
    };
  }

  async testAccountConnection(): Promise<PcbWayAccountProbe> {
    const apiKey = this.apiKeyValue();
    if (!apiKey) {
      return {
        ok: false,
        statusCode: 0,
        message: 'PCBWay API key is not configured.',
      };
    }

    const endpoint =
      this.configValue('PCBWAY_BALANCE_ENDPOINT') ?? 'https://api-partner.pcbway.com/api/Account/QueryBalance';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    const data = (await response.json().catch(() => null)) as PcbWayBalanceResponse | null;
    if (!response.ok || !data || this.isBalanceErrorResponse(data)) {
      return {
        ok: false,
        statusCode: response.status,
        message: this.balanceErrorMessage(response.status, data),
      };
    }

    return {
      ok: true,
      statusCode: response.status,
      balance: numberOrUndefined(data.balance),
      coupon: numberOrUndefined(data.coupon),
      point: numberOrUndefined(data.point),
      message: 'PCBWay account API accepted the key.',
    };
  }

  toQuotePayload(dto: CreateQuoteDto): Record<string, unknown> {
    return this.toPcbWayPayload(toSupplierPcbPayload(dto));
  }

  private toPcbWayPayload(payload: ReturnType<typeof toSupplierPcbPayload>): Record<string, unknown> {
    const surfaceFinish = this.surfaceFinish(payload.surfaceFinish);
    const finishedCopper = this.finishedCopper(payload.outerCopperWeight);
    const layers = this.supportedLayers(payload.layers);
    const material = this.material(payload.material);

    return {
      Country: this.countryName(payload.destinationCountryIso2),
      CountryCode: payload.destinationCountryIso2.toUpperCase(),
      ShipType: this.shipType(payload.shippingMode),
      Postalcode: this.postalCode(payload.destinationCountryIso2),
      City: this.shippingCity(payload.destinationCountryIso2),
      BoardType: this.boardType(payload.boardType),
      XoutAllowance: payload.boardType === 'single_pcb' ? null : 'Yes',
      EdgeRails: payload.boardType === 'panel_by_supplier' ? 'Yes' : null,
      RouteProcess: '--',
      PinBanNum: 0,
      DesignInPanel: clampInt(payload.differentDesigns, 1, 6),
      Length: round(payload.lengthMm),
      Width: round(payload.widthMm),
      Qty: this.supportedQuantity(payload.quantity),
      Layers: layers,
      CopperLayer: layers === 1 ? 'Top layer' : '--',
      CopperSolderMask: layers === 1 ? 'Both sides' : '--',
      CopperSilkscreen: layers === 1 ? 'Both sides' : '--',
      Material: material,
      FR4Tg: this.fr4Tg(layers, material),
      TCE: '1.0',
      Rogers: material === 'Rogers' ? 'Rogers4003C' : null,
      Thickness: this.supportedThickness(payload.thicknessMm),
      MinTrackSpacing: '6/6mil',
      MinHoleSize: this.supportedHoleSize(payload.minimumHoleSizeMm),
      SolderMask: this.solderMask(payload.solderMaskColor),
      Silkscreen: this.silkscreen(payload.silkscreenColor),
      SilkSides: 0,
      Goldfingers: yesNo(payload.options.goldFingers),
      GoldFingersBevelling: 'No',
      GoldPlatingType: surfaceFinish,
      GoldThickness: surfaceFinish === 'Immersion gold' ? '1' : null,
      SurfaceFinish: surfaceFinish,
      ViaProcess: this.viaProcess(payload.viaCovering),
      FinishedCopper: finishedCopper,
      RemoveProductNo: 'No',
      InsideThickness: layers >= 4 ? this.innerCopper(payload.innerCopperWeight) : null,
      Note: this.note(payload),
      DateCode: 'None',
      PeelableSoldermask: 'None',
      Buriedblind: payload.options.blindBuriedVias ? 'Yes' : '',
      Viafilled: payload.options.viaInPad ? 'Yes' : '',
      HoleCopperThickness: 'None',
      ULMaker: 'None',
      PaperBetweenPCBs: '',
      AddSerialNumbers: 'None',
      PackageBox: 'No',
      SidePlating: yesNoOrNull(payload.options.edgePlating),
      CarbonMask: yesNoOrNull(payload.options.carbonMask),
      Countersink: yesNoOrNull(payload.options.countersink),
      Pressfitholes: yesNoOrNull(payload.options.pressFitHoles),
      ImpedanceControl: yesNoOrNull(payload.options.impedanceControl),
      ViaPadOrViaResin: yesNoOrNull(payload.options.viaInPad),
      PlatedHalfHole: yesNoOrNull(payload.options.castellatedHoles),
      AcceptHASLUp: surfaceFinish.toLowerCase().includes('hasl') ? 'Yes' : null,
      returnPriceMatirx: false,
    };
  }

  private async requestQuoteWithShippingFallback(
    endpoint: string,
    apiKey: string,
    payload: Record<string, unknown>,
  ): Promise<{ response: Response; data: PcbWayQuoteResponse | null }> {
    const firstAttempt = await this.requestQuote(endpoint, apiKey, payload);
    if (!this.isShippingFeeError(firstAttempt.data)) return firstAttempt;

    for (const shipType of this.shippingFallbacks(Number(payload.ShipType))) {
      const retryPayload = { ...payload, ShipType: shipType };
      const retry = await this.requestQuote(endpoint, apiKey, retryPayload);
      if (!this.isShippingFeeError(retry.data)) return retry;
    }

    return firstAttempt;
  }

  private async requestQuote(
    endpoint: string,
    apiKey: string,
    payload: Record<string, unknown>,
  ): Promise<{ response: Response; data: PcbWayQuoteResponse | null }> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as PcbWayQuoteResponse | null;
    return { response, data };
  }

  private isShippingFeeError(data: PcbWayQuoteResponse | null): boolean {
    return String(data?.ErrorText ?? data?.errorText ?? '').toLowerCase().includes('shipping fee');
  }

  private shippingFallbacks(primaryShipType: number): number[] {
    return [1, 35, 2, 3, 4, 5, 6, 7, 8].filter((shipType, index, values) => shipType !== primaryShipType && values.indexOf(shipType) === index);
  }

  private selectPriceItem(items: PcbWayPriceItem[], dto: CreateQuoteDto): PcbWayPriceItem | undefined {
    if (items.length === 0) return undefined;
    if (dto.configSnapshot?.productionSpeed === 'rush') return items.find((item) => item.Express) ?? items[0];
    return items.find((item) => item.Standard) ?? items[0];
  }

  private isErrorResponse(data: PcbWayQuoteResponse): boolean {
    const status = String(data.Status ?? '').toLowerCase();
    return status === 'error' || data.Code === 0;
  }

  private isBalanceErrorResponse(data: PcbWayBalanceResponse): boolean {
    const status = String(data.Status ?? '').toLowerCase();
    return status === 'error' || data.Code === 0;
  }

  private countryName(countryCode: string): string {
    const code = countryCode.toUpperCase();
    return PCBWAY_COUNTRIES[code] ?? code;
  }

  private shippingCity(countryCode: string): string {
    return PCBWAY_SHIPPING_DEFAULTS[countryCode.toUpperCase()]?.city ?? '';
  }

  private postalCode(countryCode: string): string {
    return PCBWAY_SHIPPING_DEFAULTS[countryCode.toUpperCase()]?.postalCode ?? '';
  }

  private shipType(shippingMode: string): number {
    if (shippingMode === 'express') return 1;
    if (shippingMode === 'standard') return 35;
    return 35;
  }

  private quoteErrorMessage(statusCode: number, data: PcbWayQuoteResponse | null): string {
    if (statusCode === 401) {
      return 'PCBWay returned http=401 on PcbQuotation. The key may be active, but the quote endpoint rejected this request. Check auth header name/value, account binding, endpoint environment, and Render env formatting.';
    }

    const errorText = typeof data?.ErrorText === 'string' && data.ErrorText.trim() ? data.ErrorText.trim() : undefined;
    const status = typeof data?.Status === 'string' && data.Status.trim() ? data.Status.trim() : undefined;
    const code = typeof data?.Code === 'number' ? data.Code : undefined;
    const details = [
      errorText,
      status ? `status=${status}` : undefined,
      code !== undefined ? `code=${code}` : undefined,
      `http=${statusCode}`,
    ].filter(Boolean);

    return details.length > 0 ? `PCBWay live quote failed: ${details.join(', ')}` : 'PCBWay live quote failed.';
  }

  private balanceErrorMessage(statusCode: number, data: PcbWayBalanceResponse | null): string {
    if (statusCode === 401) {
      return 'PCBWay account API rejected the key: http=401. This points to an inactive key, wrong environment, or account/key mismatch.';
    }

    const errorText = typeof data?.ErrorText === 'string' && data.ErrorText.trim() ? data.ErrorText.trim() : undefined;
    const status = typeof data?.Status === 'string' && data.Status.trim() ? data.Status.trim() : undefined;
    const code = typeof data?.Code === 'number' ? data.Code : undefined;
    const details = [
      errorText,
      status ? `status=${status}` : undefined,
      code !== undefined ? `code=${code}` : undefined,
      `http=${statusCode}`,
    ].filter(Boolean);

    return details.length > 0 ? `PCBWay account API failed: ${details.join(', ')}` : 'PCBWay account API failed.';
  }

  private boardType(boardType: string): string {
    if (boardType === 'panel_as_designed') return 'Panel PCB as design';
    if (boardType === 'panel_by_supplier') return 'Panel PCB by Supplier';
    return 'Single PCB';
  }

  private material(value: string): string {
    const lower = value.toLowerCase();
    if (lower.includes('aluminum') || lower.includes('aluminium')) return 'Aluminum board';
    if (lower.includes('rogers')) return 'Rogers';
    if (lower.includes('hdi')) return 'HDI';
    if (lower.includes('copper')) return 'Copper';
    return 'FR-4';
  }

  private supportedLayers(value: number): number {
    const supported = [1, 2, 4, 6, 8, 10, 12, 14];
    return supported.reduce((closest, layer) => (Math.abs(layer - value) < Math.abs(closest - value) ? layer : closest), 2);
  }

  private supportedQuantity(value: number): number {
    const supported = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 125, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 9000, 10000];
    return supported.find((quantity) => quantity >= value) ?? 10000;
  }

  private fr4Tg(layers: number, material: string): string {
    if (material !== 'FR-4') return 'TG150';
    return layers >= 4 ? 'TG150' : 'TG130';
  }

  private supportedThickness(value: number): number {
    const supported = [0.2, 0.3, 0.4, 0.6, 0.8, 1.0, 1.2, 1.6, 2.0, 2.4, 2.6, 2.8, 3.0, 3.2];
    return supported.reduce((closest, thickness) => (Math.abs(thickness - value) < Math.abs(closest - value) ? thickness : closest), 1.6);
  }

  private supportedHoleSize(value: number): number {
    const supported = [0.15, 0.2, 0.25, 0.3, 0.8, 1.0];
    return supported.reduce((closest, size) => (Math.abs(size - value) < Math.abs(closest - value) ? size : closest), 0.3);
  }

  private solderMask(value: string): string {
    const normalized = value.trim();
    const allowed = ['Green', 'Red', 'Yellow', 'Blue', 'White', 'Black', 'Purple', 'Matt black', 'Matt green', 'None'];
    return allowed.find((item) => item.toLowerCase() === normalized.toLowerCase()) ?? 'Green';
  }

  private silkscreen(value: string): string {
    const normalized = value.trim();
    const allowed = ['White', 'Black', 'Yellow', 'None'];
    return allowed.find((item) => item.toLowerCase() === normalized.toLowerCase()) ?? 'White';
  }

  private surfaceFinish(value: string): string {
    const lower = value.toLowerCase();
    if (lower.includes('enig') || lower.includes('immersion gold')) return 'Immersion gold';
    if (lower.includes('osp')) return 'OSP';
    if (lower.includes('hard')) return 'Hard Gold';
    if (lower.includes('silver')) return 'Immersion Silver';
    if (lower.includes('tin')) return 'Immersion Tin';
    if (lower.includes('lead-free') || lower.includes('lead free')) return 'HASL lead free';
    if (lower.includes('none')) return 'None';
    return 'HASL with lead';
  }

  private viaProcess(value: string): string {
    const lower = value.toLowerCase();
    if (lower.includes('plug')) return 'Plugged vias';
    if (lower.includes('not') || lower.includes('open')) return 'Vias not covered';
    return 'Tenting vias';
  }

  private finishedCopper(value: string): string {
    const numberValue = parseFloat(value);
    const copper = Number.isFinite(numberValue) ? Math.max(0, Math.min(13, Math.round(numberValue))) : 1;
    return `${copper} oz Cu`;
  }

  private innerCopper(value: string): string {
    const numberValue = parseFloat(value);
    if (!Number.isFinite(numberValue)) return '1';
    return String(Math.max(1, Math.min(6, Math.round(numberValue))));
  }

  private note(payload: ReturnType<typeof toSupplierPcbPayload>): string {
    const notes: string[] = [];
    if (payload.gerberAnalysis?.complexity) notes.push(`Gerber complexity: ${payload.gerberAnalysis.complexity}`);
    if (payload.gerberAnalysis?.holesCount) notes.push(`Drill holes detected: ${payload.gerberAnalysis.holesCount}`);
    if (payload.gerberAnalysis?.hasSlots) notes.push('Slots detected in drill files.');
    return notes.join(' ');
  }

  private configValue(key: string): string | undefined {
    const value = stripWrappingQuotes(process.env[key]?.trim());
    return value && value !== 'not-configured' ? value : undefined;
  }

  private apiKeyValue(): string | undefined {
    const value = this.configValue('PCBWAY_API_KEY');
    if (!value) return undefined;

    return normalizePcbWayApiKey(value);
  }

  private apiKeyFingerprint(value?: string): string {
    if (!value) return 'missing';
    if (value.length <= 8) return `configured:length:${value.length}`;
    return `${value.slice(0, 4)}...${value.slice(-4)} length:${value.length}`;
  }
}

interface PcbWayPriceItem {
  BuildDays?: number;
  BuildText?: string;
  Express?: boolean;
  Price?: number;
  Standard?: boolean;
}

interface PcbWayQuoteResponse extends Record<string, unknown> {
  priceList?: PcbWayPriceItem[];
  Shipping?: {
    ShipCost?: number;
    ShipDays?: string;
    Weight?: number;
    IsRas?: boolean;
  };
  Status?: string;
  ErrorText?: string;
  errorText?: string;
  Code?: number;
  Price?: number;
  BuildDays?: number;
  QuoteId?: string;
  quoteId?: string;
}

interface PcbWayBalanceResponse extends Record<string, unknown> {
  balance?: number | string;
  coupon?: number | string;
  point?: number | string;
  Status?: string;
  ErrorText?: string;
  Code?: number;
}

export interface PcbWayAccountProbe {
  ok: boolean;
  statusCode: number;
  balance?: number;
  coupon?: number;
  point?: number;
  message: string;
}

export interface PcbWayQuoteDiagnostics {
  endpoint: string;
  method: 'POST';
  headerNames: string[];
  apiKeyFingerprint: string;
  payloadSummary: Record<string, unknown>;
  payloadKeys: string[];
}
const PCBWAY_COUNTRIES: Record<string, string> = {
  BJ: 'BENIN',
  BF: 'BURKINA FASO',
  CM: 'CAMEROON',
  CI: 'COTE D IVOIRE',
  FR: 'FRANCE',
  GA: 'GABON',
  GN: 'GUINEA',
  ML: 'MALI',
  NE: 'NIGER',
  SN: 'SENEGAL',
  TG: 'TOGO',
  TD: 'CHAD',
  US: 'UNITED STATES OF AMERICA',
};

const PCBWAY_SHIPPING_DEFAULTS: Record<string, { city: string; postalCode: string }> = {
  BJ: { city: 'Cotonou', postalCode: '01BP' },
  BF: { city: 'Ouagadougou', postalCode: '01' },
  CM: { city: 'Douala', postalCode: '00237' },
  CI: { city: 'Abidjan', postalCode: '01' },
  FR: { city: 'Paris', postalCode: '75001' },
  GA: { city: 'Libreville', postalCode: '00000' },
  GN: { city: 'Conakry', postalCode: '001' },
  ML: { city: 'Bamako', postalCode: '00000' },
  NE: { city: 'Niamey', postalCode: '8000' },
  SN: { city: 'Dakar', postalCode: '11000' },
  TG: { city: 'Lome', postalCode: '01' },
  TD: { city: 'N Djamena', postalCode: '00000' },
  US: { city: 'New York', postalCode: '10001' },
};

function yesNo(value: boolean): 'Yes' | 'No' {
  return value ? 'Yes' : 'No';
}

function yesNoOrNull(value: boolean): 'Yes' | 'No' | null {
  return value ? 'Yes' : null;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
  }
  return undefined;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function numberOrUndefined(value: unknown): number | undefined {
  const numberValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(numberValue) ? round(numberValue) : undefined;
}

function normalizePcbWayApiKey(value: string): string {
  const normalized = stripWrappingQuotes(value) ?? value;
  if (/\s/.test(normalized)) return normalized.replace(/\s+/, ' ');

  const pcbWayKeyWithCollapsedSeparator = /^(W\d{7}[A-Z])([A-Z0-9]{16,})$/i.exec(normalized);
  if (!pcbWayKeyWithCollapsedSeparator) return normalized;

  return `${pcbWayKeyWithCollapsedSeparator[1]} ${pcbWayKeyWithCollapsedSeparator[2]}`;
}

function stripWrappingQuotes(value?: string): string | undefined {
  if (!value) return value;
  let normalized = value.replace(/^\uFEFF/, '').trim();
  if ((normalized.startsWith('"') && normalized.endsWith('"')) || (normalized.startsWith("'") && normalized.endsWith("'"))) {
    normalized = normalized.slice(1, -1).trim();
  }
  return normalized.replace(/^\uFEFF/, '').trim();
}

