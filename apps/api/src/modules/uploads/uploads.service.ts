import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { extname, join } from 'path';
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

  async uploadProjectFile(
    userId: string,
    file:
      | {
          originalname: string;
          mimetype: string;
          size: number;
          buffer: Buffer;
        }
      | undefined,
  ): Promise<PresignedUpload & { originalName: string; mimeType: string; sizeBytes: number }> {
    if (!file) {
      throw new BadRequestException('A project file is required.');
    }
    const allowedMimeTypes = new Set([
      'application/zip',
      'application/x-zip-compressed',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/json',
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/webm',
      'application/octet-stream',
    ]);
    const sourceMimeType = projectFileMimeType(file.originalname, file.mimetype);
    if (!allowedMimeTypes.has(sourceMimeType)) {
      throw new BadRequestException('Unsupported project file type.');
    }
    const maxSizeBytes = sourceMimeType.startsWith('video/') ? 250 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(sourceMimeType.startsWith('video/') ? 'Project video exceeds the 250MB limit.' : 'Project file exceeds the 50MB limit.');
    }
    const normalizedFile = sourceMimeType.startsWith('video/')
      ? await normalizeVideoForPublicFeed(file, sourceMimeType)
      : {
          originalname: file.originalname,
          mimetype: sourceMimeType,
          size: file.size,
          buffer: file.buffer,
        };
    if (normalizedFile.size > maxSizeBytes) {
      throw new BadRequestException(sourceMimeType.startsWith('video/') ? 'Converted project video exceeds the 250MB limit.' : 'Project file exceeds the 50MB limit.');
    }
    const sanitizedFilename = normalizedFile.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const dto = {
      filename: normalizedFile.originalname,
      mimeType: normalizedFile.mimetype,
      fileSizeBytes: normalizedFile.size,
    } as PresignUploadDto;
    const uploaded = await this.uploadRepository.uploadFile(userId, sanitizedFilename, dto, normalizedFile.buffer);
    const recorded = await this.uploadRepository.markUploaded(uploaded.uploadId, userId);
    if (!recorded) throw new NotFoundException('Uploaded project file was not recorded.');
    return {
      ...recorded,
      originalName: normalizedFile.originalname,
      mimeType: normalizedFile.mimetype,
      sizeBytes: normalizedFile.size,
    };
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

function projectFileMimeType(filename: string, fallback = '') {
  const current = fallback || 'application/octet-stream';
  const lowerName = filename.toLowerCase();
  if (current === 'application/octet-stream' || !current.includes('/')) {
    if (lowerName.endsWith('.mp4')) return 'video/mp4';
    if (lowerName.endsWith('.mov')) return 'video/quicktime';
    if (lowerName.endsWith('.webm')) return 'video/webm';
    if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
    if (lowerName.endsWith('.png')) return 'image/png';
    if (lowerName.endsWith('.webp')) return 'image/webp';
  }
  return current;
}

async function normalizeVideoForPublicFeed(
  file: { originalname: string; size: number; buffer: Buffer },
  sourceMimeType: string,
) {
  const ffmpegPath = process.env.FFMPEG_PATH || optionalFfmpegStaticPath() || 'ffmpeg';
  const workdir = await mkdtemp(join(tmpdir(), 'kendronics-video-'));
  const sourceExt = videoExtensionForMimeType(sourceMimeType) || extname(file.originalname) || '.mp4';
  const inputPath = join(workdir, `source-${randomUUID()}${sourceExt}`);
  const outputPath = join(workdir, `public-${randomUUID()}.mp4`);

  try {
    await writeFile(inputPath, file.buffer);
    await runFfmpeg(ffmpegPath, [
      '-y',
      '-i',
      inputPath,
      '-map',
      '0:v:0',
      '-map',
      '0:a?',
      '-vf',
      'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1',
      '-r',
      '30',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-crf',
      '28',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      outputPath,
    ], 180_000);
    const buffer = await readFile(outputPath);
    return {
      originalname: `${file.originalname.replace(/\.[^.]+$/, '') || 'kendronics-video'}-16x9.mp4`,
      mimetype: 'video/mp4',
      size: buffer.length,
      buffer,
    };
  } catch (error) {
    throw new ServiceUnavailableException(`Video normalization is unavailable: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await rm(workdir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function runFfmpeg(ffmpegPath: string, args: string[], timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { windowsHide: true });
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGKILL');
      reject(new Error('Video conversion timed out. Try a shorter MP4 video.'));
    }, timeoutMs);
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
      if (stderr.length > 2000) stderr = stderr.slice(-2000);
    });
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr.trim() || `FFmpeg exited with code ${code}`));
    });
  });
}

function videoExtensionForMimeType(mimeType: string) {
  if (mimeType === 'video/mp4') return '.mp4';
  if (mimeType === 'video/quicktime') return '.mov';
  if (mimeType === 'video/webm') return '.webm';
  return '';
}

function optionalFfmpegStaticPath() {
  try {
    const ffmpegStaticPath = require('ffmpeg-static') as string | null;
    return ffmpegStaticPath || undefined;
  } catch {
    return undefined;
  }
}
