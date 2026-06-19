import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createHmac, createHash, randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PresignUploadDto } from '../dto/presign-upload.dto';
import { GerberAnalysisResult } from '../entities/gerber-analysis.entity';
import { PresignedUpload } from '../entities/presigned-upload.entity';

@Injectable()
export class UploadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPresignedUpload(
    userId: string,
    sanitizedFilename: string,
    dto: PresignUploadDto,
  ): Promise<PresignedUpload> {
    const uploadId = randomUUID();
    const storageKey = `uploads/${userId}/${uploadId}/${sanitizedFilename}`;
    const uploadUrl = this.createPresignedPutUrl(storageKey);

    await this.prisma.gerberUpload.create({
      data: {
        id: uploadId,
        userId,
        originalFilename: dto.filename,
        sanitizedFilename,
        storageKey,
        mimeType: dto.mimeType,
        fileSizeBytes: dto.fileSizeBytes,
        status: 'pending_upload',
      },
    });

    return {
      uploadId,
      storageKey,
      uploadUrl,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      status: 'pending_scan',
    };
  }

  async uploadFile(
    userId: string,
    sanitizedFilename: string,
    dto: PresignUploadDto,
    fileBuffer: Buffer,
  ): Promise<PresignedUpload> {
    const presignedUpload = await this.createPresignedUpload(userId, sanitizedFilename, dto);
    const response = await fetch(presignedUpload.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': dto.mimeType },
      body: new Uint8Array(fileBuffer),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException(`Private storage rejected the upload (${response.status}).`);
    }

    return {
      ...presignedUpload,
      status: 'uploaded',
    };
  }

  async markUploaded(uploadId: string, userId: string): Promise<PresignedUpload | null> {
    const upload = await this.prisma.gerberUpload.findFirst({ where: { id: uploadId, userId } });
    if (!upload) return null;
    const updated = await this.prisma.gerberUpload.update({
      where: { id: upload.id },
      data: { status: 'uploaded' },
    });
    return {
      uploadId: updated.id,
      storageKey: updated.storageKey,
      uploadUrl: '',
      expiresAt: new Date(),
      status: 'uploaded',
    };
  }

  async downloadUploadFile(uploadId: string, userId: string): Promise<{ buffer: Buffer; storageKey: string } | null> {
    const upload = await this.prisma.gerberUpload.findFirst({
      where: { id: uploadId, userId },
      select: { storageKey: true },
    });
    if (!upload) return null;

    const response = await fetch(this.createPresignedGetUrl(upload.storageKey));
    if (!response.ok) {
      throw new ServiceUnavailableException(`Private storage rejected the download (${response.status}).`);
    }

    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      storageKey: upload.storageKey,
    };
  }

  async recordAnalysisForUpload(
    userId: string,
    uploadId: string,
    analysis: GerberAnalysisResult,
  ): Promise<PresignedUpload | null> {
    const upload = await this.prisma.gerberUpload.findFirst({
      where: { id: uploadId, userId },
      include: { analysis: true },
    });
    if (!upload) return null;

    const updatedUpload = await this.prisma.gerberUpload.update({
      where: { id: upload.id },
      data: {
        status: 'analyzed',
        analysis: upload.analysis
          ? {
              update: this.toAnalysisData(analysis),
            }
          : {
              create: this.toAnalysisData(analysis),
            },
      },
      include: { analysis: true },
    });

    return this.toPresignedUpload(updatedUpload, analysis);
  }

  async recordDirectUpload(
    userId: string,
    sanitizedFilename: string,
    dto: PresignUploadDto,
    storageKey: string,
    analysis: GerberAnalysisResult,
  ): Promise<PresignedUpload> {
    const upload = await this.prisma.gerberUpload.update({
      where: { id: storageKey.split('/')[2] },
      data: {
        originalFilename: dto.filename,
        sanitizedFilename,
        mimeType: dto.mimeType,
        fileSizeBytes: dto.fileSizeBytes,
        status: 'analyzed',
        analysis: {
          create: this.toAnalysisData(analysis),
        },
      },
      include: { analysis: true },
    });

    return this.toPresignedUpload(upload, analysis);
  }

  async findAnalysis(uploadId: string, userId: string): Promise<GerberAnalysisResult | null> {
    const analysis = await this.prisma.gerberAnalysis.findFirst({
      where: { uploadId, upload: { userId } },
    });
    if (!analysis) return null;

    return {
      widthMm: analysis.widthMm?.toNumber(),
      heightMm: analysis.heightMm?.toNumber(),
      detectedLayers: analysis.detectedLayers ?? undefined,
      holesCount: analysis.holesCount,
      hasSlots: analysis.hasSlots,
      boardAreaCm2: analysis.boardAreaCm2?.toNumber(),
      complexity: analysis.complexity as GerberAnalysisResult['complexity'],
      parserConfidence: analysis.parserConfidence.toNumber(),
      units: analysis.units as GerberAnalysisResult['units'],
      outlineSource: analysis.outlineSource ?? undefined,
      copperLayerFiles: analysis.copperLayerFiles,
      drillFiles: analysis.drillFiles,
      warnings: analysis.warnings,
      rawSummary: analysis.rawSummary as Record<string, unknown>,
    };
  }

  async deleteStorageKeys(storageKeys: string[]): Promise<void> {
    const uniqueStorageKeys = Array.from(new Set(storageKeys.filter(Boolean)));
    await Promise.all(
      uniqueStorageKeys.map(async (storageKey) => {
        try {
          const response = await fetch(this.createPresignedDeleteUrl(storageKey), { method: 'DELETE' });
          if (!response.ok && response.status !== 404) {
            console.error(`Private storage rejected delete for ${storageKey} (${response.status}).`);
          }
        } catch (error) {
          console.error(`Private storage delete failed for ${storageKey}:`, error instanceof Error ? error.message : String(error));
        }
      }),
    );
  }

  private createPresignedPutUrl(storageKey: string): string {
    return this.createPresignedUrl(storageKey, 'PUT');
  }

  private createPresignedGetUrl(storageKey: string): string {
    return this.createPresignedUrl(storageKey, 'GET');
  }

  private createPresignedDeleteUrl(storageKey: string): string {
    return this.createPresignedUrl(storageKey, 'DELETE');
  }

  private createPresignedUrl(storageKey: string, method: 'GET' | 'PUT' | 'DELETE'): string {
    const bucket = this.configValue('S3_BUCKET');
    const region = this.configValue('S3_REGION');
    const accessKeyId = this.configValue('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.configValue('S3_SECRET_ACCESS_KEY');

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('Production file uploads require S3 storage configuration.');
      }

      return `https://storage.example.com/private/${storageKey}?signature=placeholder`;
    }

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const service = 's3';
    const expiresSeconds = '600';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const endpoint = this.configValue('S3_ENDPOINT')?.replace(/\/+$/, '');
    const baseUrl = endpoint
      ? `${endpoint}/${bucket}/${this.uriEncodePath(storageKey)}`
      : `https://${bucket}.s3.${region}.amazonaws.com/${this.uriEncodePath(storageKey)}`;
    const url = new URL(baseUrl);

    url.searchParams.set('X-Amz-Algorithm', 'AWS4-HMAC-SHA256');
    url.searchParams.set('X-Amz-Credential', `${accessKeyId}/${credentialScope}`);
    url.searchParams.set('X-Amz-Date', amzDate);
    url.searchParams.set('X-Amz-Expires', expiresSeconds);
    const signedHeaders = method === 'PUT' ? 'content-type;host' : 'host';
    url.searchParams.set('X-Amz-SignedHeaders', signedHeaders);

    const canonicalQueryString = [...url.searchParams.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    const canonicalHeaders = method === 'PUT' ? `content-type:application/zip\nhost:${url.host}\n` : `host:${url.host}\n`;
    const canonicalRequest = [
      method,
      url.pathname,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      'UNSIGNED-PAYLOAD',
    ].join('\n');
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');
    const signingKey = this.getSignatureKey(secretAccessKey, dateStamp, region, service);
    const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    url.searchParams.set('X-Amz-Signature', signature);
    return url.toString();
  }

  private toAnalysisData(analysis: GerberAnalysisResult) {
    return {
      widthMm: optionalDecimal(analysis.widthMm),
      heightMm: optionalDecimal(analysis.heightMm),
      detectedLayers: analysis.detectedLayers,
      holesCount: analysis.holesCount,
      hasSlots: analysis.hasSlots,
      boardAreaCm2: optionalDecimal(analysis.boardAreaCm2),
      complexity: analysis.complexity,
      parserConfidence: new Prisma.Decimal(analysis.parserConfidence),
      units: analysis.units,
      outlineSource: analysis.outlineSource,
      copperLayerFiles: analysis.copperLayerFiles,
      drillFiles: analysis.drillFiles,
      warnings: analysis.warnings,
      rawSummary: analysis.rawSummary as Prisma.InputJsonObject,
    };
  }

  private toPresignedUpload(
    upload: {
      id: string;
      storageKey: string;
      analysis: {
        widthMm: Prisma.Decimal | null;
        heightMm: Prisma.Decimal | null;
        detectedLayers: number | null;
        holesCount: number;
        hasSlots: boolean;
        boardAreaCm2: Prisma.Decimal | null;
        complexity: string;
        parserConfidence: Prisma.Decimal;
        units: string | null;
        outlineSource: string | null;
        copperLayerFiles: string[];
        drillFiles: string[];
        warnings: string[];
        rawSummary: Prisma.JsonValue;
      } | null;
    },
    fallbackAnalysis: GerberAnalysisResult,
  ): PresignedUpload {
    return {
      uploadId: upload.id,
      storageKey: upload.storageKey,
      uploadUrl: '',
      expiresAt: new Date(),
      status: 'uploaded',
      analysis: upload.analysis
        ? {
            widthMm: upload.analysis.widthMm?.toNumber(),
            heightMm: upload.analysis.heightMm?.toNumber(),
            detectedLayers: upload.analysis.detectedLayers ?? undefined,
            holesCount: upload.analysis.holesCount,
            hasSlots: upload.analysis.hasSlots,
            boardAreaCm2: upload.analysis.boardAreaCm2?.toNumber(),
            complexity: upload.analysis.complexity as GerberAnalysisResult['complexity'],
            parserConfidence: upload.analysis.parserConfidence.toNumber(),
            units: upload.analysis.units as GerberAnalysisResult['units'],
            outlineSource: upload.analysis.outlineSource ?? undefined,
            copperLayerFiles: upload.analysis.copperLayerFiles,
            drillFiles: upload.analysis.drillFiles,
            warnings: upload.analysis.warnings,
            rawSummary: upload.analysis.rawSummary as Record<string, unknown>,
          }
        : fallbackAnalysis,
    };
  }

  private uriEncodePath(value: string): string {
    return value.split('/').map(encodeURIComponent).join('/');
  }

  private getSignatureKey(secretAccessKey: string, dateStamp: string, region: string, service: string): Buffer {
    const dateKey = createHmac('sha256', `AWS4${secretAccessKey}`).update(dateStamp).digest();
    const regionKey = createHmac('sha256', dateKey).update(region).digest();
    const serviceKey = createHmac('sha256', regionKey).update(service).digest();
    return createHmac('sha256', serviceKey).update('aws4_request').digest();
  }

  private configValue(key: string): string | undefined {
    const value = process.env[key]?.trim();
    return value && value !== 'not-configured' ? value : undefined;
  }
}

function optionalDecimal(value: number | undefined): Prisma.Decimal | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? new Prisma.Decimal(value) : undefined;
}
