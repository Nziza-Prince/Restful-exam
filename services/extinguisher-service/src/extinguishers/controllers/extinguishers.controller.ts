import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  JwtPayload,
  Roles,
  RolesGuard,
  UserRole,
  PaginationQueryDto,
} from '@fems/shared';
import { CustomerClient, NotificationClient } from '../../clients/service.clients';
import { AssignExtinguisherDto } from '../dtos/assign-extinguisher.dto';
import { CreateExtinguisherDto } from '../dtos/create-extinguisher.dto';
import {
  AdminReviewInspectionDto,
  ScheduleInspectionDto,
  SubmitInspectionReportDto,
  UpdateInspectionDto,
} from '../dtos/inspection.dto';
import {
  ListExtinguishersQueryDto,
  ListMineExtinguishersQueryDto,
} from '../dtos/list-extinguishers-query.dto';
import { LogMaintenanceDto } from '../dtos/maintenance.dto';
import { InspectionStatus } from '../entities/extinguisher-inspection.entity';
import { ExtinguisherInspection } from '../entities/extinguisher-inspection.entity';
import { FireExtinguisher } from '../entities/fire-extinguisher.entity';
import { UpdateExtinguisherDto } from '../dtos/update-extinguisher.dto';
import { ExtinguishersService } from '../services/extinguishers.service';

@ApiTags('extinguishers')
@Controller('extinguishers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT')
export class ExtinguishersController {
  constructor(
    private readonly extinguishersService: ExtinguishersService,
    private readonly customerClient: CustomerClient,
    private readonly notificationClient: NotificationClient,
  ) {}

