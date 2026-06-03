import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ServiceAuthGuard } from '@fems/shared';
import { EmailService } from '../email/email.service';
import { TriggerNotificationDto } from '../notifications/dto/trigger-notification.dto';
import { NotificationEngineService } from '../notifications/notification-engine.service';

export class SendDirectEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  subject: string;

  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  html?: string;
}

@ApiTags('internal')
@Controller('internal/notifications')
@UseGuards(ServiceAuthGuard)
export class NotificationsInternalController {
  constructor(
    private readonly engine: NotificationEngineService,
    private readonly emailService: EmailService,
  ) {}

  @Post('trigger')
  trigger(@Body() dto: TriggerNotificationDto) {
    return this.engine.createIdempotent(dto);
  }

  /** Direct email send — no notification record created. Used by other services for transactional emails. */
  @Post('email')
  sendEmail(@Body() dto: SendDirectEmailDto) {
    return this.emailService.send({
      to: dto.to,
      subject: dto.subject,
      text: dto.text,
      html: dto.html,
    });
  }
}
