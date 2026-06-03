import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateSettingDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  value: Record<string, unknown>;
}
