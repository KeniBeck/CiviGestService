import { IsString, MinLength, IsOptional } from 'class-validator';

export class ChangePasswordDto {
  @IsOptional()
  @IsString()
  oldPassword?: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
