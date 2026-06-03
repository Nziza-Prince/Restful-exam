import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthClient {
  private readonly logger = new Logger(AuthClient.name);

  constructor(private readonly config: ConfigService) {}

  async createPendingUser(email: string, fullName: string): Promise<void> {
    const url = this.config.get<string>('AUTH_SERVICE_URL', 'http://localhost:3001');
    const key = this.config.get<string>('SERVICE_INTERNAL_KEY', 'dev-internal-service-key');
    const res = await (globalThis as unknown as { fetch: typeof fetch }).fetch(
      `${url}/api/internal/users`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Service-Key': key },
        body: JSON.stringify({ email, fullName }),
      },
    );
    if (!res.ok) {
      this.logger.error(`createPendingUser failed for ${email}: HTTP ${res.status}`);
    }
  }

  async deleteUser(email: string): Promise<void> {
    const url = this.config.get<string>('AUTH_SERVICE_URL', 'http://localhost:3001');
    const key = this.config.get<string>('SERVICE_INTERNAL_KEY', 'dev-internal-service-key');
    const res = await (globalThis as unknown as { fetch: typeof fetch }).fetch(
      `${url}/api/internal/users/by-email/${encodeURIComponent(email)}`,
      {
        method: 'DELETE',
        headers: { 'X-Service-Key': key },
      },
    );
    if (!res.ok) {
      this.logger.error(`deleteUser failed for ${email}: HTTP ${res.status}`);
    }
  }
}
