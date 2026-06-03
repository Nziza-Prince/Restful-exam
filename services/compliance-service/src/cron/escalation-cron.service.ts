import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExtinguisherClient } from '../clients/extinguisher.client';
import { NotificationClient } from '../clients/notification.client';
import { ComplianceService } from '../compliance/compliance.service';
import { CaseStatus } from '../enums/case-status.enum';

@Injectable()
export class EscalationCronService {
  private readonly logger = new Logger(EscalationCronService.name);

  constructor(
    private readonly extinguisherClient: ExtinguisherClient,
    private readonly notificationClient: NotificationClient,
    private readonly complianceService: ComplianceService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async scanDay60Escalations() {
    this.logger.log('Running daily day-60 compliance escalation scan');
    try {
      const expiring = await this.extinguisherClient.getExpiringWithinDays(60);
      const day60Items = expiring.filter((e) => e.daysUntilExpiry <= 60);

      for (const item of day60Items) {
        await this.complianceService.escalate({
          customerId: item.customerId,
          extinguisherId: item.id,
          targetStatus: CaseStatus.WARNING_SENT,
          notes: `Auto-escalation: extinguisher ${item.serialNumber} within 60 days of expiry`,
        });

        await this.notificationClient.trigger({
          customerId: item.customerId,
          extinguisherId: item.id,
          type: 'EXPIRY_60',
          message: `Compliance warning: extinguisher ${item.serialNumber} expires in ${item.daysUntilExpiry} days.`,
        });
      }

      this.logger.log(`Processed ${day60Items.length} day-60 escalations`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Escalation scan failed: ${message}`);
    }
  }
}