  @Get('mine')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'List owned extinguishers (user)' })
  async findMine(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListMineExtinguishersQueryDto,
  ) {
    const customer = await this.customerClient.findByEmail(user.email);
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    return this.enrichExtinguisherPage(
      await this.extinguishersService.findMine(
        customer.id,
        query.page ?? 1,
        query.limit ?? 10,
        {
          status: query.status,
          expiryFrom: query.expiryFrom,
          expiryTo: query.expiryTo,
          search: query.search,
        },
      ),
    );
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Register a fire extinguisher (admin)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateExtinguisherDto) {
    return this.extinguishersService.create(dto, user.sub);
  }

  @Patch(':id/assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign extinguisher to a customer (admin)' })
  async assign(
    @Param('id') id: string,
    @Body() dto: AssignExtinguisherDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const extinguisher = await this.extinguishersService.findById(id);
    if (extinguisher.createdBy !== user.sub) {
      throw new NotFoundException('Fire extinguisher not found');
    }

    const updated = await this.extinguishersService.assign(id, dto.customerId);

    // Fire-and-forget email notification — never fail the HTTP response if email is down
    this.notificationClient
      .triggerNotification({
        customerId: dto.customerId,
        extinguisherId: id,
        type: 'ASSIGNED',
        message:
          `Your fire extinguisher (serial: ${updated.serialNumber}, type: ${updated.type}, ` +
          `capacity: ${updated.capacity}) has been assigned to your account. ` +
          `It expires on ${updated.expiryDate}. Please ensure it is stored safely and serviced on time.`,
      })
      .catch(() => {});

    return updated;
  }

  @Patch(':id/buy')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Buy an unassigned fire extinguisher (user)' })
  async buy(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const customer = await this.customerClient.findByEmail(user.email);
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return this.extinguishersService.buy(id, customer.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'List extinguishers with filters' })
  async findAll(@CurrentUser() user: JwtPayload, @Query() query: ListExtinguishersQueryDto) {
    if (user.role === UserRole.USER) {
      return this.extinguishersService.findAll(query.page ?? 1, query.limit ?? 10, {
        status: query.status,
        onlyAvailable: true,
        expiryFrom: query.expiryFrom,
        expiryTo: query.expiryTo,
        search: query.search,
      });
    }

    if (user.role === UserRole.INSPECTOR) {
      return this.enrichExtinguisherPage(await this.extinguishersService.findAll(query.page ?? 1, query.limit ?? 10, {
        status: query.status,
        customerId: query.customerId,
        expiryFrom: query.expiryFrom,
        expiryTo: query.expiryTo,
        search: query.search,
      }));
    }

    return this.extinguishersService.findAll(query.page ?? 1, query.limit ?? 10, {
      status: query.status,
      customerId: query.customerId,
      expiryFrom: query.expiryFrom,
      expiryTo: query.expiryTo,
      search: query.search,
      createdBy: user.sub,
    });
  }

  @Get('inspections')
  @Roles(UserRole.ADMIN, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'List inspection requests' })
  async listAllInspections(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationQueryDto & { status?: InspectionStatus },
  ) {
    const result = await this.extinguishersService.listInspections(
      query.page ?? 1,
      query.limit ?? 10,
      undefined,
      query.status,
      user.role === UserRole.INSPECTOR ? user.sub : undefined,
      user.role === UserRole.INSPECTOR,
    );
    return this.enrichInspectionPage(result);
  }

  @Patch('inspections/:inspectionId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update inspection status or assignment' })
  updateInspection(@Param('inspectionId') inspectionId: string, @Body() dto: UpdateInspectionDto) {
    return this.extinguishersService.updateInspection(inspectionId, dto);
  }

  @Patch('inspections/:inspectionId/start')
  @Roles(UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Start an inspection request' })
  startInspection(@Param('inspectionId') inspectionId: string, @CurrentUser() user: JwtPayload) {
    return this.extinguishersService.startInspection(inspectionId, user.sub);
  }

  @Post('inspections/:inspectionId/report')
  @Roles(UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Submit inspection report for admin review' })
  async submitInspectionReport(
    @Param('inspectionId') inspectionId: string,
    @Body() dto: SubmitInspectionReportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const inspection = await this.extinguishersService.submitInspectionReport(inspectionId, dto, user.sub);
    const extinguisher = await this.extinguishersService.findById(inspection.extinguisherId);
    if (extinguisher.customerId) {
      this.notificationClient
        .triggerNotification({
          customerId: extinguisher.customerId,
          extinguisherId: extinguisher.id,
          type: 'INSPECTION_REPORT_SUBMITTED',
          message: `Inspection report for extinguisher ${extinguisher.serialNumber} is ready for admin review.`,
        })
        .catch(() => {});
    }
    return this.enrichInspection(inspection);
  }

  @Patch('inspections/:inspectionId/review')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve, reject, or require maintenance for an inspection report' })
  async reviewInspection(@Param('inspectionId') inspectionId: string, @Body() dto: AdminReviewInspectionDto) {
    return this.enrichInspection(await this.extinguishersService.reviewInspection(inspectionId, dto));
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Get extinguisher by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const extinguisher = await this.extinguishersService.findById(id);

    if (user.role === UserRole.INSPECTOR) {
      return extinguisher;
    }

    if (user.role === UserRole.USER) {
      const customer = await this.customerClient.findByEmail(user.email);
      if (!customer) {
        throw new NotFoundException('Customer profile not found');
      }
      if (extinguisher.customerId === null || extinguisher.customerId === customer.id) {
        return extinguisher;
      }
      throw new NotFoundException('Fire extinguisher not found');
    }

    if (extinguisher.createdBy !== user.sub) {
      throw new NotFoundException('Fire extinguisher not found');
    }
    return extinguisher;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update extinguisher (admin)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExtinguisherDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const extinguisher = await this.extinguishersService.findById(id);
    if (extinguisher.createdBy !== user.sub) {
      throw new NotFoundException('Fire extinguisher not found');
    }
    return this.extinguishersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete extinguisher (admin)' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const extinguisher = await this.extinguishersService.findById(id);
    if (extinguisher.createdBy !== user.sub) {
      throw new NotFoundException('Fire extinguisher not found');
    }
    return this.extinguishersService.remove(id);
  }

  @Post(':id/inspections')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Request an extinguisher inspection' })
  async scheduleInspection(
    @Param('id') id: string,
    @Body() dto: ScheduleInspectionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const inspection = await this.extinguishersService.scheduleInspection(id, dto, user.sub);
    const extinguisher = await this.extinguishersService.findById(id);
    if (extinguisher.customerId) {
      this.notificationClient
        .triggerNotification({
          customerId: extinguisher.customerId,
          extinguisherId: id,
          type: 'INSPECTION_SCHEDULED',
          message: `Inspection requested for extinguisher ${extinguisher.serialNumber} on ${dto.scheduledAt}.`,
        })
        .catch(() => {});
    }
    return inspection;
  }

  @Get(':id/inspections')
  @Roles(UserRole.ADMIN, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'List inspections for an extinguisher' })
  async listInspections(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.enrichInspectionPage(
      await this.extinguishersService.listInspections(query.page ?? 1, query.limit ?? 10, id),
    );
  }

  @Post(':id/maintenance')
  @Roles(UserRole.ADMIN, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Log maintenance actions for an extinguisher' })
  logMaintenance(
    @Param('id') id: string,
    @Body() dto: LogMaintenanceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.extinguishersService.logMaintenance(id, dto, user.sub);
  }

  @Get(':id/maintenance')
  @Roles(UserRole.ADMIN, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'List maintenance history for an extinguisher' })
  listMaintenance(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.extinguishersService.listMaintenance(query.page ?? 1, query.limit ?? 10, id);
  }

  private async enrichInspectionPage(result: {
    data: ExtinguisherInspection[];
    meta: unknown;
  }) {
    return {
      ...result,
      data: await Promise.all(result.data.map((inspection) => this.enrichInspection(inspection))),
    };
  }

  private async enrichExtinguisherPage(result: {
    data: FireExtinguisher[];
    meta: unknown;
  }) {
    return {
      ...result,
      data: await Promise.all(result.data.map((extinguisher) => this.enrichExtinguisher(extinguisher))),
    };
  }

  private async enrichExtinguisher(extinguisher: FireExtinguisher) {
    const customer = extinguisher.customerId
      ? await this.customerClient.findById(extinguisher.customerId)
      : null;
    const activeInspection = await this.extinguishersService.findActiveInspectionForExtinguisher(
      extinguisher.id,
    );
    return {
      ...extinguisher,
      customer,
      activeInspection: activeInspection
        ? {
            id: activeInspection.id,
            status: activeInspection.status,
            scheduledAt: activeInspection.scheduledAt,
            notes: activeInspection.notes,
          }
        : null,
    };
  }

  private async enrichInspection(inspection: ExtinguisherInspection) {
    const extinguisher = await this.extinguishersService.findById(inspection.extinguisherId);
    const customer = extinguisher.customerId
      ? await this.customerClient.findById(extinguisher.customerId)
      : null;

    return {
      ...inspection,
      extinguisher: {
        id: extinguisher.id,
        serialNumber: extinguisher.serialNumber,
        type: extinguisher.type,
        location: extinguisher.location,
        size: extinguisher.size,
        expiryDate: extinguisher.expiryDate,
        status: extinguisher.status,
        customerId: extinguisher.customerId,
      },
      customer,
    };
  }
}
