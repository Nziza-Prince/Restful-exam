import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface CustomerSnapshot {
  id: string;
  email: string;
  fullName: string;
}

@Injectable()
export class CustomerClient {
  private readonly logger = new Logger(CustomerClient.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private get headers() {
    return {
      'X-Service-Key': this.config.get<string>('SERVICE_INTERNAL_KEY', ''),
    };
  }

  private get baseUrl() {
    return this.config.get<string>(
      'CUSTOMER_SERVICE_URL',
      'http://localhost:3002',
    );
  }

  async findByEmail(email: string): Promise<CustomerSnapshot> {
    const { data } = await firstValueFrom(
      this.http.get<CustomerSnapshot>(
        `${this.baseUrl}/api/internal/customers/by-email/${encodeURIComponent(email)}`,
        { headers: this.headers },
      ),
    );
    return data;
  }
}

export type NotificationTriggerType =
  | 'EXPIRY_90'
  | 'EXPIRY_60'
  | 'EXPIRY_30'
  | 'EXPIRY_7'
  | 'EXPIRY_0'
  | 'ASSIGNED'
  | 'INSPECTION_SCHEDULED';

export interface TriggerNotificationPayload {
  customerId: string;
  extinguisherId: string;
  type: NotificationTriggerType;
  message: string;
}

@Injectable()
export class NotificationClient {
  private readonly logger = new Logger(NotificationClient.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private get headers() {
    return {
      'X-Service-Key': this.config.get<string>('SERVICE_INTERNAL_KEY', ''),
    };
  }

  private get baseUrl() {
    return this.config.get<string>(
      'NOTIFICATION_SERVICE_URL',
      'http://localhost:3004',
    );
  }

  async triggerNotification(payload: TriggerNotificationPayload): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/api/internal/notifications/trigger`,
          payload,
          { headers: this.headers },
        ),
      );
    } catch (error) {
      this.logger.warn(
        `Failed to trigger notification for extinguisher ${payload.extinguisherId}: ${(error as Error).message}`,
      );
    }
  }
}
