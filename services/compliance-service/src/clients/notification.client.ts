import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotificationClient {
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

  async trigger(payload: {
    customerId: string;
    extinguisherId: string;
    type: string;
    message: string;
    recipientEmail?: string;
  }) {
    const { data } = await firstValueFrom(
      this.http.post(`${this.baseUrl}/api/internal/notifications/trigger`, payload, {
        headers: this.headers,
      }),
    );
    return data;
  }
}
