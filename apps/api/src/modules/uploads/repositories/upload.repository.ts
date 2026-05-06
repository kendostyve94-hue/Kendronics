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
    void dto;

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
      headers: { 'Content-Type': 'application/zip' },
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

  async recordDirectUpload(
    userId: string,
    sanitizedFilename: string,
    dto: PresignUploadDto,
    storageKey: string,
    analysis: GerberAnalysisResult,
  ): Promise<PresignedUpload> {
    const upload = await this.prisma.gerberUpload.create({
      data: {
        userId,
        originalFilename: dto.filename,
        sanitizedFilename,
        storageKey,
        mimeType: dto.mimeType,
        fileSizeBytes: dto.fileSizeBytes,
        status: 'analyzed',
        analysis: {
          create: {
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
          },
        },
      },
      include: { analysis: true },
    });

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
        : analysis,
    };
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

  private createPresignedPutUrl(storageKey: string): string {
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
    url.searchParams.set('X-Amz-SignedHeaders', 'content-type;host');

    const canonicalQueryString = [...url.searchParams.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    const canonicalHeaders = `content-type:application/zip\nhost:${url.host}\n`;
    const canonicalRequest = [
      'PUT',
      url.pathname,
      canonicalQueryString,
      canonicalHeaders,
      'content-type;host',
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
