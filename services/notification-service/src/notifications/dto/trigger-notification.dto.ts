import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel } from '../../enums/notification-channel.enum';
import { NotificationType } from '../../enums/notification-type.enum';

export class TriggerNotificationDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @IsUUID()
  extinguisherId: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional({ enum: NotificationChannel, default: NotificationChannel.EMAIL })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipientPhone?: string;
}
