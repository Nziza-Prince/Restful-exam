import { Injectable } from '@nestjs/common';
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

  async findByEmail(email: string): Promise<CustomerSnapshot | null> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<CustomerSnapshot>(
          `${this.baseUrl}/api/internal/customers/by-email/${encodeURIComponent(email)}`,
          { headers: this.headers },
        ),
      );
      return data;
    } catch {
      return null;
    }
  }

  async findById(id: string): Promise<CustomerSnapshot | null> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<CustomerSnapshot>(
          `${this.baseUrl}/api/internal/customers/${id}`,
          { headers: this.headers },
        ),
      );
      return data;
    } catch {
      return null;
    }
  }
}
