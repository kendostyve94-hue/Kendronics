import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createHmac, createHash, randomUUID } from 'crypto';
import { PresignUploadDto } from '../dto/presign-upload.dto';
import { PresignedUpload } from '../entities/presigned-upload.entity';

@Injectable()
export class UploadRepository {
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
    url.searchParams.set('X-Amz-SignedHeaders', 'host');

    const canonicalQueryString = [...url.searchParams.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    const canonicalHeaders = `host:${url.host}\n`;
    const canonicalRequest = [
      'PUT',
      url.pathname,
      canonicalQueryString,
      canonicalHeaders,
      'host',
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
