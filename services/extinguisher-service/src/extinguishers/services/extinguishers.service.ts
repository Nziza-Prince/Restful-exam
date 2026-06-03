import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { paginate, PaginatedResult } from '@fems/shared';
import { ExtinguisherFilterOptions } from '../dtos/list-extinguishers-query.dto';
import { CreateExtinguisherDto } from '../dtos/create-extinguisher.dto';
import { RenewExtinguisherDto } from '../dtos/update-extinguisher.dto';
import { UpdateExtinguisherDto } from '../dtos/update-extinguisher.dto';
import { ExtinguisherStatus } from '../entities/extinguisher-status.enum';
import { FireExtinguisher } from '../entities/fire-extinguisher.entity';
import { ExtinguishersRepository } from '../repositories/extinguishers.repository';

export function computeExtinguisherStatus(
  expiryDate: string,
  referenceDate = new Date(),
): ExtinguisherStatus {
  const today = startOfDay(referenceDate);
  const expiry = startOfDay(new Date(expiryDate));

  if (expiry < today) {
    return ExtinguisherStatus.EXPIRED;
  }

  const daysUntilExpiry = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysUntilExpiry <= 90) {
    return ExtinguisherStatus.EXPIRING_SOON;
  }

  return ExtinguisherStatus.ACTIVE;
}

export function daysUntilExpiry(
  expiryDate: string,
  referenceDate = new Date(),
): number {
  const today = startOfDay(referenceDate);
  const expiry = startOfDay(new Date(expiryDate));
  return Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

@Injectable()
export class ExtinguishersService {
  constructor(private readonly extinguishersRepo: ExtinguishersRepository) {}

  async create(dto: CreateExtinguisherDto, createdBy?: string): Promise<FireExtinguisher> {
    const status = computeExtinguisherStatus(dto.expiryDate);
    const extinguisher = this.extinguishersRepo.create({
      ...dto,
      customerId: dto.customerId && dto.customerId !== '' ? dto.customerId : null,
      status,
      createdBy: createdBy || null,
    });
    return this.extinguishersRepo.save(extinguisher);
  }

  async buy(id: string, customerId: string): Promise<FireExtinguisher> {
    const extinguisher = await this.findById(id);
    if (extinguisher.customerId) {
      throw new Error('Extinguisher already owned by a customer');
    }
    extinguisher.customerId = customerId;
    return this.extinguishersRepo.save(extinguisher);
  }

  async assign(id: string, customerId: string): Promise<FireExtinguisher> {
    const extinguisher = await this.findById(id);
    extinguisher.customerId = customerId;
    return this.extinguishersRepo.save(extinguisher);
  }

  async findAllForInternal(createdBy?: string, customerId?: string): Promise<FireExtinguisher[]> {
    const filters: ExtinguisherFilterOptions = {};
    if (createdBy) filters.createdBy = createdBy;
    if (customerId) filters.customerId = customerId;
    const [data] = await this.extinguishersRepo.findPaginated(1, 10000, filters);
    return data;
  }

  async findAll(
    page: number,
    limit: number,
    filters: ExtinguisherFilterOptions,
  ): Promise<PaginatedResult<FireExtinguisher>> {
    const [data, total] = await this.extinguishersRepo.findPaginated(
      page,
      limit,
      filters,
    );
    return paginate(data, total, page, limit);
  }

  async findMine(
    customerId: string,
    page: number,
    limit: number,
    filters: ExtinguisherFilterOptions,
  ): Promise<PaginatedResult<FireExtinguisher>> {
    return this.findAll(page, limit, { ...filters, customerId });
  }

  async findReportByStatus(status: ExtinguisherStatus, createdBy?: string, limit = 1000) {
    const [data, total] = await this.extinguishersRepo.findPaginated(1, limit, {
      status,
      createdBy,
    });
    return paginate(data, total, 1, limit);
  }

  async findById(id: string): Promise<FireExtinguisher> {
    const extinguisher = await this.extinguishersRepo.findById(id);
    if (!extinguisher) {
      throw new NotFoundException('Fire extinguisher not found');
    }
    return extinguisher;
  }

  async update(id: string, dto: UpdateExtinguisherDto): Promise<FireExtinguisher> {
    const extinguisher = await this.findById(id);

    if (dto.serialNumber !== undefined) {
      extinguisher.serialNumber = dto.serialNumber;
    }
    if (dto.type !== undefined) extinguisher.type = dto.type;
    if (dto.capacity !== undefined) extinguisher.capacity = dto.capacity;
    if (dto.purchaseDate !== undefined) {
      extinguisher.purchaseDate = dto.purchaseDate;
    }
    if (dto.customerId !== undefined) extinguisher.customerId = dto.customerId;
    if (dto.expiryDate !== undefined) {
      extinguisher.expiryDate = dto.expiryDate;
      extinguisher.status = computeExtinguisherStatus(dto.expiryDate);
    }
    if (dto.status !== undefined) extinguisher.status = dto.status;

    return this.extinguishersRepo.save(extinguisher);
  }

  async renew(id: string, dto: RenewExtinguisherDto): Promise<FireExtinguisher> {
    const extinguisher = await this.findById(id);
    extinguisher.expiryDate = dto.expiryDate;
    extinguisher.status = ExtinguisherStatus.RENEWED;
    return this.extinguishersRepo.save(extinguisher);
  }

  async remove(id: string): Promise<void> {
    const extinguisher = await this.findById(id);
    await this.extinguishersRepo.remove(extinguisher);
  }

  async findAllForCron(): Promise<FireExtinguisher[]> {
    return this.extinguishersRepo.findAll();
  }

  async saveMany(extinguishers: FireExtinguisher[]): Promise<FireExtinguisher[]> {
    return this.extinguishersRepo.saveMany(extinguishers);
  }
}
