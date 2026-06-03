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
import { ExtinguisherClient } from './clients/extinguisher.client';
import { NotificationClient } from './clients/notification.client';
import { ComplianceController } from './compliance/compliance.controller';
import { ComplianceService } from './compliance/compliance.service';
import { EscalationCronService } from './cron/escalation-cron.service';
import { ComplianceCase } from './entities/compliance-case.entity';
import { ComplianceInternalController } from './internal/compliance-internal.controller';
import { ComplianceReportController } from './internal/compliance-report.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule.register({ timeout: 10000 }),
    ScheduleModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createTypeOrmConfig(config, [ComplianceCase]),
    }),
    TypeOrmModule.forFeature([ComplianceCase]),
  ],
  controllers: [
    ComplianceController,
    ComplianceInternalController,
    ComplianceReportController,
  ],
  providers: [
    ComplianceService,
    ExtinguisherClient,
    NotificationClient,
    EscalationCronService,
    JwtPayloadStrategy,
    ServiceAuthGuard,
  ],
})
export class AppModule {}
