import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  createTypeOrmConfig,
  JwtPayloadStrategy,
  ServiceAuthGuard,
} from '@fems/shared';
import { DeliveryCronService } from './cron/delivery-cron.service';
import { NotificationDelivery } from './entities/notification-delivery.entity';
import { Notification } from './entities/notification.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { EmailService } from './email/email.service';
import { CustomerClient } from './clients/customer.client';
import { ExtinguisherClient } from './clients/extinguisher.client';
import { NotificationsInternalController } from './internal/notifications-internal.controller';
import { NotificationsReportController } from './internal/notifications-report.controller';
import { NotificationEngineService } from './notifications/notification-engine.service';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { SettingsController } from './settings/settings.controller';
import { SettingsService } from './settings/settings.service';
import { MockSmsProvider } from './sms/mock-sms.provider';
import { SMS_PROVIDER } from './sms/sms-provider.interface';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    ScheduleModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createTypeOrmConfig(config, [Notification, NotificationDelivery, SystemSetting]),
    }),
    TypeOrmModule.forFeature([Notification, NotificationDelivery, SystemSetting]),
  ],
  controllers: [
    NotificationsController,
    NotificationsInternalController,
    NotificationsReportController,
    SettingsController,
  ],
  providers: [
    NotificationsService,
    NotificationEngineService,
    EmailService,
    CustomerClient,
    ExtinguisherClient,
    SettingsService,
    DeliveryCronService,
    JwtPayloadStrategy,
    ServiceAuthGuard,
    MockSmsProvider,
    { provide: SMS_PROVIDER, useExisting: MockSmsProvider },
  ],
})
export class AppModule {}
