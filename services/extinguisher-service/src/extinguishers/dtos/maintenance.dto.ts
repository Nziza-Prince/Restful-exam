import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, MaxLength, MinLength } from 'class-validator';

export class LogMaintenanceDto {
  @ApiProperty({ example: 'Replaced pressure gauge and resealed cylinder' })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  actionsTaken: string;

  @ApiProperty({ example: '2026-06-03' })
  @IsDateString()
  actionDate: string;

  @ApiProperty({ example: 'Pressure was below acceptable range' })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  conditionsNoted: string;
}
