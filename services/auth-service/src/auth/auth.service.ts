import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtPayload, UserRole } from '@fems/shared';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SetupPasswordDto } from './dto/setup-password.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.createCustomer(dto);
    const tokens = await this.issueTokenPair(user);
    await this.auditService.log({
      userId: user.id,
      action: 'REGISTER',
      entity: 'user',
      entityId: user.id,
    });
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const sanitized = this.usersService.sanitize(user);
    const tokens = await this.issueTokenPair(sanitized);
    await this.auditService.log({
      userId: user.id,
      action: 'LOGIN',
      entity: 'user',
      entityId: user.id,
    });
    return { user: sanitized, ...tokens };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const stored = await this.refreshRepo.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    stored.revokedAt = new Date();
    await this.refreshRepo.save(stored);

    const user = await this.usersService.findById(stored.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const sanitized = this.usersService.sanitize(user);
    const tokens = await this.issueTokenPair(sanitized);
    await this.auditService.log({
      userId: user.id,
      action: 'REFRESH',
      entity: 'refresh_token',
      entityId: stored.id,
    });
    return { user: sanitized, ...tokens };
  }

  async setupPassword(dto: SetupPasswordDto) {
    const customerUrl = this.config.get<string>('CUSTOMER_SERVICE_URL', 'http://localhost:3002');
    const serviceKey = this.config.get<string>('SERVICE_INTERNAL_KEY', 'dev-internal-service-key');

    // Validate the invitation token via customer-service
    const tokenRes = await (globalThis as unknown as { fetch: typeof fetch }).fetch(
      `${customerUrl}/api/internal/customers/by-invitation-token/${encodeURIComponent(dto.token)}`,
      { headers: { 'X-Service-Key': serviceKey } },
    );
    if (!tokenRes.ok) {
      const body = await tokenRes.json().catch(() => ({}));
      throw new UnauthorizedException((body as { message?: string }).message ?? 'Invalid or expired invitation link');
    }
    const customer = await tokenRes.json() as { id: string; email: string; fullName: string };

    // If a pending user was pre-created by the admin flow, update their password.
    // Otherwise create a fresh account.
    const existing = await this.usersService.findByEmail(customer.email);
    let user: Omit<User, 'password'>;
    if (existing) {
      const updated = await this.usersService.updatePassword(customer.email, dto.password);
      user = this.usersService.sanitize(updated);
    } else {
      user = await this.usersService.createCustomer({
        fullName: customer.fullName,
        email: customer.email,
        password: dto.password,
        role: UserRole.CUSTOMER,
      } as RegisterDto);
    }

    // Mark invitation as used so the link can't be reused
    await (globalThis as unknown as { fetch: typeof fetch }).fetch(
      `${customerUrl}/api/internal/customers/${customer.id}/mark-invitation-used`,
      { method: 'PATCH', headers: { 'X-Service-Key': serviceKey } },
    ).catch(() => {}); // Fire-and-forget; don't fail if this errors

    const tokens = await this.issueTokenPair(user);
    await this.auditService.log({ userId: user.id, action: 'SETUP_PASSWORD', entity: 'user', entityId: user.id });
    return { user, ...tokens };
  }

  async logout(refreshToken: string, userId?: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const stored = await this.refreshRepo.findOne({ where: { tokenHash } });

    if (stored && !stored.revokedAt) {
      stored.revokedAt = new Date();
      await this.refreshRepo.save(stored);
      await this.auditService.log({
        userId: stored.userId,
        action: 'LOGOUT',
        entity: 'refresh_token',
        entityId: stored.id,
      });
    } else if (userId) {
      await this.auditService.log({
        userId,
        action: 'LOGOUT',
        entity: 'user',
        entityId: userId,
      });
    }

    return { success: true };
  }

  private async issueTokenPair(user: Omit<User, 'password'>) {
    const accessToken = await this.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await this.createRefreshToken(user.id);
    return { accessToken, refreshToken };
  }

  private signAccessToken(payload: JwtPayload) {
    return this.jwtService.signAsync(payload);
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const raw = randomBytes(48).toString('base64url');
    const tokenHash = this.hashRefreshToken(raw);
    const days = this.config.get<number>('REFRESH_TOKEN_EXPIRES_DAYS', 7);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const entity = this.refreshRepo.create({
      userId,
      tokenHash,
      expiresAt,
      revokedAt: null,
    });
    await this.refreshRepo.save(entity);
    return raw;
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
