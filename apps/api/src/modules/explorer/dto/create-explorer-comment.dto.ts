import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateExplorerCommentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(600)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  authorName?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateExplorerCommentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(600)
  body!: string;
}
