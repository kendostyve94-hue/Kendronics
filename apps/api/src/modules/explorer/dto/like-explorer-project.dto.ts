import { IsString, MaxLength, MinLength } from 'class-validator';

export class LikeExplorerProjectDto {
  @IsString()
  @MinLength(8)
  @MaxLength(120)
  actorKey!: string;
}
