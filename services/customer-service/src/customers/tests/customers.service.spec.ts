import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthClient } from '../clients/auth.client';
import { CustomersRepository } from '../repositories/customers.repository';
import { CustomersService } from '../services/customers.service';
import { Customer } from '../entities/customer.entity';

const mockCustomer = (): Customer => ({
  id: 'cust-1',
  fullName: 'Alice Smith',
  nationalId: 'NID-001',
  phone: '0780000001',
  email: 'alice@example.com',
  address: 'Kigali',
  createdBy: 'admin-1',
  invitationTokenHash: null,
  invitationExpiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('CustomersService', () => {
  let service: CustomersService;
  let repo: jest.Mocked<CustomersRepository>;
  let authClient: jest.Mocked<AuthClient>;

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findPaginated: jest.fn(),
      findByInvitationTokenHash: jest.fn(),
      clearInvitationToken: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<CustomersRepository>;

    authClient = {
      createPendingUser: jest.fn().mockResolvedValue(undefined),
      deleteUser: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuthClient>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: CustomersRepository, useValue: repo },
        { provide: AuthClient, useValue: authClient },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: string) => fallback ?? null),
          },
        },
      ],
    }).compile();

    service = module.get(CustomersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('saves the customer and returns it', async () => {
      const customer = mockCustomer();
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockReturnValue(customer);
      repo.save.mockResolvedValue(customer);

      const result = await service.create(
        { fullName: 'Alice Smith', nationalId: 'NID-001', phone: '0780000001', email: 'alice@example.com', address: 'Kigali' },
        'admin-1',
      );

      expect(result).toEqual(customer);
      expect(repo.save).toHaveBeenCalled();
    });

    it('calls authClient.createPendingUser when admin creates a customer', async () => {
      const customer = mockCustomer();
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockReturnValue(customer);
      repo.save.mockResolvedValue(customer);

      await service.create(
        { fullName: 'Alice Smith', nationalId: 'NID-001', phone: '0780000001', email: 'alice@example.com', address: 'Kigali' },
        'admin-1',
      );

      // Allow fire-and-forget promises to settle
      await new Promise(setImmediate);
      expect(authClient.createPendingUser).toHaveBeenCalledWith('alice@example.com', 'Alice Smith');
    });

    it('does NOT call authClient.createPendingUser for self-registration (no createdBy)', async () => {
      const customer = { ...mockCustomer(), createdBy: null };
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockReturnValue(customer);
      repo.save.mockResolvedValue(customer);

      await service.create(
        { fullName: 'Alice Smith', nationalId: 'NID-001', phone: '0780000001', email: 'alice@example.com', address: 'Kigali' },
      );

      await new Promise(setImmediate);
      expect(authClient.createPendingUser).not.toHaveBeenCalled();
    });

    it('throws ConflictException when email already exists', async () => {
      repo.findByEmail.mockResolvedValue(mockCustomer());

      await expect(
        service.create({ fullName: 'Alice', nationalId: 'NID-001', phone: '0780000001', email: 'alice@example.com', address: 'Kigali' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('removes the customer and calls authClient.deleteUser', async () => {
      const customer = mockCustomer();
      repo.findById.mockResolvedValue(customer);
      repo.remove.mockResolvedValue(customer);

      await service.remove('cust-1');

      expect(repo.remove).toHaveBeenCalledWith(customer);
      await new Promise(setImmediate);
      expect(authClient.deleteUser).toHaveBeenCalledWith('alice@example.com');
    });

    it('throws NotFoundException when customer does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrow(NotFoundException);
      expect(authClient.deleteUser).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('returns the customer', async () => {
      const customer = mockCustomer();
      repo.findById.mockResolvedValue(customer);

      await expect(service.findById('cust-1')).resolves.toEqual(customer);
    });

    it('throws NotFoundException when not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
