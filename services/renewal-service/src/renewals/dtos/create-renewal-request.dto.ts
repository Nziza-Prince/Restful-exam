import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  RenewalRequestStatus,
  RenewalRequestType,
} from '../entities/renewal.enums';

export class CreateRenewalRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  extinguisherId: string;

  @ApiProperty({ enum: RenewalRequestType })
  @IsEnum(RenewalRequestType)
  requestType: RenewalRequestType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CompleteRenewalRequestDto {
  @ApiProperty({ example: '2027-06-01' })
  @IsDateString()
  newExpiryDate: string;
}

export class RejectRenewalRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ListRenewalsQueryDto {
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
