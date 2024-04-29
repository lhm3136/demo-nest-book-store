import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  username: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  password: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  displayName?: string;

  @IsEmail()
  @IsOptional()
  @ValidateIf((o) => o?.email)
  email?: string;
}
