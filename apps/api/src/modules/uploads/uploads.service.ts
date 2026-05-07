import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { PresignedUpload } from './entities/presigned-upload.entity';
import { GerberParserService } from './gerber-parser.service';
import { UploadRepository } from './repositories/upload.repository';

@Injectable()
export class UploadsService {
  constructor(
    private readonly uploadRepository: UploadRepository,
    private readonly gerberParser: GerberParserService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createPresignedUpload(userId: string, dto: PresignUploadDto): Promise<PresignedUpload> {
    this.validateUpload(dto);

    const sanitizedFilename = dto.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return this.uploadRepository.createPresignedUpload(userId, sanitizedFilename, dto);
  }

  async uploadFileThroughApi(
    userId: string,
    file:
      | {
          originalname: string;
          mimetype: string;
          size: number;
          buffer: Buffer;
        }
      | undefined,
  ): Promise<PresignedUpload> {
    if (!file) {
      throw new BadRequestException('A Gerber ZIP file is required.');
    }

    const dto: PresignUploadDto = {
      filename: file.originalname,
      mimeType: file.mimetype || 'application/zip',
      fileSizeBytes: file.size,
    };
    this.validateUpload(dto);

    const sanitizedFilename = dto.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const analysis = this.gerberParser.analyzeZip(file.buffer);
    const uploaded = await this.uploadRepository.uploadFile(userId, sanitizedFilename, dto, file.buffer);
    const recordedUpload = await this.uploadRepository.recordDirectUpload(userId, sanitizedFilename, dto, uploaded.storageKey, analysis);
    await this.notificationsService.create({
      userId,
      type: 'gerber.analysis.completed',
      title: 'Fichier Gerber analyse',
      body: gerberAnalysisSummary(analysis),
    });
    return recordedUpload;
  }

  async confirmDirectStorageUpload(userId: string, uploadId: string): Promise<PresignedUpload> {
    const uploadedFile = await this.uploadRepository.downloadUploadFile(uploadId, userId);
    if (!uploadedFile) {
      throw new NotFoundException('Upload not found for this user.');
    }

    const analysis = this.gerberParser.analyzeZip(uploadedFile.buffer);
    const recordedUpload = await this.uploadRepository.recordAnalysisForUpload(userId, uploadId, analysis);
    if (!recordedUpload) {
      throw new NotFoundException('Upload not found for this user.');
    }

    await this.notificationsService.create({
      userId,
      type: 'gerber.analysis.completed',
      title: 'Fichier Gerber analyse',
      body: gerberAnalysisSummary(analysis),
    });
    return recordedUpload;
  }

  getAnalysis(userId: string, uploadId: string) {
    return this.uploadRepository.findAnalysis(uploadId, userId);
  }

  private validateUpload(dto: PresignUploadDto): void {
    if (!dto.filename.toLowerCase().endsWith('.zip')) {
      throw new BadRequestException('Only Gerber ZIP files are allowed.');
    }

    if (dto.fileSizeBytes > 50 * 1024 * 1024) {
      throw new BadRequestException('Upload exceeds the 50MB limit.');
    }
  }
}

function gerberAnalysisSummary(analysis: {
  detectedLayers?: number;
  widthMm?: number;
  heightMm?: number;
  complexity: string;
  warnings: string[];
}): string {
  const dimensions =
    analysis.widthMm && analysis.heightMm
      ? ` Dimensions detectees : ${analysis.widthMm.toFixed(2)} x ${analysis.heightMm.toFixed(2)} mm.`
      : '';
  const layers = analysis.detectedLayers ? ` ${analysis.detectedLayers} couche(s) detectee(s).` : '';
  const warnings = analysis.warnings.length > 0 ? ` ${analysis.warnings.length} point(s) a verifier.` : '';
  return `Votre fichier Gerber a ete analyse.${layers}${dimensions} Complexite : ${analysis.complexity}.${warnings}`;
}
