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
} from '@fems/shared';
import { CustomerClient, NotificationClient } from '../../clients/service.clients';
import { AssignExtinguisherDto } from '../dtos/assign-extinguisher.dto';
import { CreateExtinguisherDto } from '../dtos/create-extinguisher.dto';
import {
  ListExtinguishersQueryDto,
  ListMineExtinguishersQueryDto,
} from '../dtos/list-extinguishers-query.dto';
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
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'List owned extinguishers (customer)' })
  async findMine(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListMineExtinguishersQueryDto,
  ) {
    const customer = await this.customerClient.findByEmail(user.email);
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    return this.extinguishersService.findMine(
      customer.id,
      query.page ?? 1,
      query.limit ?? 10,
      {
        status: query.status,
        expiryFrom: query.expiryFrom,
        expiryTo: query.expiryTo,
        search: query.search,
      },
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
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Buy an unassigned fire extinguisher (customer)' })
  async buy(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const customer = await this.customerClient.findByEmail(user.email);
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return this.extinguishersService.buy(id, customer.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'List extinguishers with filters' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListExtinguishersQueryDto) {
    if (user.role === UserRole.CUSTOMER) {
      return this.extinguishersService.findAll(query.page ?? 1, query.limit ?? 10, {
        status: query.status,
        onlyAvailable: true,
        expiryFrom: query.expiryFrom,
        expiryTo: query.expiryTo,
        search: query.search,
      });
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

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get extinguisher by ID (admin)' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const extinguisher = await this.extinguishersService.findById(id);
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
}
