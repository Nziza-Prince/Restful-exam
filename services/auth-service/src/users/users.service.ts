import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { paginate, PaginatedResult, UserRole } from '@fems/shared';
import { Repository } from 'typeorm';
import { RegisterDto } from '../auth/dto/register.dto';
import { User } from '../entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async createCustomer(dto: RegisterDto): Promise<Omit<User, 'password'>> {
    const existing = await this.usersRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashed = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const role = dto.role === UserRole.INSPECTOR ? UserRole.INSPECTOR : UserRole.USER;
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const user = this.usersRepo.create({
      firstName,
      lastName,
      fullName,
      email: dto.email.toLowerCase(),
      password: hashed,
      role,
    });
    const saved = await this.usersRepo.save(user);

    if (role === UserRole.USER) {
      try {
        const customerServiceUrl = process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3002';
        const serviceKey = process.env.SERVICE_INTERNAL_KEY || 'dev-internal-service-key';
        await (globalThis as any).fetch(`${customerServiceUrl}/api/internal/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Service-Key': serviceKey,
          },
          body: JSON.stringify({
            fullName,
            email: dto.email.toLowerCase(),
            nationalId: `NAT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            phone: '0780000000',
            address: 'Kigali, Rwanda',
          }),
        });
      } catch (err) {
        console.error('Failed to sync customer profile on registration:', err);
      }
    }

    return this.sanitize(saved);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        password: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const duplicate = await this.usersRepo.findOne({
        where: { email: dto.email.toLowerCase() },
      });
      if (duplicate) throw new ConflictException('Email already registered');
      user.email = dto.email.toLowerCase();
    }

    if (dto.firstName !== undefined) user.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) user.lastName = dto.lastName.trim();
    user.fullName = `${user.firstName} ${user.lastName}`.trim() || user.fullName;

    return this.sanitize(await this.usersRepo.save(user));
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.usersRepo.findOne({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        password: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');
    if (await bcrypt.compare(dto.newPassword, user.password)) {
      throw new BadRequestException('New password must be different');
    }

    user.password = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.usersRepo.save(user);
    return { success: true };
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Omit<User, 'password'>>> {
    const [users, total] = await this.usersRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return paginate(
      users.map((u) => this.sanitize(u)),
      total,
      page,
      limit,
    );
  }

  async getProfile(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async createPending(email: string, fullName: string): Promise<void> {
    const existing = await this.usersRepo.findOne({
      where: { email: email.toLowerCase() },
    });
    if (existing) return;

    const randomPassword = randomBytes(32).toString('hex');
    const hashed = await bcrypt.hash(randomPassword, BCRYPT_ROUNDS);
    const user = this.usersRepo.create({
      firstName: fullName.trim().split(/\s+/)[0] ?? fullName.trim(),
      lastName: fullName.trim().split(/\s+/).slice(1).join(' ') || 'User',
      fullName: fullName.trim(),
      email: email.toLowerCase(),
      password: hashed,
      role: UserRole.USER,
    });
    await this.usersRepo.save(user);
  }

  async updatePassword(email: string, newPassword: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        password: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    return this.usersRepo.save(user);
  }

  async deleteByEmail(email: string): Promise<void> {
    const user = await this.usersRepo.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!user) return;
    await this.usersRepo.remove(user);
  }

  sanitize(user: User): Omit<User, 'password'> {
    const { password: _password, ...rest } = user;
    return rest;
  }
}
