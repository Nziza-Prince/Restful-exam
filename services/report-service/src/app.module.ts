import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { JwtPayloadStrategy } from '@fems/shared';
import { ComplianceClient } from './clients/compliance.client';
import { CustomerClient } from './clients/customer.client';
import { ExtinguisherClient } from './clients/extinguisher.client';
import { NotificationClient } from './clients/notification.client';
import { RenewalClient } from './clients/renewal.client';
import { ExportService } from './reports/export.service';
import { ReportsController } from './reports/reports.controller';
import { ReportsService } from './reports/reports.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule.register({ timeout: 15000 }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ExportService,
    ExtinguisherClient,
    CustomerClient,
    NotificationClient,
    ComplianceClient,
    RenewalClient,
    JwtPayloadStrategy,
  ],
})
export class AppModule {}
