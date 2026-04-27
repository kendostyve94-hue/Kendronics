import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export const supportTicketCategories = [
  'quote_issue',
  'upload_issue',
  'payment_issue',
  'delivery_issue',
  'technical_question',
  'partnership',
] as const;

export type SupportTicketCategory = (typeof supportTicketCategories)[number];

export class CreateSupportTicketDto {
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsIn(supportTicketCategories)
  category?: SupportTicketCategory;

  @IsString()
  subject!: string;

  @IsString()
  @MinLength(10)
  message!: string;
}

export class CreatePublicSupportTicketDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsIn(supportTicketCategories)
  category!: SupportTicketCategory;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsString()
  @MinLength(10)
  message!: string;

  @IsOptional()
  @IsString()
  attachmentName?: string;
}
