import { BadRequestException, Injectable } from '@nestjs/common';
import { inflateRawSync } from 'zlib';
import { GerberAnalysisResult } from './entities/gerber-analysis.entity';

interface ZipEntry {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

interface ParsedFile {
  name: string;
  text: string;
}

interface CoordinateBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  count: number;
  units: 'mm' | 'inch';
}

@Injectable()
export class GerberParserService {
  analyzeZip(buffer: Buffer): GerberAnalysisResult {
    const files = this.readTextFiles(buffer);
    if (files.length === 0) {
      throw new BadRequestException('The Gerber ZIP does not contain readable Gerber or drill files.');
    }

    const copperFiles = files.filter((file) => this.isCopperLayer(file.name));
    const drillFiles = files.filter((file) => this.isDrillFile(file.name));
    const outlineCandidates = files.filter((file) => this.isOutlineFile(file.name));
    const outlineSource = outlineCandidates[0]?.name;
    const bounds = this.bestBounds(outlineCandidates.length > 0 ? outlineCandidates : copperFiles.length > 0 ? copperFiles : files);
    const drillStats = this.drillStats(drillFiles);
    const detectedLayers = this.detectLayers(copperFiles);
    const warnings: string[] = [];

    if (!bounds) warnings.push('Board dimensions could not be extracted from Gerber coordinates.');
    if (!detectedLayers) warnings.push('Copper layer count could not be detected from file names.');
    if (drillFiles.length === 0) warnings.push('No drill file was detected.');

    const widthMm = bounds ? bounds.maxX - bounds.minX : undefined;
    const heightMm = bounds ? bounds.maxY - bounds.minY : undefined;
    const boardAreaCm2 = widthMm && heightMm ? (widthMm * heightMm) / 100 : undefined;
    const complexity = this.complexity(detectedLayers, drillStats.holesCount, drillStats.hasSlots, boardAreaCm2);
    const parserConfidence = this.confidence(Boolean(bounds), Boolean(detectedLayers), drillFiles.length > 0, warnings.length);

    return {
      widthMm: widthMm ? round(widthMm) : undefined,
      heightMm: heightMm ? round(heightMm) : undefined,
      detectedLayers,
      holesCount: drillStats.holesCount,
      hasSlots: drillStats.hasSlots,
      boardAreaCm2: boardAreaCm2 ? round(boardAreaCm2) : undefined,
      complexity,
      parserConfidence,
      units: bounds?.units,
      outlineSource,
      copperLayerFiles: copperFiles.map((file) => file.name),
      drillFiles: drillFiles.map((file) => file.name),
      warnings,
      rawSummary: {
        filesRead: files.length,
        outlineCandidates: outlineCandidates.map((file) => file.name),
        coordinateCount: bounds?.count ?? 0,
      },
    };
  }

  private readTextFiles(buffer: Buffer): ParsedFile[] {
    const entries = this.readZipEntries(buffer);
    return entries
      .filter((entry) => !entry.name.endsWith('/') && this.isGerberLikeFile(entry.name))
      .map((entry) => ({ name: entry.name, text: this.readEntry(buffer, entry).toString('utf8') }))
      .filter((file) => file.text.trim().length > 0);
  }

  private readZipEntries(buffer: Buffer): ZipEntry[] {
    const eocdOffset = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    if (eocdOffset < 0) throw new BadRequestException('Invalid ZIP archive.');

    const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
    const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
    const entries: ZipEntry[] = [];
    let offset = centralDirectoryOffset;

    for (let index = 0; index < totalEntries; index += 1) {
      if (buffer.readUInt32LE(offset) !== 0x02014b50) break;

      const compressionMethod = buffer.readUInt16LE(offset + 10);
      const compressedSize = buffer.readUInt32LE(offset + 20);
      const uncompressedSize = buffer.readUInt32LE(offset + 24);
      const filenameLength = buffer.readUInt16LE(offset + 28);
      const extraLength = buffer.readUInt16LE(offset + 30);
      const commentLength = buffer.readUInt16LE(offset + 32);
      const localHeaderOffset = buffer.readUInt32LE(offset + 42);
      const name = buffer.toString('utf8', offset + 46, offset + 46 + filenameLength);

      entries.push({ name, compressionMethod, compressedSize, uncompressedSize, localHeaderOffset });
      offset += 46 + filenameLength + extraLength + commentLength;
    }

    return entries;
  }

  private readEntry(buffer: Buffer, entry: ZipEntry): Buffer {
    const offset = entry.localHeaderOffset;
    if (buffer.readUInt32LE(offset) !== 0x04034b50) {
      throw new BadRequestException(`Invalid ZIP local header for ${entry.name}.`);
    }

    const filenameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const dataStart = offset + 30 + filenameLength + extraLength;
    const compressed = buffer.subarray(dataStart, dataStart + entry.compressedSize);

    if (entry.compressionMethod === 0) return compressed;
    if (entry.compressionMethod === 8) return inflateRawSync(compressed, { finishFlush: 2 });

    throw new BadRequestException(`Unsupported ZIP compression method for ${entry.name}.`);
  }

