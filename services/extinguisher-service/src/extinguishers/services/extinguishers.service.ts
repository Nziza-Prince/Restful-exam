import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { paginate, PaginatedResult } from '@fems/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtinguisherFilterOptions } from '../dtos/list-extinguishers-query.dto';
import { CreateExtinguisherDto } from '../dtos/create-extinguisher.dto';
import {
  AdminReviewInspectionDto,
  ScheduleInspectionDto,
  SubmitInspectionReportDto,
  UpdateInspectionDto,
} from '../dtos/inspection.dto';
import { LogMaintenanceDto } from '../dtos/maintenance.dto';
import { RenewExtinguisherDto } from '../dtos/update-extinguisher.dto';
import { UpdateExtinguisherDto } from '../dtos/update-extinguisher.dto';
import { ExtinguisherInspection, InspectionStatus } from '../entities/extinguisher-inspection.entity';
import { ExtinguisherStatus } from '../entities/extinguisher-status.enum';
import { FireExtinguisher } from '../entities/fire-extinguisher.entity';
import { MaintenanceLog } from '../entities/maintenance-log.entity';
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
  constructor(
    private readonly extinguishersRepo: ExtinguishersRepository,
    @InjectRepository(ExtinguisherInspection)
    private readonly inspectionsRepo: Repository<ExtinguisherInspection>,
    @InjectRepository(MaintenanceLog)
    private readonly maintenanceRepo: Repository<MaintenanceLog>,
  ) {}

  async create(dto: CreateExtinguisherDto, createdBy?: string): Promise<FireExtinguisher> {
    const existing = await this.extinguishersRepo.findBySerialNumber(dto.serialNumber);
    if (existing) {
      throw new ConflictException('Fire extinguisher serial number already exists');
    }

    const status = dto.status ?? computeExtinguisherStatus(dto.expiryDate);
    const extinguisher = this.extinguishersRepo.create({
      ...dto,
      size: dto.size ?? dto.capacity,
      capacity: dto.capacity ?? dto.size,
      installationDate: dto.installationDate ?? dto.purchaseDate,
      purchaseDate: dto.purchaseDate ?? dto.installationDate,
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
      const existing = await this.extinguishersRepo.findBySerialNumber(dto.serialNumber);
      if (existing && existing.id !== id) {
        throw new ConflictException('Fire extinguisher serial number already exists');
      }
      extinguisher.serialNumber = dto.serialNumber;
    }
    if (dto.type !== undefined) extinguisher.type = dto.type;
    if (dto.location !== undefined) extinguisher.location = dto.location;
    if (dto.size !== undefined) {
      extinguisher.size = dto.size;
      extinguisher.capacity = dto.size;
    }
    if (dto.capacity !== undefined) {
      extinguisher.capacity = dto.capacity;
      extinguisher.size = dto.capacity;
    }
    if (dto.installationDate !== undefined) {
      extinguisher.installationDate = dto.installationDate;
      extinguisher.purchaseDate = dto.installationDate;
    }
    if (dto.purchaseDate !== undefined) {
      extinguisher.purchaseDate = dto.purchaseDate;
      extinguisher.installationDate = dto.purchaseDate;
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

  async scheduleInspection(
    extinguisherId: string,
    dto: ScheduleInspectionDto,
    requestedBy: string,
  ): Promise<ExtinguisherInspection> {
    await this.findById(extinguisherId);
    const activeStatuses = [
      InspectionStatus.PENDING,
      InspectionStatus.IN_PROGRESS,
      InspectionStatus.COMPLETED_PENDING_ADMIN_REVIEW,
      InspectionStatus.REQUIRES_MAINTENANCE,
    ];
    const existingActive = await this.inspectionsRepo
      .createQueryBuilder('i')
      .where('i.extinguisherId = :extinguisherId', { extinguisherId })
      .andWhere('i.status IN (:...activeStatuses)', { activeStatuses })
      .getOne();
    if (existingActive) {
      throw new ConflictException('This extinguisher already has an active inspection request');
    }

    const inspection = this.inspectionsRepo.create({
      extinguisherId,
      scheduledAt: new Date(dto.scheduledAt),
      requestedBy,
      inspectorId: dto.inspectorId ?? null,
      notes: dto.notes ?? null,
    });
    return this.inspectionsRepo.save(inspection);
  }

  async listInspections(
    page: number,
    limit: number,
    extinguisherId?: string,
    status?: InspectionStatus,
    inspectorId?: string,
    activeOnly = false,
  ): Promise<PaginatedResult<ExtinguisherInspection>> {
    const qb = this.inspectionsRepo
      .createQueryBuilder('i')
      .orderBy('i.scheduledAt', 'DESC');
    if (extinguisherId) qb.andWhere('i.extinguisherId = :extinguisherId', { extinguisherId });
    if (status) {
      qb.andWhere('i.status = :status', { status });
    } else if (activeOnly) {
      qb.andWhere('i.status IN (:...activeStatuses)', {
        activeStatuses: [
          InspectionStatus.PENDING,
          InspectionStatus.IN_PROGRESS,
          InspectionStatus.COMPLETED_PENDING_ADMIN_REVIEW,
          InspectionStatus.REQUIRES_MAINTENANCE,
        ],
      });
    }
    if (inspectorId) {
      qb.andWhere('(i.inspectorId IS NULL OR i.inspectorId = :inspectorId)', { inspectorId });
    }
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async updateInspection(id: string, dto: UpdateInspectionDto): Promise<ExtinguisherInspection> {
    const inspection = await this.inspectionsRepo.findOne({ where: { id } });
    if (!inspection) throw new NotFoundException('Inspection not found');
    if (dto.status !== undefined) inspection.status = dto.status;
    if (dto.inspectorId !== undefined) inspection.inspectorId = dto.inspectorId;
    if (dto.notes !== undefined) inspection.notes = dto.notes;
    return this.inspectionsRepo.save(inspection);
  }

  async startInspection(id: string, inspectorId: string): Promise<ExtinguisherInspection> {
    const inspection = await this.inspectionsRepo.findOne({ where: { id } });
    if (!inspection) throw new NotFoundException('Inspection not found');
    inspection.status = InspectionStatus.IN_PROGRESS;
    inspection.inspectorId = inspectorId;
    return this.inspectionsRepo.save(inspection);
  }

  async submitInspectionReport(
    id: string,
    dto: SubmitInspectionReportDto,
    inspectorId: string,
  ): Promise<ExtinguisherInspection> {
    const inspection = await this.inspectionsRepo.findOne({ where: { id } });
    if (!inspection) throw new NotFoundException('Inspection not found');
    inspection.inspectorId = inspectorId;
    inspection.reportCondition = dto.condition;
    inspection.reportNotes = dto.notes ?? null;
    inspection.actionsTaken = dto.actionsTaken;
    inspection.result = dto.result;
    inspection.inspectionDate = dto.inspectionDate;
    inspection.status = InspectionStatus.COMPLETED_PENDING_ADMIN_REVIEW;
    return this.inspectionsRepo.save(inspection);
  }

  async reviewInspection(
    id: string,
    dto: AdminReviewInspectionDto,
  ): Promise<ExtinguisherInspection> {
    const inspection = await this.inspectionsRepo.findOne({ where: { id } });
    if (!inspection) throw new NotFoundException('Inspection not found');
    inspection.status = dto.status;
    inspection.adminReviewNotes = dto.notes ?? null;
    return this.inspectionsRepo.save(inspection);
  }

  async logMaintenance(
    extinguisherId: string,
    dto: LogMaintenanceDto,
    loggedBy: string,
  ): Promise<MaintenanceLog> {
    await this.findById(extinguisherId);
    const log = this.maintenanceRepo.create({
      extinguisherId,
      actionsTaken: dto.actionsTaken,
      actionDate: dto.actionDate,
      conditionsNoted: dto.conditionsNoted,
      loggedBy,
    });
    return this.maintenanceRepo.save(log);
  }

  async listMaintenance(
    page: number,
    limit: number,
    extinguisherId?: string,
  ): Promise<PaginatedResult<MaintenanceLog>> {
    const qb = this.maintenanceRepo
      .createQueryBuilder('m')
      .orderBy('m.actionDate', 'DESC');
    if (extinguisherId) qb.andWhere('m.extinguisherId = :extinguisherId', { extinguisherId });
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async inspectionStatusReport(): Promise<Record<string, unknown>[]> {
    const rows = await this.inspectionsRepo
      .createQueryBuilder('i')
      .select('i.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('i.status')
      .getRawMany();
    return rows;
  }

  async maintenanceHistoryReport(): Promise<MaintenanceLog[]> {
    return this.maintenanceRepo.find({ order: { actionDate: 'DESC' }, take: 1000 });
  }

  async findAllForCron(): Promise<FireExtinguisher[]> {
    return this.extinguishersRepo.findAll();
  }

  async saveMany(extinguishers: FireExtinguisher[]): Promise<FireExtinguisher[]> {
    return this.extinguishersRepo.saveMany(extinguishers);
  }
}
