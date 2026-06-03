import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UsersService } from '../users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

const mockUser = (): User => ({
  id: 'user-1',
  firstName: 'Alice',
  lastName: 'Smith',
  fullName: 'Alice Smith',
  email: 'alice@example.com',
  password: 'hashed',
  role: 'user' as never,
  refreshTokens: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      findAndCount: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createPending', () => {
    it('creates a user with a random password when user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(mockUser());
      repo.save.mockResolvedValue(mockUser());

      await service.createPending('alice@example.com', 'Alice Smith');

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'alice@example.com', fullName: 'Alice Smith' }),
      );
      expect(repo.save).toHaveBeenCalled();
    });

    it('is a no-op when user already exists', async () => {
      repo.findOne.mockResolvedValue(mockUser());

      await service.createPending('alice@example.com', 'Alice Smith');

      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('lowercases the email', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(mockUser());
      repo.save.mockResolvedValue(mockUser());

      await service.createPending('ALICE@EXAMPLE.COM', 'Alice Smith');

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'alice@example.com' }),
      );
    });
  });

  describe('updatePassword', () => {
    it('hashes and saves the new password', async () => {
      const user = mockUser();
      repo.findOne.mockResolvedValue(user);
      repo.save.mockResolvedValue({ ...user, password: 'hashed-password' });

      const result = await service.updatePassword('alice@example.com', 'NewPass123!');

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed-password' }),
      );
      expect(result.password).toBe('hashed-password');
    });

    it('throws NotFoundException when user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.updatePassword('nobody@example.com', 'pass'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteByEmail', () => {
    it('removes the user when found', async () => {
      const user = mockUser();
      repo.findOne.mockResolvedValue(user);
      repo.remove.mockResolvedValue(user);

      await service.deleteByEmail('alice@example.com');

      expect(repo.remove).toHaveBeenCalledWith(user);
    });

    it('is a no-op when user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await service.deleteByEmail('nobody@example.com');

      expect(repo.remove).not.toHaveBeenCalled();
    });
  });

  describe('createCustomer', () => {
    it('throws ConflictException when email already registered', async () => {
      repo.findOne.mockResolvedValue(mockUser());

      await expect(
        service.createCustomer({ fullName: 'Alice', email: 'alice@example.com', password: 'pass' } as never),
      ).rejects.toThrow(ConflictException);
    });
  });
});
