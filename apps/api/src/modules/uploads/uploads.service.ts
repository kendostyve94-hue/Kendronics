import { BadRequestException, Injectable } from '@nestjs/common';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { PresignedUpload } from './entities/presigned-upload.entity';
import { GerberParserService } from './gerber-parser.service';
import { UploadRepository } from './repositories/upload.repository';

@Injectable()
export class UploadsService {
  constructor(
    private readonly uploadRepository: UploadRepository,
    private readonly gerberParser: GerberParserService,
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
    return this.uploadRepository.recordDirectUpload(userId, sanitizedFilename, dto, uploaded.storageKey, analysis);
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
