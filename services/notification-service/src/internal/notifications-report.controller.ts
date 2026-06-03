import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceAuthGuard } from '@fems/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { ListNotificationsQueryDto } from '../notifications/dto/list-notifications-query.dto';

@ApiTags('internal')
@Controller('internal/notifications')
@UseGuards(ServiceAuthGuard)
export class NotificationsReportController {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  @Get('report')
  async report(@Query() query: ListNotificationsQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 1000, 1000);
    const qb = this.notificationRepo.createQueryBuilder('n');

    if (query.customerId) {
      qb.andWhere('n.customer_id = :customerId', { customerId: query.customerId });
    }
    if (query.extinguisherId) {
      qb.andWhere('n.extinguisher_id = :extinguisherId', {
        extinguisherId: query.extinguisherId,
      });
    }
    if (query.status) {
      qb.andWhere('n.status = :status', { status: query.status });
    }
    if (query.type) {
      qb.andWhere('n.type = :type', { type: query.type });
    }

    qb.orderBy('n.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}
