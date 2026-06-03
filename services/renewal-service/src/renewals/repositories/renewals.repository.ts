import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RenewalFilterOptions } from '../dtos/list-renewals-query.dto';
import { RenewalRequest } from '../entities/renewal-request.entity';

@Injectable()
export class RenewalsRepository {
  constructor(
    @InjectRepository(RenewalRequest)
    private readonly repo: Repository<RenewalRequest>,
  ) {}

  create(data: Partial<RenewalRequest>): RenewalRequest {
    return this.repo.create(data);
  }

  save(request: RenewalRequest): Promise<RenewalRequest> {
    return this.repo.save(request);
  }

  findById(id: string): Promise<RenewalRequest | null> {
    return this.repo.findOne({ where: { id } });
  }

  findPaginated(
    page: number,
    limit: number,
    filters: RenewalFilterOptions = {},
  ): Promise<[RenewalRequest[], number]> {
    const qb = this.repo
      .createQueryBuilder('r')
      .orderBy('r.createdAt', 'DESC');

    if (filters.status) {
      qb.andWhere('r.status = :status', { status: filters.status });
    }
    if (filters.requestType) {
      qb.andWhere('r.requestType = :requestType', {
        requestType: filters.requestType,
      });
    }
    if (filters.customerId) {
      qb.andWhere('r.customerId = :customerId', {
        customerId: filters.customerId,
      });
    }
    if (filters.extinguisherIds) {
      if (filters.extinguisherIds.length === 0) {
        qb.andWhere('1 = 0');
      } else {
        qb.andWhere('r.extinguisher_id IN (:...extinguisherIds)', {
          extinguisherIds: filters.extinguisherIds,
        });
      }
    }

    return qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }
}
