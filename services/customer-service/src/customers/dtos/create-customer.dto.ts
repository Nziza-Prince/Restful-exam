import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ example: 'NAT-123456789' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nationalId: string;

  @ApiProperty({ example: '0788123456', description: 'Exactly 10 digits, no spaces or dashes' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'Phone must be exactly 10 digits (no spaces, dashes, or country code)' })
  phone: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: '123 Main Street, Kigali' })
  @IsString()
  @IsNotEmpty()
  address: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationalId?: string;

  @ApiPropertyOptional({ description: 'Exactly 10 digits' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'Phone must be exactly 10 digits (no spaces, dashes, or country code)' })
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;
}
