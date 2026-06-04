import { Injectable } from '@nestjs/common';
import { MondayApiService } from './monday-api.service';
import { MondayColumnTarget, MondayConfigService } from './monday-config.service';

@Injectable()
export class MondayMapperService {
  private readonly columnCache = new Map<string, Record<string, MondayColumnTarget>>();

  constructor(
    private readonly api: MondayApiService,
    private readonly config: MondayConfigService,
  ) {}

  async columnValuesFor(board: string, payload: unknown, apiKey: string, boardId: string): Promise<Record<string, unknown>> {
    const value = objectValue(payload);
    const idMap = this.config.columnMapFor(board, 'MAP');
    const titleMap = this.config.columnMapFor(board, 'TITLE_MAP');
    const resolvedTitleMap = Object.keys(titleMap).length > 0 ? await this.resolveColumnTitles(board, apiKey, boardId, titleMap) : {};
    const columnMap: Record<string, MondayColumnTarget> = {
      ...Object.fromEntries(Object.entries(idMap).map(([source, id]) => [source, { id }])),
      ...resolvedTitleMap,
    };

    return Object.fromEntries(
      Object.entries(value)
        .filter(([key, entry]) => columnMap[key] && (entry == null || ['string', 'number', 'boolean'].includes(typeof entry)))
        .map(([key, entry]) => [columnMap[key].id, mondayColumnValue(entry as string | number | boolean | null, columnMap[key].type)]),
    );
  }

  async targetForField(board: string, field: string, apiKey: string, boardId: string): Promise<MondayColumnTarget | undefined> {
    const idMap = this.config.columnMapFor(board, 'MAP');
    if (idMap[field]) return { id: idMap[field] };
    const titleMap = this.config.columnMapFor(board, 'TITLE_MAP');
    const resolvedTitleMap = Object.keys(titleMap).length > 0 ? await this.resolveColumnTitles(board, apiKey, boardId, titleMap) : {};
    return resolvedTitleMap[field];
  }

  private async resolveColumnTitles(
    board: string,
    apiKey: string,
    boardId: string,
    sourceToTitle: Record<string, string>,
  ): Promise<Record<string, MondayColumnTarget>> {
    const cacheKey = `${this.config.canonicalBoard(board)}:${boardId}`;
    const cached = this.columnCache.get(cacheKey);
    if (cached) return pickMappedTargets(cached, sourceToTitle);

    const columns = await this.api.getBoardColumns(apiKey, boardId);
    const titleToTarget = Object.fromEntries(
      columns.map((column) => [normalizeTitle(column.title), { id: column.id, type: column.type }]),
    );
    this.columnCache.set(cacheKey, titleToTarget);
    return pickMappedTargets(titleToTarget, sourceToTitle);
  }
}

function pickMappedTargets(titleToTarget: Record<string, MondayColumnTarget>, sourceToTitle: Record<string, string>): Record<string, MondayColumnTarget> {
  const resolved: Record<string, MondayColumnTarget> = {};
  for (const [source, title] of Object.entries(sourceToTitle)) {
    const target = titleToTarget[normalizeTitle(title)];
    if (target) resolved[source] = target;
  }
  return resolved;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeTitle(value: string | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function mondayColumnValue(value: string | number | boolean | null, type?: string): unknown {
  if (value == null) return null;
  if (type === 'status') return { label: String(value) };
  if (type === 'date') return { date: String(value).slice(0, 10) };
  if (type === 'numbers') return typeof value === 'number' ? value : Number(value) || 0;
  if (type === 'link') return { url: String(value), text: String(value).slice(0, 120) };
  return value;
}
