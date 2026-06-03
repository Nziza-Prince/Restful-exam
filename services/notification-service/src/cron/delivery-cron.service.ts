import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationEngineService } from '../notifications/notification-engine.service';

@Injectable()
export class DeliveryCronService {
  private readonly logger = new Logger(DeliveryCronService.name);

  constructor(private readonly engine: NotificationEngineService) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async processPendingDeliveries() {
    this.logger.log('Running daily pending delivery processing');
    const count = await this.engine.processPendingDeliveries();
    this.logger.log(`Processed ${count} pending deliveries`);
  }
}
