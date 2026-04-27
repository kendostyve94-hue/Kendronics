import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsObject, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';

class RegisterProfileDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  country!: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsIn(['individual', 'student', 'startup', 'company'])
  accountType!: string;
}

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  password!: string;

  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RegisterProfileDto)
  profile?: RegisterProfileDto;
}
