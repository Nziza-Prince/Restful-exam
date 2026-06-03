import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class CustomersRepository {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  create(data: Partial<Customer>): Customer {
    return this.repo.create(data);
  }

  save(customer: Customer): Promise<Customer> {
    return this.repo.save(customer);
  }

  findById(id: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<Customer | null> {
    return this.repo.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  findPaginated(
    page: number,
    limit: number,
    search?: string,
    createdBy?: string,
  ): Promise<[Customer[], number]> {
    const qb = this.repo
      .createQueryBuilder('c')
      .orderBy('c.createdAt', 'DESC');

    if (createdBy) {
      qb.andWhere('c.createdBy = :createdBy', { createdBy });
    }

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      qb.andWhere(
        '(c.fullName ILIKE :term OR c.email ILIKE :term OR c.phone ILIKE :term OR c.nationalId ILIKE :term)',
        { term },
      );
    }

    return qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  findByInvitationTokenHash(hash: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { invitationTokenHash: hash } });
  }

  clearInvitationToken(id: string): Promise<void> {
    return this.repo.update(id, { invitationTokenHash: null, invitationExpiresAt: null }).then(() => undefined);
  }

  remove(customer: Customer): Promise<Customer> {
    return this.repo.remove(customer);
  }
}
