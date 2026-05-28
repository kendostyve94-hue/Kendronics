import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsObject, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';

class RegisterProfileDto {
  @IsString()
  username!: string;

  @IsString()
  country!: string;

  @IsIn(['individual', 'student', 'startup', 'company'])
  accountType!: string;
}

export class RegisterDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(['email', 'phone'])
  contactMethod?: 'email' | 'phone';

  @IsString()
  @MinLength(10)
  password!: string;

  @IsString()
  fullName!: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RegisterProfileDto)
  profile?: RegisterProfileDto;
}
