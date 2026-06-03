import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@fems/shared';
import { IsOptional, IsString } from 'class-validator';

export class ListCustomersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by name, email, phone, or national ID' })
  @IsOptional()
  @IsString()
  search?: string;
}
