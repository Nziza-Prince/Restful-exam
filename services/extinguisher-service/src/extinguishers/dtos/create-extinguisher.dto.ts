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

export enum ExtinguisherType {
  WATER = 'Water',
  CO2 = 'CO2',
  FOAM = 'Foam',
  DRY_CHEMICAL = 'Dry Chemical',
}

export enum ExtinguisherSize {
  TWO_POINT_FIVE = '2.5lbs',
  FIVE = '5lbs',
  NINE = '9lbs',
  TWELVE = '12lbs',
}

export class CreateExtinguisherDto {
  @ApiProperty({ example: 'FE-2024-001234' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serialNumber: string;

  @ApiProperty({ enum: ExtinguisherType, example: ExtinguisherType.DRY_CHEMICAL })
  @IsEnum(ExtinguisherType)
  type: string;

  @ApiProperty({ example: 'Building A - Lobby' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  location: string;

  @ApiProperty({ enum: ExtinguisherSize, example: ExtinguisherSize.FIVE })
  @IsEnum(ExtinguisherSize)
  size: string;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  installationDate: string;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  expiryDate: string;

  @ApiPropertyOptional({ enum: ExtinguisherStatus })
  @IsOptional()
  @IsEnum(ExtinguisherStatus)
  status?: ExtinguisherStatus;

  @ApiPropertyOptional({ example: '5lbs', description: 'Legacy alias for size' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  capacity?: string;

  @ApiPropertyOptional({ example: '2026-01-15', description: 'Legacy alias for installationDate' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

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
  @IsEnum(ExtinguisherType)
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ enum: ExtinguisherSize })
  @IsOptional()
  @IsEnum(ExtinguisherSize)
  size?: string;

  @ApiPropertyOptional({ description: 'Legacy alias for size' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  capacity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  installationDate?: string;

  @ApiPropertyOptional({ description: 'Legacy alias for installationDate' })
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
