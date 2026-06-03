import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { paginate, PaginatedResult, JwtPayload, UserRole } from '@fems/shared';
import { CreateRenewalRequestDto } from '../dtos/create-renewal-request.dto';
import { CompleteRenewalRequestDto } from '../dtos/complete-renewal-request.dto';
import { RejectRenewalRequestDto } from '../dtos/create-renewal-request.dto';
import { RenewalFilterOptions } from '../dtos/list-renewals-query.dto';
import { RenewalRequest } from '../entities/renewal-request.entity';
import { RenewalRequestStatus } from '../entities/renewal.enums';
import { RenewalsRepository } from '../repositories/renewals.repository';
import { ExtinguisherClient } from '../../clients/service.clients';

@Injectable()
export class RenewalsService {
  constructor(
    private readonly renewalsRepo: RenewalsRepository,
    private readonly extinguisherClient: ExtinguisherClient,
  ) {}

  async createForCustomer(
    customerId: string,
    dto: CreateRenewalRequestDto,
  ): Promise<RenewalRequest> {
    const myExts = await this.extinguisherClient.getExtinguishers({ customerId });
    const hasExt = myExts.some((e) => e.id === dto.extinguisherId);
    if (!hasExt) {
      throw new BadRequestException('Extinguisher does not belong to your account');
    }

    const request = this.renewalsRepo.create({
      customerId,
      extinguisherId: dto.extinguisherId,
      requestType: dto.requestType,
      description: dto.description ?? null,
      status: RenewalRequestStatus.PENDING,
    });
    return this.renewalsRepo.save(request);
  }

  async findAll(
    page: number,
    limit: number,
    filters: RenewalFilterOptions,
    user?: JwtPayload,
  ): Promise<PaginatedResult<RenewalRequest>> {
    let extinguisherIds: string[] | undefined = undefined;
    if (user && user.role === UserRole.ADMIN) {
      const extinguishers = await this.extinguisherClient.getExtinguishers({ createdBy: user.sub });
      extinguisherIds = extinguishers.map((e) => e.id);
    }

    const [data, total] = await this.renewalsRepo.findPaginated(
      page,
      limit,
      { ...filters, ...(extinguisherIds !== undefined ? { extinguisherIds } : {}) },
    );
    return paginate(data, total, page, limit);
  }

  async findMine(
    customerId: string,
    page: number,
    limit: number,
    status?: RenewalRequestStatus,
  ): Promise<PaginatedResult<RenewalRequest>> {
    return this.findAll(page, limit, { customerId, status });
  }

  async findById(id: string, user?: JwtPayload): Promise<RenewalRequest> {
    const request = await this.renewalsRepo.findById(id);
    if (!request) {
      throw new NotFoundException('Renewal request not found');
    }
    if (user && user.role === UserRole.ADMIN) {
      const extinguishers = await this.extinguisherClient.getExtinguishers({ createdBy: user.sub });
      const isOwner = extinguishers.some((e) => e.id === request.extinguisherId);
      if (!isOwner) {
        throw new NotFoundException('Renewal request not found');
      }
    }
    return request;
  }

  async approve(id: string, user?: JwtPayload): Promise<RenewalRequest> {
    const request = await this.findById(id, user);
    if (request.status !== RenewalRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be approved');
    }
    request.status = RenewalRequestStatus.APPROVED;
    return this.renewalsRepo.save(request);
  }

  async reject(
    id: string,
    dto: RejectRenewalRequestDto,
    user?: JwtPayload,
  ): Promise<RenewalRequest> {
    const request = await this.findById(id, user);
    if (request.status !== RenewalRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be rejected');
    }
    request.status = RenewalRequestStatus.REJECTED;
    if (dto.reason) {
      request.description = request.description
        ? `${request.description}\nRejection reason: ${dto.reason}`
        : `Rejection reason: ${dto.reason}`;
    }
    return this.renewalsRepo.save(request);
  }

  async complete(
    id: string,
    dto: CompleteRenewalRequestDto,
    user?: JwtPayload,
  ): Promise<RenewalRequest> {
    const request = await this.findById(id, user);
    if (request.status !== RenewalRequestStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved requests can be completed',
      );
    }

    await this.extinguisherClient.renewExtinguisher(
      request.extinguisherId,
      dto.newExpiryDate,
    );

    request.status = RenewalRequestStatus.COMPLETED;
    return this.renewalsRepo.save(request);
  }
}
