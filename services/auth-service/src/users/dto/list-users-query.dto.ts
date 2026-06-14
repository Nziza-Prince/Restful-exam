import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@fems/shared';
import { IsOptional, IsString } from 'class-validator';

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by name, email, or role' })
  @IsOptional()
  @IsString()
  search?: string;
}
