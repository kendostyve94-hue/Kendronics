import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export const accountDeletionReasons = [
  'unused',
  'not_found',
  'price_high',
  'shipping_customs_high',
  'delivery_slow',
  'process_complex',
  'bug',
  'quote_mismatch',
  'support_unsatisfied',
  'new_account',
  'privacy_security',
  'other',
] as const;

export const accountDeletionAlternatives = ['pause', 'unsubscribe', 'continue'] as const;

export class AccountDeletionFeedbackDto {
  @IsIn(accountDeletionReasons)
  reason!: (typeof accountDeletionReasons)[number];

  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  orderedBefore?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  improvementPriority?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  keepReason?: string;

  @IsOptional()
  @IsIn(accountDeletionAlternatives)
  alternative?: (typeof accountDeletionAlternatives)[number];
}
