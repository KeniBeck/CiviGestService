import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User, DocumentType, AccessLevel } from '@prisma/client';
import { Exclude } from 'class-transformer';

/**
 * Entity para Usuario
 * Excluye campos sensibles como password
 */
export class UserEntity implements User {
  @ApiProperty()
  id: number;

  @ApiProperty()
  sedeId: number;

  @ApiPropertyOptional()
  subsedeId: number | null;

  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @Exclude() // Ocultar password en responses
  password: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  phoneCountryCode: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiPropertyOptional()
  address: string | null;

  @ApiProperty({ enum: DocumentType })
  documentType: DocumentType;

  @ApiProperty()
  documentNumber: string;

  @ApiProperty()
  isEmailVerified: boolean;

  @ApiProperty()
  isPhoneVerified: boolean;

  @Exclude()
  passwordResetToken: string | null;

  @Exclude()
  passwordResetExpires: Date | null;

  @Exclude()
  otpRequestCount: number;

  @Exclude()
  lastOtpRequestAt: Date | null;

  @ApiPropertyOptional()
  lastLoginAt: Date | null;

  @ApiProperty({ enum: AccessLevel })
  accessLevel: AccessLevel;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  deletedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  createdBy: number | null;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
