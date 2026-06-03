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

@Injectable()
export class ExtinguisherClient {
  private readonly logger = new Logger(ExtinguisherClient.name);

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
      'EXTINGUISHER_SERVICE_URL',
      'http://localhost:3003',
    );
  }

  async renewExtinguisher(
    extinguisherId: string,
    expiryDate: string,
  ): Promise<void> {
    await firstValueFrom(
      this.http.patch(
        `${this.baseUrl}/api/internal/extinguishers/${extinguisherId}/renew`,
        { expiryDate },
        { headers: this.headers },
      ),
    );
  }

  async getExtinguishers(params: { createdBy?: string; customerId?: string }): Promise<{ id: string }[]> {
    const { data } = await firstValueFrom(
      this.http.get<{ id: string }[] | { data: { id: string }[] }>(
        `${this.baseUrl}/api/internal/extinguishers`,
        { headers: this.headers, params },
      ),
    );
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'data' in data) {
      return (data as { data: { id: string }[] }).data;
    }
    return [];
  }
}
