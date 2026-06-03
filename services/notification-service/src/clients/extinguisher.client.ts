import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ExtinguisherClient {
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

  async getExtinguishers(params: { createdBy?: string }): Promise<{ id: string }[]> {
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
