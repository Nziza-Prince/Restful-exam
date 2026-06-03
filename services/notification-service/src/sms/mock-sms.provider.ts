import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider, SmsSendResult } from './sms-provider.interface';

@Injectable()
export class MockSmsProvider implements SmsProvider {
  private readonly logger = new Logger(MockSmsProvider.name);

  async send(to: string, message: string): Promise<SmsSendResult> {
    this.logger.log(`[MOCK SMS] to=${to} message="${message.slice(0, 80)}..."`);
    return { delivered: true, mock: true, messageId: `mock-${Date.now()}` };
  }
}
