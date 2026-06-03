import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignExtinguisherDto {
  @ApiProperty({ format: 'uuid', description: 'Customer to assign this extinguisher to' })
  @IsUUID()
  customerId: string;
}
