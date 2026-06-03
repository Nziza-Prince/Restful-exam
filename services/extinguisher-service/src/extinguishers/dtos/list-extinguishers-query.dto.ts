import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@fems/shared';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ExtinguisherStatus } from '../entities/extinguisher-status.enum';

export class ListExtinguishersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ExtinguisherStatus })
  @IsOptional()
  @IsEnum(ExtinguisherStatus)
  status?: ExtinguisherStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  expiryFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  expiryTo?: string;

  @ApiPropertyOptional({ description: 'Search by serial number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  onlyAvailable?: boolean | string;
}

export class ListMineExtinguishersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ExtinguisherStatus })
  @IsOptional()
  @IsEnum(ExtinguisherStatus)
  status?: ExtinguisherStatus;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  expiryFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  expiryTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export interface ExtinguisherFilterOptions {
  status?: ExtinguisherStatus;
  customerId?: string;
  expiryFrom?: string;
  expiryTo?: string;
  search?: string;
  createdBy?: string;
  onlyAvailable?: boolean | string;
}
