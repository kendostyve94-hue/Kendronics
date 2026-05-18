import { IsString, Length } from 'class-validator';

export class DeleteAccountDto {
  @IsString()
  @Length(6, 6)
  code!: string;
}
