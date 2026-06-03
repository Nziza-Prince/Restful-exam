import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerClient } from '../clients/customer.client';
import { NotificationDelivery } from '../entities/notification-delivery.entity';
import { Notification } from '../entities/notification.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationStatus } from '../enums/notification-status.enum';
import { EmailService } from '../email/email.service';
import { SMS_PROVIDER, SmsProvider } from '../sms/sms-provider.interface';
import { TriggerNotificationDto } from './dto/trigger-notification.dto';

@Injectable()
export class NotificationEngineService {
  private readonly logger = new Logger(NotificationEngineService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationDelivery)
    private readonly deliveryRepo: Repository<NotificationDelivery>,
    private readonly emailService: EmailService,
    @Inject(SMS_PROVIDER) private readonly smsProvider: SmsProvider,
    private readonly customerClient: CustomerClient,
  ) {}

  async createIdempotent(dto: TriggerNotificationDto): Promise<Notification> {
    const channel = dto.channel ?? NotificationChannel.EMAIL;

    const existing = await this.notificationRepo.findOne({
      where: {
        type: dto.type,
        extinguisherId: dto.extinguisherId,
        customerId: dto.customerId,
      },
    });

    if (existing) {
      this.logger.debug(
        `Notification already exists for type=${dto.type} extinguisher=${dto.extinguisherId}`,
      );
      return existing;
    }

    const notification = this.notificationRepo.create({
      customerId: dto.customerId,
      extinguisherId: dto.extinguisherId,
      message: dto.message,
      type: dto.type,
      channel,
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });

    const saved = await this.notificationRepo.save(notification);

    const delivery = this.deliveryRepo.create({
      notificationId: saved.id,
      channel,
      status: DeliveryStatus.SENT,
      sentAt: new Date(),
    });
    await this.deliveryRepo.save(delivery);

    await this.sendNotification(saved, dto, delivery.id);
    return saved;
  }

  async sendNotification(
    notification: Notification,
    dto: TriggerNotificationDto,
    deliveryId: string,
  ): Promise<void> {
    try {
      if (notification.channel === NotificationChannel.EMAIL) {
        // Use provided email or auto-resolve from customer service
        let recipientEmail = dto.recipientEmail;
        if (!recipientEmail && notification.customerId) {
          const customer = await this.customerClient.findById(notification.customerId);
          recipientEmail = customer?.email;
        }

        if (recipientEmail) {
          const result = await this.emailService.send({
            to: recipientEmail,
            subject: this.formatSubject(notification.type),
            text: notification.message,
          });
          await this.deliveryRepo.update(deliveryId, {
            status: result.delivered ? DeliveryStatus.DELIVERED : DeliveryStatus.FAILED,
            deliveredAt: result.delivered ? new Date() : undefined,
          });
        } else {
          this.logger.warn(
            `No recipient email for notification ${notification.id} — skipping delivery`,
          );
        }
      } else if (notification.channel === NotificationChannel.SMS && dto.recipientPhone) {
        const result = await this.smsProvider.send(dto.recipientPhone, notification.message);
        await this.deliveryRepo.update(deliveryId, {
          status: result.delivered ? DeliveryStatus.DELIVERED : DeliveryStatus.FAILED,
          deliveredAt: result.delivered ? new Date() : undefined,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Delivery failed for notification ${notification.id}: ${message}`);
      await this.deliveryRepo.update(deliveryId, {
        status: DeliveryStatus.FAILED,
        errorMessage: message,
      });
    }
  }

  async processPendingDeliveries(): Promise<number> {
    const pending = await this.deliveryRepo.find({
      where: { status: DeliveryStatus.SENT },
      relations: ['notification'],
      take: 100,
    });

    let processed = 0;
    for (const delivery of pending) {
      if (delivery.notification.channel === NotificationChannel.EMAIL) {
        // Resolve real customer email instead of placeholder
        let recipientEmail: string | undefined;
        if (delivery.notification.customerId) {
          const customer = await this.customerClient.findById(
            delivery.notification.customerId,
          );
          recipientEmail = customer?.email;
        }

        if (!recipientEmail) continue;

        const result = await this.emailService.send({
          to: recipientEmail,
          subject: this.formatSubject(delivery.notification.type),
          text: delivery.notification.message,
        });
        await this.deliveryRepo.update(delivery.id, {
          status: result.delivered ? DeliveryStatus.DELIVERED : DeliveryStatus.FAILED,
          deliveredAt: result.delivered ? new Date() : undefined,
        });
        processed++;
      }
    }
    return processed;
  }

  private formatSubject(type: string): string {
    const subjects: Record<string, string> = {
      ASSIGNED: 'FEMS — Fire Extinguisher Assigned to You',
      EXPIRY_90: 'FEMS — Extinguisher Expiring in 90 Days',
      EXPIRY_60: 'FEMS — Extinguisher Expiring in 60 Days',
      EXPIRY_30: 'FEMS — Extinguisher Expiring in 30 Days',
      EXPIRY_7: 'FEMS — Extinguisher Expiring in 7 Days',
      EXPIRY_0: 'FEMS — Extinguisher Has Expired',
      REMINDER_15: 'FEMS — Renewal Reminder (15 Days)',
      REMINDER_30: 'FEMS — Renewal Reminder (30 Days)',
      WARNING: 'FEMS — Safety Warning',
    };
    return subjects[type] ?? `FEMS Notification: ${type}`;
  }
}
