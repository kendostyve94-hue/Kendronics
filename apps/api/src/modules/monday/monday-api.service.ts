import { Injectable } from '@nestjs/common';
import { MondayColumnTarget, MondayConfigService } from './monday-config.service';

type MondayErrorResponse = { errors?: Array<{ message?: string }> };

@Injectable()
export class MondayApiService {
  constructor(private readonly config: MondayConfigService) {}

  async createItem(apiKey: string, boardId: string, itemName: string, columnValues: string): Promise<string | undefined> {
    const query = `
      mutation CreateKendronicsItem($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
        create_item(board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
          id
        }
      }
    `;
    const data = await this.graphqlRequest<{ create_item?: { id?: string } }>(apiKey, query, {
      boardId,
      itemName,
      columnValues,
    });
    return data.create_item?.id;
  }

  async updateItem(apiKey: string, boardId: string, itemId: string, columnValues: string): Promise<string | undefined> {
    const query = `
      mutation UpdateKendronicsItem($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
        change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $columnValues) {
          id
        }
      }
    `;
    const data = await this.graphqlRequest<{ change_multiple_column_values?: { id?: string } }>(apiKey, query, {
      boardId,
      itemId,
      columnValues,
    });
    return data.change_multiple_column_values?.id ?? itemId;
  }

  async findItemByColumn(apiKey: string, boardId: string, columnId: string, columnValue: string): Promise<string | undefined> {
    const query = `
      query FindKendronicsItem($boardId: ID!, $columnId: String!, $columnValue: String!) {
        items_page_by_column_values(
          board_id: $boardId,
          limit: 1,
          columns: [{ column_id: $columnId, column_values: [$columnValue] }]
        ) {
          items {
            id
          }
        }
      }
    `;
    const data = await this.graphqlRequest<{ items_page_by_column_values?: { items?: Array<{ id?: string }> } }>(apiKey, query, {
      boardId,
      columnId,
      columnValue,
    });
    return data.items_page_by_column_values?.items?.[0]?.id;
  }

  async getBoardColumns(apiKey: string, boardId: string): Promise<Array<MondayColumnTarget & { title: string }>> {
    const query = `
      query KendronicsBoardColumns($boardId: ID!) {
        boards(ids: [$boardId]) {
          columns {
            id
            title
            type
          }
        }
      }
    `;
    const data = await this.graphqlRequest<{ boards?: Array<{ columns?: Array<{ id?: string; title?: string; type?: string }> }> }>(
      apiKey,
      query,
      { boardId },
    );
    return (data.boards?.[0]?.columns ?? [])
      .filter((column): column is { id: string; title: string; type?: string } => Boolean(column.id && column.title))
      .map((column) => ({ id: column.id, title: column.title, type: column.type }));
  }

  async linkItems(apiKey: string, boardId: string, itemId: string, relationColumnId: string, linkedItemIds: string[]): Promise<void> {
    const columnValues = JSON.stringify({
      [relationColumnId]: {
        item_ids: linkedItemIds,
      },
    });
    await this.updateItem(apiKey, boardId, itemId, columnValues);
  }

  async graphqlRequest<T>(apiKey: string, query: string, variables: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.config.apiUrl(), {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });
    const body = await response.json().catch(() => null) as (MondayErrorResponse & { data?: T }) | null;
    if (!response.ok || body?.errors?.length) {
      throw new Error(body?.errors?.map((item) => item.message).filter(Boolean).join(' ') || `Monday API request failed (${response.status}).`);
    }
    return (body?.data ?? {}) as T;
  }
}
