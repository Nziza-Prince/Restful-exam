import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { InspectionStatus } from '../entities/extinguisher-inspection.entity';

export class ScheduleInspectionDto {
  @ApiProperty({ example: '2026-06-20T09:00:00.000Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  inspectorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateInspectionDto {
  @ApiPropertyOptional({ enum: InspectionStatus })
  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  inspectorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class SubmitInspectionReportDto {
  @ApiProperty({ example: 'Cylinder body is intact, pressure gauge is within operating range' })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  condition: string;

  @ApiPropertyOptional({ example: 'Unit is accessible and signage is visible' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({ example: 'Checked pressure, verified pin and seal, cleaned nozzle' })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  actionsTaken: string;

  @ApiProperty({ example: 'PASS' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  result: string;

  @ApiProperty({ example: '2026-06-03' })
  @IsDateString()
  inspectionDate: string;
}

export class AdminReviewInspectionDto {
  @ApiProperty({ enum: [InspectionStatus.APPROVED, InspectionStatus.REJECTED, InspectionStatus.REQUIRES_MAINTENANCE] })
  @IsEnum(InspectionStatus)
  status: InspectionStatus.APPROVED | InspectionStatus.REJECTED | InspectionStatus.REQUIRES_MAINTENANCE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
