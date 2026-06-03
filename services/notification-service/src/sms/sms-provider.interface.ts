export interface SmsSendResult {
  delivered: boolean;
  mock: boolean;
  messageId?: string;
}

export interface SmsProvider {
  send(to: string, message: string): Promise<SmsSendResult>;
}

export const SMS_PROVIDER = Symbol('SMS_PROVIDER');
