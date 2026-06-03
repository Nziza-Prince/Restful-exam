import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly mockMode: boolean;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    this.fromAddress = this.config.get<string>('SMTP_FROM', 'noreply@fems.local');
    this.mockMode = !host;

    if (!this.mockMode) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('SMTP_PORT', 587),
        secure: this.config.get<number>('SMTP_PORT', 587) === 465,
        auth: {
          user: this.config.get<string>('SMTP_USER', ''),
          pass: this.config.get<string>('SMTP_PASS', ''),
        },
      });
      this.logger.log('EmailService initialized with SMTP');
    } else {
      this.logger.warn('SMTP not configured — EmailService running in mock mode');
    }
  }

  async send(options: SendEmailOptions): Promise<{ delivered: boolean; mock: boolean }> {
    if (this.mockMode || !this.transporter) {
      this.logger.log(
        `[MOCK EMAIL] to=${options.to} subject="${options.subject}" body="${options.text.slice(0, 80)}..."`,
      );
      return { delivered: true, mock: true };
    }

    await this.transporter.sendMail({
      from: this.fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html ?? options.text,
    });
    return { delivered: true, mock: false };
  }
}
