import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@fems/shared';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import {
  RenewalRequestStatus,
  RenewalRequestType,
} from '../entities/renewal.enums';

export class AdminListRenewalsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: RenewalRequestStatus })
  @IsOptional()
  @IsEnum(RenewalRequestStatus)
  status?: RenewalRequestStatus;

  @ApiPropertyOptional({ enum: RenewalRequestType })
  @IsOptional()
  @IsEnum(RenewalRequestType)
  requestType?: RenewalRequestType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}

export class CustomerListRenewalsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: RenewalRequestStatus })
  @IsOptional()
  @IsEnum(RenewalRequestStatus)
  status?: RenewalRequestStatus;
}

export interface RenewalFilterOptions {
  status?: RenewalRequestStatus;
  requestType?: RenewalRequestType;
  customerId?: string;
  extinguisherIds?: string[];
}
