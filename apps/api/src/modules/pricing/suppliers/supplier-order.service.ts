import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrepareSupplierOrderDto } from '../dto/prepare-supplier-order.dto';
import { SmartBufferService } from '../smart-buffer.service';
import { toSupplierPcbPayload } from './supplier-pricing.provider';

type SupplierOrderMode = 'prepare' | 'create';

interface SupplierOrderCreateResponse {
  supplierOrderId?: string;
  realSupplierPrice?: number;
  status?: string;
  rawResponse?: Record<string, unknown>;
}

@Injectable()
export class SupplierOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly smartBuffer: SmartBufferService,
  ) {}

  async prepareOrder(orderId: string, dto: PrepareSupplierOrderDto) {
    const mode: SupplierOrderMode = dto.mode ?? 'prepare';
    const packageData = await this.buildPackage(orderId, dto.supplier);

    if (mode === 'prepare') {
      return {
        ...packageData,
        mode,
        liveCreateAvailable: this.isLiveCreateConfigured(packageData.supplier),
        status: 'prepared',
      };
    }

    if (!['paid', 'supplier_order_pending', 'supplier_ordered'].includes(packageData.orderStatus)) {
      throw new BadRequestException('Supplier order creation requires a paid order.');
    }

    const createResponse = await this.createLiveSupplierOrder(packageData.supplier, packageData);
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        externalManufacturingPartner: packageData.supplier,
        externalSupplierOrderId: createResponse.supplierOrderId,
        status: createResponse.supplierOrderId ? 'supplier_ordered' : undefined,
      },
    });

    if (createResponse.realSupplierPrice) {
      await this.smartBuffer.recordRealSupplierPrice(packageData.quoteId, createResponse.realSupplierPrice);
    }

    return {
      ...packageData,
      mode,
      liveCreateAvailable: true,
      status: createResponse.status ?? 'created',
      supplierOrderId: createResponse.supplierOrderId,
      realSupplierPrice: createResponse.realSupplierPrice,
      supplierResponse: createResponse.rawResponse,
    };
  }

  private async buildPackage(orderId: string, supplierOverride?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { email: true, fullName: true, companyName: true } },
        quote: { include: { pricingSnapshot: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }
    if (!order.quote) {
      throw new BadRequestException('Order does not have a quote attached.');
    }

    const gerberUpload = await this.prisma.gerberUpload.findUnique({
      where: { id: order.quote.gerberFileId },
      include: { analysis: true },
    });
    const configSnapshot = this.objectValue(order.quote.configSnapshot);
    const pricingSnapshot = order.quote.pricingSnapshot;
    const supplier = supplierOverride?.trim() || pricingSnapshot?.supplier || process.env.PREFERRED_PCB_SUPPLIER || 'jlcpcb';
    const createQuoteDto = {
      productType: order.quote.productType,
      gerberFileId: order.quote.gerberFileId,
      layers: order.quote.layers,
      lengthMm: this.decimalToNumber(order.quote.lengthMm),
      widthMm: this.decimalToNumber(order.quote.widthMm),
      quantity: order.quote.quantity,
      destinationCountryIso2: order.quote.destinationCountryIso2,
      shippingMode: order.quote.shippingMode,
      configSnapshot,
    };

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      quoteId: order.quoteId,
      supplier,
      createdAt: new Date().toISOString(),
      customer: {
        email: order.user.email,
        fullName: order.user.fullName,
        companyName: order.user.companyName,
      },
      gerber: gerberUpload
        ? {
            uploadId: gerberUpload.id,
            originalFilename: gerberUpload.originalFilename,
            storageKey: gerberUpload.storageKey,
            fileSizeBytes: gerberUpload.fileSizeBytes,
            status: gerberUpload.status,
            analysis: gerberUpload.analysis
              ? {
                  widthMm: this.optionalDecimalToNumber(gerberUpload.analysis.widthMm),
                  heightMm: this.optionalDecimalToNumber(gerberUpload.analysis.heightMm),
                  detectedLayers: gerberUpload.analysis.detectedLayers,
                  holesCount: gerberUpload.analysis.holesCount,
                  hasSlots: gerberUpload.analysis.hasSlots,
                  boardAreaCm2: this.optionalDecimalToNumber(gerberUpload.analysis.boardAreaCm2),
                  complexity: gerberUpload.analysis.complexity,
                  parserConfidence: this.decimalToNumber(gerberUpload.analysis.parserConfidence),
                  units: gerberUpload.analysis.units,
                  outlineSource: gerberUpload.analysis.outlineSource,
                  copperLayerFiles: gerberUpload.analysis.copperLayerFiles,
                  drillFiles: gerberUpload.analysis.drillFiles,
                  warnings: gerberUpload.analysis.warnings,
                }
              : null,
          }
        : null,
      pcb: {
        ...createQuoteDto,
        supplierPayload: toSupplierPcbPayload(createQuoteDto),
      },
      pricing: pricingSnapshot
        ? {
            supplierEstimatedPrice: this.decimalToNumber(pricingSnapshot.supplierEstimatedPrice),
            supplierRealPrice: this.optionalDecimalToNumber(pricingSnapshot.supplierRealPrice),
            bufferUsed: this.decimalToNumber(pricingSnapshot.bufferUsed),
            serviceFee: this.decimalToNumber(pricingSnapshot.serviceFee),
            pcbClientPrice: this.decimalToNumber(pricingSnapshot.pcbClientPrice),
            shippingPrice: this.decimalToNumber(pricingSnapshot.shippingPrice),
            totalClientPrice: this.decimalToNumber(pricingSnapshot.totalClientPrice),
            currency: pricingSnapshot.currency,
            bucketKey: pricingSnapshot.bucketKey,
            confidence: pricingSnapshot.confidence,
            formulaVersion: pricingSnapshot.formulaVersion,
          }
        : {
            supplierEstimatedPrice: null,
            supplierRealPrice: null,
            bufferUsed: null,
            serviceFee: null,
            pcbClientPrice: null,
            shippingPrice: null,
            totalClientPrice: this.decimalToNumber(order.quote.finalTotal),
            currency: order.quote.currency,
            bucketKey: null,
            confidence: 'unknown',
            formulaVersion: 'unknown',
          },
      notes: [
        gerberUpload ? 'Gerber upload found and linked to quote.' : 'Gerber upload record was not found for this quote.',
        pricingSnapshot ? 'Smart Buffer pricing snapshot found.' : 'No Smart Buffer snapshot found for this quote.',
      ],
    };
  }

  private async createLiveSupplierOrder(supplier: string, packageData: Record<string, unknown>): Promise<SupplierOrderCreateResponse> {
    const endpoint = this.configValue(`${supplier.toUpperCase()}_ORDER_ENDPOINT`);
    const apiKey = this.configValue(`${supplier.toUpperCase()}_API_KEY`);
    if (!endpoint || !apiKey) {
      throw new ServiceUnavailableException(`${supplier} order API is not configured.`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(packageData),
    });
    const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    if (!response.ok || !data || this.isErrorResponse(data)) {
      throw new ServiceUnavailableException(`${supplier} order API did not accept the order package.`);
    }

    return {
      supplierOrderId: this.firstString(data, ['supplierOrderId', 'orderId', 'orderNo', 'id']),
      realSupplierPrice: this.firstNumber(data, ['realSupplierPrice', 'manufacturingPrice', 'pcbPrice', 'amount']),
      status: this.firstString(data, ['status', 'orderStatus']),
      rawResponse: data,
    };
  }

  private isLiveCreateConfigured(supplier: string): boolean {
    return Boolean(this.configValue(`${supplier.toUpperCase()}_ORDER_ENDPOINT`) && this.configValue(`${supplier.toUpperCase()}_API_KEY`));
  }

  private isErrorResponse(data: Record<string, unknown>): boolean {
    const status = String(data.status ?? data.Status ?? '').toLowerCase();
    return status === 'error' || data.success === false || Boolean(data.error);
  }

  private firstNumber(data: Record<string, unknown>, keys: string[]): number | undefined {
    for (const key of keys) {
      const value = this.deepValue(data, key);
      const numberValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
      if (Number.isFinite(numberValue)) return Math.round(numberValue * 100) / 100;
    }
    return undefined;
  }

  private firstString(data: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = this.deepValue(data, key);
      if (typeof value === 'string' && value.trim()) return value;
      if (typeof value === 'number') return String(value);
    }
    return undefined;
  }

  private deepValue(data: Record<string, unknown>, targetKey: string): unknown {
    const direct = data[targetKey];
    if (direct != null) return direct;

    for (const value of Object.values(data)) {
      if (!value || typeof value !== 'object') continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === 'object') {
            const found = this.deepValue(item as Record<string, unknown>, targetKey);
            if (found != null) return found;
          }
        }
      } else {
        const found = this.deepValue(value as Record<string, unknown>, targetKey);
        if (found != null) return found;
      }
    }

    return undefined;
  }

  private objectValue(value: Prisma.JsonValue | null): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  private decimalToNumber(value: Prisma.Decimal): number {
    return value.toNumber();
  }

  private optionalDecimalToNumber(value: Prisma.Decimal | null): number | undefined {
    return value ? value.toNumber() : undefined;
  }

  private configValue(key: string): string | undefined {
    const value = process.env[key]?.trim();
    return value && value !== 'not-configured' ? value : undefined;
  }
}
