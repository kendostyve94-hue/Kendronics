import { IsIn, IsInt, IsString, Min } from 'class-validator';

export class PresignUploadDto {
  @IsString()
  filename!: string;

  @IsIn(['application/zip', 'application/x-zip-compressed'])
  mimeType!: string;

  @IsInt()
  @Min(1)
  fileSizeBytes!: number;
}