  private bestBounds(files: ParsedFile[]): CoordinateBounds | undefined {
    const bounds = files
      .map((file) => this.coordinateBounds(file.text))
      .filter((item): item is CoordinateBounds => Boolean(item));

    return bounds.sort((left, right) => right.count - left.count)[0];
  }

  private coordinateBounds(text: string): CoordinateBounds | undefined {
    const units = /%MOIN\*%|MOIN/i.test(text) ? 'inch' : 'mm';
    const format = text.match(/%FSLA[XY]?(\d)(\d)[XY](\d)(\d)\*%/i);
    const integerDigits = format ? Number(format[1]) : 2;
    const decimalDigits = format ? Number(format[2]) : units === 'inch' ? 5 : 4;
    const scale = units === 'inch' ? 25.4 : 1;
    const coordinatePattern = /X(-?\d+)Y(-?\d+)/gi;
    let match: RegExpExecArray | null;
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    let count = 0;

    while ((match = coordinatePattern.exec(text))) {
      const x = this.decodeCoordinate(match[1], integerDigits, decimalDigits) * scale;
      const y = this.decodeCoordinate(match[2], integerDigits, decimalDigits) * scale;
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      count += 1;
    }

    if (count < 2 || !Number.isFinite(minX) || !Number.isFinite(maxX)) return undefined;
    void integerDigits;
    return { minX, maxX, minY, maxY, count, units };
  }

  private decodeCoordinate(value: string, integerDigits: number, decimalDigits: number): number {
    const sign = value.startsWith('-') ? -1 : 1;
    const digits = value.replace(/^-/, '');
    if (digits.length <= integerDigits) return sign * Number(digits);
    return sign * (Number(digits) / Math.pow(10, decimalDigits));
  }

  private drillStats(files: ParsedFile[]): { holesCount: number; hasSlots: boolean } {
    const coordinatePattern = /X-?\d+Y-?\d+/gi;
    const holesCount = files.reduce((total, file) => total + (file.text.match(coordinatePattern)?.length ?? 0), 0);
    const hasSlots = files.some((file) => /G85|slot|route/i.test(file.text));
    return { holesCount, hasSlots };
  }

  private detectLayers(copperFiles: ParsedFile[]): number | undefined {
    const names = copperFiles.map((file) => file.name.toLowerCase());
    const hasTop = names.some((name) => /\.(gtl|top)$/i.test(name) || name.includes('top'));
    const hasBottom = names.some((name) => /\.(gbl|bot)$/i.test(name) || name.includes('bottom'));
    const innerLayers = names.filter((name) => /\.(g[0-9]+|gl[0-9]+)$/i.test(name) || /inner|in[0-9]+/.test(name)).length;
    const detected = Number(hasTop) + Number(hasBottom) + innerLayers;
    return detected > 0 ? Math.max(2, detected) : undefined;
  }

  private complexity(layers = 0, holesCount: number, hasSlots: boolean, boardAreaCm2 = 0): GerberAnalysisResult['complexity'] {
    if (layers >= 6 || holesCount > 800 || hasSlots || boardAreaCm2 > 250) return 'high';
    if (layers >= 4 || holesCount > 250 || boardAreaCm2 > 80) return 'medium';
    if (layers > 0 || boardAreaCm2 > 0) return 'low';
    return 'unknown';
  }

  private confidence(hasBounds: boolean, hasLayers: boolean, hasDrills: boolean, warningCount: number): number {
    const score = 0.25 + Number(hasBounds) * 0.35 + Number(hasLayers) * 0.25 + Number(hasDrills) * 0.1 - warningCount * 0.05;
    return Math.max(0.1, Math.min(0.98, roundRatio(score)));
  }

  private isGerberLikeFile(name: string): boolean {
    return /\.(gbr|ger|gtl|gbl|gts|gbs|gto|gbo|gko|gm1|gml|g[0-9]+|gl[0-9]+|drl|xln|txt)$/i.test(name);
  }

  private isCopperLayer(name: string): boolean {
    const lower = name.toLowerCase();
    return /\.(gtl|gbl|g[0-9]+|gl[0-9]+)$/i.test(lower) || /copper|top|bottom|inner|signal/.test(lower);
  }

  private isDrillFile(name: string): boolean {
    return /\.(drl|xln)$/i.test(name) || /drill|pth|npth/.test(name.toLowerCase());
  }

  private isOutlineFile(name: string): boolean {
    const lower = name.toLowerCase();
    return /\.(gko|gm1|gml)$/i.test(lower) || /outline|edge|profile|dimension|board/.test(lower);
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundRatio(value: number): number {
  return Math.round(value * 10000) / 10000;
}
