import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { paginate, PaginatedResult } from '@fems/shared';
import { Customer } from '../entities/customer.entity';
import { CreateCustomerDto } from '../dtos/create-customer.dto';
import { UpdateCustomerDto } from '../dtos/update-customer.dto';
import { CustomersRepository } from '../repositories/customers.repository';
import { AuthClient } from '../clients/auth.client';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    private readonly customersRepo: CustomersRepository,
    private readonly config: ConfigService,
    private readonly authClient: AuthClient,
  ) {}

  async create(dto: CreateCustomerDto, createdBy?: string): Promise<Customer> {
    const email = dto.email.toLowerCase();
    const existing = await this.customersRepo.findByEmail(email);
    if (existing) {
      throw new ConflictException('Customer with this email already exists');
    }

    const customer = this.customersRepo.create({
      ...dto,
      email,
      createdBy: createdBy || null,
      invitationTokenHash: null,
      invitationExpiresAt: null,
    });
    const saved = await this.customersRepo.save(customer);

    if (createdBy) {
      // Pre-create a pending user account in the auth service so both records are in sync
      this.authClient.createPendingUser(email, dto.fullName).catch((err) =>
        this.logger.error(`Failed to create pending user for ${email}: ${err.message}`),
      );
      // Send invitation email so the customer can set their password
      this.sendInvitationEmail(saved).catch((err) =>
        this.logger.error(`Failed to send invitation email to ${email}: ${err.message}`),
      );
    }

    return saved;
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
    createdBy?: string,
  ): Promise<PaginatedResult<Customer>> {
    const [data, total] = await this.customersRepo.findPaginated(
      page,
      limit,
      search,
      createdBy,
    );
    return paginate(data, total, page, limit);
  }

  async findById(id: string): Promise<Customer> {
    const customer = await this.customersRepo.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async findByEmail(email: string): Promise<Customer> {
    const customer = await this.customersRepo.findByEmail(email);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async findMe(email: string): Promise<Customer> {
    return this.findByEmail(email);
  }

  async findByInvitationToken(rawToken: string): Promise<Customer> {
    const hash = createHash('sha256').update(rawToken).digest('hex');
    const customer = await this.customersRepo.findByInvitationTokenHash(hash);
    if (!customer) {
      throw new NotFoundException('Invalid invitation link');
    }
    if (!customer.invitationExpiresAt || customer.invitationExpiresAt < new Date()) {
      throw new BadRequestException('Invitation link has expired. Please ask your admin to resend it.');
    }
    return customer;
  }

  async markInvitationUsed(id: string): Promise<void> {
    await this.customersRepo.clearInvitationToken(id);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findById(id);

    if (dto.email && dto.email.toLowerCase() !== customer.email) {
      const duplicate = await this.customersRepo.findByEmail(dto.email);
      if (duplicate) {
        throw new ConflictException('Customer with this email already exists');
      }
      customer.email = dto.email.toLowerCase();
    }

    if (dto.fullName !== undefined) customer.fullName = dto.fullName;
    if (dto.nationalId !== undefined) customer.nationalId = dto.nationalId;
    if (dto.phone !== undefined) customer.phone = dto.phone;
    if (dto.address !== undefined) customer.address = dto.address;

    return this.customersRepo.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findById(id);
    // Delete the corresponding user account in the auth service to keep both in sync
    this.authClient.deleteUser(customer.email).catch((err) =>
      this.logger.error(`Failed to delete user for ${customer.email}: ${err.message}`),
    );
    await this.customersRepo.remove(customer);
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async sendInvitationEmail(customer: Customer): Promise<void> {
    // Generate a secure random token
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    // Store hashed token
    customer.invitationTokenHash = tokenHash;
    customer.invitationExpiresAt = expiresAt;
    await this.customersRepo.save(customer);

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const notificationUrl = this.config.get<string>('NOTIFICATION_SERVICE_URL', 'http://localhost:3004');
    const serviceKey = this.config.get<string>('SERVICE_INTERNAL_KEY', 'dev-internal-service-key');

    const setupLink = `${frontendUrl}/set-password?token=${rawToken}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Outfit, Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7;">
    <div style="background: #b45309; padding: 24px 32px;">
      <p style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 0;">FEMS</p>
      <p style="color: #fef3c7; font-size: 12px; margin: 4px 0 0;">Fire Extinguisher Management System</p>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #18181b; font-size: 20px; margin: 0 0 8px;">Welcome, ${customer.fullName}</h2>
      <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        Your account has been created by your administrator. To access the Fire Extinguisher Management System,
        you need to set a password for your account.
      </p>
      <a href="${setupLink}" style="display: inline-block; background: #b45309; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        Set My Password
      </a>
      <p style="color: #a1a1aa; font-size: 12px; margin: 24px 0 0;">
        This link expires in 72 hours. If you did not expect this email, you can safely ignore it.
      </p>
      <p style="color: #a1a1aa; font-size: 11px; margin: 8px 0 0; word-break: break-all;">
        If the button above does not work, copy and paste this link: ${setupLink}
      </p>
    </div>
    <div style="background: #f9fafb; padding: 16px 32px; border-top: 1px solid #e4e4e7;">
      <p style="color: #a1a1aa; font-size: 11px; margin: 0;">
        FEMS &mdash; Fire Extinguisher Management System &mdash; Confidential
      </p>
    </div>
  </div>
</body>
</html>`;

    const text = `Welcome to FEMS, ${customer.fullName}!\n\nYour account has been created. Set your password here:\n${setupLink}\n\nThis link expires in 72 hours.`;

    await (globalThis as unknown as { fetch: typeof fetch }).fetch(
      `${notificationUrl}/api/internal/notifications/email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Key': serviceKey,
        },
        body: JSON.stringify({
          to: customer.email,
          subject: 'FEMS — Set Your Account Password',
          text,
          html,
        }),
      },
    );

    this.logger.log(`Invitation email sent to ${customer.email}`);
  }
}
