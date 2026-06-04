import { Injectable } from '@nestjs/common';

export type MondayColumnTarget = { id: string; type?: string };

@Injectable()
export class MondayConfigService {
  private readonly boardAliases: Record<string, string> = {
    COMMANDES: 'COMMANDES',
    EN_PRODUCTION: 'EN_PRODUCTION',
    CHIFFRE_AFFAIRE_LIVE: 'CHIFFRE_AFFAIRE_LIVE',
    LOGISTICS_INTERNATIONAL: 'LOGISTICS_INTERNATIONAL',
    LOGISTIQUE_INTERNATIONALE: 'LOGISTICS_INTERNATIONAL',
    LOGISTIQUE_LOCALE: 'LOGISTIQUE_LOCALE',
    SUPPORT: 'SUPPORT_CLIENTS',
    SUPPORT_CLIENTS: 'SUPPORT_CLIENTS',
    REGISTRE_DES_ACHATS_ET_AUTRES_DEPENSES: 'REGISTRE_ACHATS_DEPENSES',
    REGISTRE_ACHATS_DEPENSES: 'REGISTRE_ACHATS_DEPENSES',
    TRESORERIE: 'TRESORERIE',
    TREASURY: 'TRESORERIE',
  };

  apiUrl(): string {
    return process.env.MONDAY_API_URL ?? 'https://api.monday.com/v2';
  }

  apiKey(): string | undefined {
    return process.env.MONDAY_API_KEY?.trim();
  }

  required(): boolean {
    return process.env.NODE_ENV === 'production' && process.env.MONDAY_REQUIRED === 'true';
  }

  canonicalBoard(board: string): string {
    const normalized = board.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    return this.boardAliases[normalized] ?? normalized;
  }

  boardIdFor(board: string): string | undefined {
    return process.env[`MONDAY_BOARD_${this.canonicalBoard(board)}_ID`]?.trim();
  }

  identityFieldFor(board: string): string {
    const canonical = this.canonicalBoard(board);
    const configured = process.env[`MONDAY_IDENTITY_FIELD_${canonical}`]?.trim();
    if (configured) return configured;
    if (canonical === 'EN_PRODUCTION') return 'internalReference';
    if (canonical === 'SUPPORT_CLIENTS') return 'ticketNumber';
    if (canonical === 'CHIFFRE_AFFAIRE_LIVE') return 'invoiceNumber';
    if (canonical === 'REGISTRE_ACHATS_DEPENSES') return 'expenseId';
    if (canonical === 'TRESORERIE') return 'treasuryMonth';
    return 'orderNumber';
  }

  columnMapFor(board: string, suffix: 'MAP' | 'TITLE_MAP'): Record<string, string> {
    const raw = process.env[`MONDAY_COLUMN_${suffix}_${this.canonicalBoard(board)}`]?.trim();
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
      return Object.fromEntries(
        Object.entries(parsed)
          .filter(([, value]) => typeof value === 'string' && value.trim())
          .map(([source, target]) => [source, String(target).trim()]),
      );
    } catch {
      return {};
    }
  }
}
