import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../../audit/audit.service';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { User } from '../../entities/user.entity';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashed'),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let refreshRepo: jest.Mocked<Repository<RefreshToken>>;

  const mockUser: User = {
    id: 'user-1',
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    email: 'test@example.com',
    password: 'hashed',
    role: 'user' as never,
    refreshTokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      createCustomer: jest.fn(),
      updatePassword: jest.fn(),
      sanitize: jest.fn((u) => {
        const { password, ...rest } = u;
        return rest;
      }),
    } as unknown as jest.Mocked<UsersService>;

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    } as unknown as jest.Mocked<JwtService>;

    refreshRepo = {
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: 'rt-1', ...data })),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<RefreshToken>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(7) },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn().mockResolvedValue(undefined) },
        },
        { provide: getRepositoryToken(RefreshToken), useValue: refreshRepo },
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('login returns tokens for valid credentials', async () => {
    usersService.findByEmail.mockResolvedValue(mockUser);

    const result = await authService.login({
      email: 'test@example.com',
      password: 'password',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
  });

  it('login throws for invalid email', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'bad@example.com', password: 'x' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('login throws for invalid password', async () => {
    usersService.findByEmail.mockResolvedValue(mockUser);
    const bcrypt = jest.requireMock('bcrypt');
    bcrypt.compare.mockResolvedValueOnce(false);

    await expect(
      authService.login({ email: 'test@example.com', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('register creates customer and returns tokens', async () => {
    usersService.createCustomer.mockResolvedValue(
      usersService.sanitize(mockUser),
    );

    const result = await authService.register({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'SecurePass123!',
    });

    expect(result.accessToken).toBe('access-token');
    expect(usersService.createCustomer).toHaveBeenCalled();
  });

  describe('setupPassword', () => {
    const mockFetch = jest.fn();

    beforeEach(() => {
      (globalThis as unknown as { fetch: typeof fetch }).fetch = mockFetch;
    });

    afterEach(() => {
      mockFetch.mockReset();
    });

    it('creates a new user when no pending user exists', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'cust-1', email: 'test@example.com', fullName: 'Test User' }),
        })
        .mockResolvedValueOnce({ ok: true }); // mark-invitation-used

      usersService.findByEmail.mockResolvedValue(null);
      usersService.createCustomer.mockResolvedValue(usersService.sanitize(mockUser));

      const result = await authService.setupPassword({ token: 'raw-token', password: 'Pass123!' });

      expect(usersService.createCustomer).toHaveBeenCalled();
      expect(result.accessToken).toBe('access-token');
    });

    it('updates password for pre-created pending user instead of throwing conflict', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'cust-1', email: 'test@example.com', fullName: 'Test User' }),
        })
        .mockResolvedValueOnce({ ok: true }); // mark-invitation-used

      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.updatePassword.mockResolvedValue(mockUser);

      const result = await authService.setupPassword({ token: 'raw-token', password: 'NewPass123!' });

      expect(usersService.createCustomer).not.toHaveBeenCalled();
      expect(usersService.updatePassword).toHaveBeenCalledWith('test@example.com', 'NewPass123!');
      expect(result.accessToken).toBe('access-token');
    });

    it('throws UnauthorizedException for invalid token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid invitation link' }),
      });

      await expect(
        authService.setupPassword({ token: 'bad-token', password: 'Pass123!' }),
      ).rejects.toThrow('Invalid invitation link');
    });
  });
});
