import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtinguisherFilterOptions } from '../dtos/list-extinguishers-query.dto';
import { FireExtinguisher } from '../entities/fire-extinguisher.entity';

@Injectable()
export class ExtinguishersRepository {
  constructor(
    @InjectRepository(FireExtinguisher)
    private readonly repo: Repository<FireExtinguisher>,
  ) {}

  create(data: Partial<FireExtinguisher>): FireExtinguisher {
    return this.repo.create(data);
  }

  save(extinguisher: FireExtinguisher): Promise<FireExtinguisher> {
    return this.repo.save(extinguisher);
  }

  saveMany(extinguishers: FireExtinguisher[]): Promise<FireExtinguisher[]> {
    return this.repo.save(extinguishers);
  }

  findById(id: string): Promise<FireExtinguisher | null> {
    return this.repo.findOne({ where: { id } });
  }

  findBySerialNumber(serialNumber: string): Promise<FireExtinguisher | null> {
    return this.repo.findOne({ where: { serialNumber } });
  }

  findAll(): Promise<FireExtinguisher[]> {
    return this.repo.find();
  }

  findPaginated(
    page: number,
    limit: number,
    filters: ExtinguisherFilterOptions = {},
  ): Promise<[FireExtinguisher[], number]> {
    const qb = this.repo
      .createQueryBuilder('e')
      .orderBy('e.expiryDate', 'ASC');

    if (filters.status) {
      qb.andWhere('e.status = :status', { status: filters.status });
    }
    if (filters.customerId) {
      qb.andWhere('e.customerId = :customerId', {
        customerId: filters.customerId,
      });
    }
    if (filters.createdBy) {
      qb.andWhere('e.createdBy = :createdBy', {
        createdBy: filters.createdBy,
      });
    }
    if (filters.onlyAvailable === true || filters.onlyAvailable === 'true') {
      qb.andWhere('e.customerId IS NULL');
    }
    if (filters.expiryFrom) {
      qb.andWhere('e.expiryDate >= :expiryFrom', {
        expiryFrom: filters.expiryFrom,
      });
    }
    if (filters.expiryTo) {
      qb.andWhere('e.expiryDate <= :expiryTo', {
        expiryTo: filters.expiryTo,
      });
    }
    if (filters.search?.trim()) {
      qb.andWhere('e.serialNumber ILIKE :search', {
        search: `%${filters.search.trim()}%`,
      });
    }

    return qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  remove(extinguisher: FireExtinguisher): Promise<FireExtinguisher> {
    return this.repo.remove(extinguisher);
  }
}
