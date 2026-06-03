import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ExtinguisherStatus } from '../entities/extinguisher-status.enum';

export class CreateExtinguisherDto {
  @ApiProperty({ example: 'FE-2024-001234' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serialNumber: string;

  @ApiProperty({ example: 'ABC Dry Chemical' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  type: string;

  @ApiProperty({ example: '6kg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  capacity: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  purchaseDate: string;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  expiryDate: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string | null;
}

export class UpdateExtinguisherDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  capacity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ enum: ExtinguisherStatus })
  @IsOptional()
  @IsEnum(ExtinguisherStatus)
  status?: ExtinguisherStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}

export class RenewExtinguisherDto {
  @ApiProperty({ example: '2027-01-15' })
  @IsDateString()
  expiryDate: string;
}
