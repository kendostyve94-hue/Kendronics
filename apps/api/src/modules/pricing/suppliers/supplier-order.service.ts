import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrepareSupplierOrderDto } from '../dto/prepare-supplier-order.dto';
import { SmartBufferService } from '../smart-buffer.service';
import { toSupplierPcbPayload } from './supplier-pricing.provider';
import { PcbWayPricingProvider } from './pcbway-pricing.provider';

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
    private readonly pcbWayPricing: PcbWayPricingProvider,
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
      privacy: {
        customerPersonalDataIncluded: false,
        customerFieldsRemoved: ['email', 'fullName', 'phone', 'shippingAddress', 'billingAddress', 'clientPrice', 'margin'],
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

  async sendTechnicalReviewPackage(orderId: string, supplierOverride?: string) {
    const packageData = await this.buildPackage(orderId, supplierOverride);
    if (!['payment_authorized', 'supplier_review_pending'].includes(packageData.orderStatus)) {
      throw new BadRequestException('Technical review package requires an authorized payment.');
    }

    const supplier = packageData.supplier;
    const externalReviewId = `review-${packageData.orderId}-${Date.now()}`;
    const fileVersion = await this.nextTechnicalPackageVersion(packageData.orderId);
    const endpoint = this.configValue(`${supplier.toUpperCase()}_REVIEW_ENDPOINT`);
    const apiKey = this.configValue(`${supplier.toUpperCase()}_API_KEY`);
    const sanitizedPackage = this.supplierReviewPayload(packageData, fileVersion);

    let status = endpoint && apiKey ? 'sent' : 'queued';
    let responsePayload: Record<string, unknown> | undefined;
    let error: string | undefined;

    if (endpoint && apiKey) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: this.supplierOrderHeaders(supplier, apiKey),
          body: JSON.stringify(sanitizedPackage),
        });
        responsePayload = (await response.json().catch(() => ({ httpStatus: response.status }))) as Record<string, unknown>;
        if (!response.ok || this.isErrorResponse(responsePayload)) {
          status = 'send_failed';
          error = `${supplier} review endpoint rejected the technical package.`;
        }
      } catch (caught) {
        status = 'send_failed';
        error = caught instanceof Error ? caught.message : 'Technical review package send failed.';
      }
    }

    await this.prisma.$transaction([
      this.prisma.orderFile.upsert({
        where: { orderId_fileType_fileVersion: { orderId: packageData.orderId, fileType: 'gerber', fileVersion } },
        create: {
          orderId: packageData.orderId,
          fileType: 'gerber',
          uploadId: this.objectRecord(packageData.gerber).uploadId ? String(this.objectRecord(packageData.gerber).uploadId) : undefined,
          fileVersion,
          isCurrentVersion: true,
        },
        update: {
          uploadId: this.objectRecord(packageData.gerber).uploadId ? String(this.objectRecord(packageData.gerber).uploadId) : undefined,
          isCurrentVersion: true,
        },
      }),
      this.prisma.technicalSpecFile.upsert({
        where: { orderId_fileVersion: { orderId: packageData.orderId, fileVersion } },
        create: {
          orderId: packageData.orderId,
          fileVersion,
          isCurrentVersion: true,
          payload: sanitizedPackage as Prisma.InputJsonValue,
        },
        update: {
          isCurrentVersion: true,
          payload: sanitizedPackage as Prisma.InputJsonValue,
        },
      }),
      this.prisma.supplierReview.upsert({
        where: {
          orderId_attemptNumber_supplier_externalReviewId: {
            orderId: packageData.orderId,
            attemptNumber: 1,
            supplier,
            externalReviewId,
          },
        },
        create: {
          orderId: packageData.orderId,
          attemptNumber: 1,
          supplier,
          supplierStatus: status,
          supplierFeedback: error,
          externalReviewId,
          technicalPackageVersion: fileVersion,
        },
        update: {
          supplierStatus: status,
          supplierFeedback: error,
        },
      }),
      this.prisma.order.update({
        where: { id: packageData.orderId },
        data: {
          status: 'supplier_review_pending',
          supplierReviewStatus: status,
          currentFileVersion: fileVersion,
        },
      }),
      this.prisma.mondaySyncLog.create({
        data: {
          orderId: packageData.orderId,
          board: 'COMMANDES',
          operation: 'supplier_review_package',
          sourceEventId: externalReviewId,
          status: 'pending',
          payload: {
            orderNumber: packageData.orderNumber,
            quoteId: packageData.quoteId,
            supplier,
            technicalPackageVersion: fileVersion,
            supplierStatus: status,
            supplierReviewStatus: status,
            supplierOrderId: externalReviewId,
            gerberLink: String(this.objectRecord(packageData.gerber).storageKey ?? ''),
            specificationSummary: this.specificationSummary(packageData),
            error,
            response: responsePayload,
          } as Prisma.InputJsonValue,
        },
      }),
    ]);

    return { ok: status !== 'send_failed', status, supplier, externalReviewId, technicalPackageVersion: fileVersion };
  }

  private async createLiveSupplierOrder(supplier: string, packageData: Record<string, unknown>): Promise<SupplierOrderCreateResponse> {
    const endpoint = this.configValue(`${supplier.toUpperCase()}_ORDER_ENDPOINT`);
    const apiKey = this.configValue(`${supplier.toUpperCase()}_API_KEY`);
    if (!endpoint || !apiKey) {
      throw new ServiceUnavailableException(`${supplier} order API is not configured.`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: this.supplierOrderHeaders(supplier, apiKey),
      body: JSON.stringify(this.supplierOrderPayload(supplier, packageData)),
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

  private supplierOrderHeaders(supplier: string, apiKey: string): Record<string, string> {
    if (supplier.toLowerCase() === 'pcbway') {
      return {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      };
    }

    return {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private supplierOrderPayload(supplier: string, packageData: Record<string, unknown>): Record<string, unknown> {
    if (supplier.toLowerCase() !== 'pcbway') {
      return {
        ...this.supplierReviewPayload(packageData, this.numberValue(packageData.currentFileVersion, 1)),
        orderCreateMode: true,
      };
    }

    const pcb = this.objectRecord(packageData.pcb);
    const gerber = this.objectRecord(packageData.gerber);
    const quoteDto = {
      productType: String(pcb.productType ?? 'standard_pcb'),
      gerberFileId: String(pcb.gerberFileId ?? ''),
      layers: this.numberValue(pcb.layers, 2),
      lengthMm: this.numberValue(pcb.lengthMm, 100),
      widthMm: this.numberValue(pcb.widthMm, 100),
      quantity: this.numberValue(pcb.quantity, 5),
      destinationCountryIso2: String(pcb.destinationCountryIso2 ?? 'SN'),
      shippingMode: String(pcb.shippingMode ?? 'standard'),
      configSnapshot: this.objectRecord(pcb.configSnapshot),
    };
    const quotePayload = this.pcbWayPricing.toQuotePayload(quoteDto);

    return {
      ...quotePayload,
      PcbFileName: String(gerber.originalFilename ?? ''),
      PcbFileUrl: String(gerber.storageKey ?? ''),
      BuildDays: this.buildDays(pcb.configSnapshot),
      BuyerEmail: process.env.SUPPLIER_BUYER_EMAIL ?? process.env.OFFICIAL_CONTACT_EMAIL ?? 'operations@kendronics.com',
      OrderRemark: `Kendronics order ${String(packageData.orderNumber ?? '')}`.trim(),
      KendronicsOrderId: String(packageData.orderId ?? ''),
      KendronicsQuoteId: String(packageData.quoteId ?? ''),
    };
  }

  private supplierReviewPayload(packageData: Record<string, unknown>, fileVersion: number): Record<string, unknown> {
    const gerber = this.objectRecord(packageData.gerber);
    const pcb = this.objectRecord(packageData.pcb);
    return {
      internalOrderReference: packageData.orderNumber,
      kendronicsOrderId: packageData.orderId,
      technicalPackageVersion: fileVersion,
      supplier: packageData.supplier,
      gerber: {
        uploadId: gerber.uploadId,
        originalFilename: gerber.originalFilename,
        storageKey: gerber.storageKey,
        fileSizeBytes: gerber.fileSizeBytes,
        analysis: gerber.analysis,
      },
      pcb: {
        productType: pcb.productType,
        gerberFileId: pcb.gerberFileId,
        layers: pcb.layers,
        lengthMm: pcb.lengthMm,
        widthMm: pcb.widthMm,
        quantity: pcb.quantity,
        configSnapshot: pcb.configSnapshot,
        supplierPayload: pcb.supplierPayload,
      },
      privacy: {
        customerPersonalDataIncluded: false,
        clientPriceIncluded: false,
        marginIncluded: false,
      },
    };
  }

  private async nextTechnicalPackageVersion(orderId: string): Promise<number> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, select: { currentFileVersion: true } });
    return Math.max(1, order?.currentFileVersion ?? 1);
  }

  private buildDays(configSnapshot: unknown): number {
    const config = this.objectRecord(configSnapshot);
    return config.productionSpeed === 'rush' ? 1 : 2;
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

  private objectRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  private numberValue(value: unknown, fallback: number): number {
    const numberValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
    return Number.isFinite(numberValue) ? numberValue : fallback;
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

  private specificationSummary(packageData: Record<string, unknown>): string {
    const pcb = this.objectRecord(packageData.pcb);
    return [
      pcb.productType,
      pcb.layers ? `${pcb.layers} couches` : undefined,
      pcb.lengthMm && pcb.widthMm ? `${pcb.lengthMm} x ${pcb.widthMm} mm` : undefined,
      pcb.quantity ? `${pcb.quantity} pcs` : undefined,
    ].filter(Boolean).join(', ');
  }
}
