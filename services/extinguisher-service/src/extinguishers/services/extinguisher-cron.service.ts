import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  NotificationClient,
  NotificationTriggerType,
} from '../../clients/service.clients';
import { ExtinguisherStatus } from '../entities/extinguisher-status.enum';
import { FireExtinguisher } from '../entities/fire-extinguisher.entity';
import {
  computeExtinguisherStatus,
  daysUntilExpiry,
  ExtinguishersService,
} from './extinguishers.service';

const THRESHOLD_DAYS: Array<{ days: number; type: NotificationTriggerType }> =
  [
    { days: 90, type: 'EXPIRY_90' },
    { days: 60, type: 'EXPIRY_60' },
    { days: 30, type: 'EXPIRY_30' },
    { days: 7, type: 'EXPIRY_7' },
    { days: 0, type: 'EXPIRY_0' },
  ];

@Injectable()
export class ExtinguisherCronService {
  private readonly logger = new Logger(ExtinguisherCronService.name);

  constructor(
    private readonly extinguishersService: ExtinguishersService,
    private readonly notificationClient: NotificationClient,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyStatusUpdate(): Promise<void> {
    this.logger.log('Running daily extinguisher status update');
    const extinguishers = await this.extinguishersService.findAllForCron();
    const toSave: FireExtinguisher[] = [];

    for (const extinguisher of extinguishers) {
      const nextStatus = computeExtinguisherStatus(extinguisher.expiryDate);
      if (extinguisher.status !== nextStatus) {
        extinguisher.status = nextStatus;
        toSave.push(extinguisher);
      }

      await this.triggerThresholdNotifications(extinguisher);
    }

    if (toSave.length) {
      await this.extinguishersService.saveMany(toSave);
      this.logger.log(`Updated status for ${toSave.length} extinguisher(s)`);
    }
  }

  private async triggerThresholdNotifications(
    extinguisher: FireExtinguisher,
  ): Promise<void> {
    const days = daysUntilExpiry(extinguisher.expiryDate);

    for (const threshold of THRESHOLD_DAYS) {
      if (days !== threshold.days) {
        continue;
      }

      if (!extinguisher.customerId) {
        continue;
      }

      const message = this.buildNotificationMessage(
        extinguisher,
        threshold.type,
        days,
      );

      await this.notificationClient.triggerNotification({
        customerId: extinguisher.customerId,
        extinguisherId: extinguisher.id,
        type: threshold.type,
        message,
      });
    }
  }

  private buildNotificationMessage(
    extinguisher: FireExtinguisher,
    type: NotificationTriggerType,
    days: number,
  ): string {
    if (type === 'EXPIRY_0' || days <= 0) {
      return `Fire extinguisher ${extinguisher.serialNumber} has expired. Please schedule renewal immediately.`;
    }

    return `Fire extinguisher ${extinguisher.serialNumber} expires in ${days} day(s). Current status: ${extinguisher.status ?? ExtinguisherStatus.ACTIVE}.`;
  }
}
