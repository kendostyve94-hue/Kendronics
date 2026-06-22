import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { extname, join } from 'path';
import { PresignUploadDto } from '../uploads/dto/presign-upload.dto';
import { UploadRepository } from '../uploads/repositories/upload.repository';
import { PrismaService } from '../../prisma/prisma.service';

const jobType = 'video_16x9';
const processingTimeoutMs = 10 * 60 * 1000;
const staleLockMs = 20 * 60 * 1000;

@Injectable()
export class ProjectMediaProcessingWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProjectMediaProcessingWorker.name);
  private interval: NodeJS.Timeout | undefined;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadRepository: UploadRepository,
  ) {}

  onModuleInit() {
    this.interval = setInterval(() => {
      void this.processNext();
    }, 15_000);
    void this.requeueStaleJobs();
    void this.processNext();
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  private async processNext() {
    if (this.running) return;
    this.running = true;
    try {
      await this.requeueStaleJobs();
      const job = await this.claimJob();
      if (!job) return;
      await this.processJob(job.id);
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
    } finally {
      this.running = false;
    }
  }

  private async requeueStaleJobs() {
    await this.prisma.projectMediaProcessingJob.updateMany({
      where: {
        status: 'processing',
        lockedAt: { lt: new Date(Date.now() - staleLockMs) },
        attempts: { lt: 3 },
      },
      data: { status: 'pending', lockedAt: null },
    });
  }

  private async claimJob() {
    const candidate = await this.prisma.projectMediaProcessingJob.findFirst({
      where: { status: 'pending', jobType, attempts: { lt: 3 } },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!candidate) return null;

    const claimed = await this.prisma.projectMediaProcessingJob.updateMany({
      where: { id: candidate.id, status: 'pending' },
      data: { status: 'processing', lockedAt: new Date(), attempts: { increment: 1 }, lastError: null },
    });
    return claimed.count === 1 ? candidate : null;
  }

  private async processJob(jobId: string) {
    const job = await this.prisma.projectMediaProcessingJob.findUnique({
      where: { id: jobId },
      include: {
        asset: {
          include: {
            upload: {
              select: { storageKey: true, status: true },
            },
          },
        },
      },
    });
    if (!job) return;
    if (!job.asset.mimeType.startsWith('video/')) {
      await this.completeJob(job.id);
      return;
    }
    if (!['uploaded', 'analyzed'].includes(job.asset.upload.status)) {
      await this.failJob(job.id, job.attempts, 'Source upload is not ready.');
      return;
    }

    try {
      const sourceBuffer = await this.uploadRepository.downloadStorageKey(job.asset.upload.storageKey);
      const normalized = await normalizeVideo(sourceBuffer, job.asset.originalName, job.asset.mimeType);
      const sanitizedFilename = normalized.originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const dto: PresignUploadDto = {
        filename: normalized.originalName,
        mimeType: normalized.mimeType,
        fileSizeBytes: normalized.buffer.length,
      };
      const uploaded = await this.uploadRepository.uploadFile(job.userId, sanitizedFilename, dto, normalized.buffer);
      const recorded = await this.uploadRepository.markUploaded(uploaded.uploadId, job.userId);
      if (!recorded) throw new Error('Normalized upload was not recorded.');

      await this.prisma.$transaction([
        this.prisma.explorerProjectAsset.update({
          where: { id: job.assetId },
          data: {
            uploadId: recorded.uploadId,
            originalName: normalized.originalName,
            mimeType: normalized.mimeType,
            sizeBytes: normalized.buffer.length,
          },
        }),
        this.prisma.projectMediaProcessingJob.update({
          where: { id: job.id },
          data: { status: 'completed', completedAt: new Date(), lockedAt: null, lastError: null },
        }),
      ]);
    } catch (error) {
      await this.failJob(job.id, job.attempts, error instanceof Error ? error.message : String(error));
    }
  }

  private async completeJob(jobId: string) {
    await this.prisma.projectMediaProcessingJob.update({
      where: { id: jobId },
      data: { status: 'completed', completedAt: new Date(), lockedAt: null },
    });
  }

  private async failJob(jobId: string, attempts: number, error: string) {
    const nextStatus = attempts >= 3 ? 'failed' : 'pending';
    await this.prisma.projectMediaProcessingJob.update({
      where: { id: jobId },
      data: {
        status: nextStatus,
        lockedAt: null,
        lastError: error.slice(0, 2000),
      },
    });
  }
}

async function normalizeVideo(sourceBuffer: Buffer, originalName: string, mimeType: string) {
  const ffmpegPath = process.env.FFMPEG_PATH || optionalFfmpegStaticPath() || 'ffmpeg';
  const workdir = await mkdtemp(join(tmpdir(), 'kendronics-video-'));
  const inputPath = join(workdir, `source-${randomUUID()}${videoExtensionForMimeType(mimeType) || extname(originalName) || '.mp4'}`);
  const outputPath = join(workdir, `normalized-${randomUUID()}.mp4`);
  try {
    await writeFile(inputPath, sourceBuffer);
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
      'veryfast',
      '-crf',
      '24',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      outputPath,
    ], processingTimeoutMs);
    return {
      originalName: `${originalName.replace(/\.[^.]+$/, '') || 'kendronics-video'}-16x9.mp4`,
      mimeType: 'video/mp4',
      buffer: await readFile(outputPath),
    };
  } finally {
    await rm(workdir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function runFfmpeg(ffmpegPath: string, args: string[], timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { windowsHide: true });
    let settled = false;
    let stderr = '';
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGKILL');
      reject(new Error('Video conversion timed out.'));
    }, timeoutMs);

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

function optionalFfmpegStaticPath() {
  try {
    const ffmpegStaticPath = require('ffmpeg-static') as string | null;
    return ffmpegStaticPath || undefined;
  } catch {
    return undefined;
  }
}

function videoExtensionForMimeType(mimeType: string) {
  if (mimeType === 'video/mp4') return '.mp4';
  if (mimeType === 'video/quicktime') return '.mov';
  if (mimeType === 'video/webm') return '.webm';
  return '';
}
