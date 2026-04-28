import { IsIn, IsString, Length } from 'class-validator';

export const profileVerificationActions = ['account', 'contacts', 'delete'] as const;

export type ProfileVerificationAction = (typeof profileVerificationActions)[number];

export class RequestProfileVerificationDto {
  @IsIn(profileVerificationActions)
  action!: ProfileVerificationAction;
}

export class VerifyProfileVerificationDto {
  @IsIn(profileVerificationActions)
  action!: ProfileVerificationAction;

  @IsString()
  @Length(6, 6)
  code!: string;
}
