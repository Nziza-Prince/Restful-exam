import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ComplianceClient {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private get headers() {
    return { 'X-Service-Key': this.config.get<string>('SERVICE_INTERNAL_KEY', '') };
  }

  private get baseUrl() {
    return this.config.get<string>('COMPLIANCE_SERVICE_URL', 'http://localhost:3006');
  }

  async getCases(params: Record<string, string | undefined>) {
    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/api/internal/compliance/report`, {
        headers: this.headers,
        params,
      }),
    );
    return this.extractRows(data);
  }

  private extractRows(data: unknown): Record<string, unknown>[] {
    if (Array.isArray(data)) return data as Record<string, unknown>[];
    if (data && typeof data === 'object' && 'data' in data) {
      const inner = (data as { data: unknown }).data;
      return Array.isArray(inner) ? (inner as Record<string, unknown>[]) : [];
    }
    return [];
  }
}
