import {
  Body,
  Controller,
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
import { CustomerClient } from '../../clients/service.clients';
import { CreateRenewalRequestDto } from '../dtos/create-renewal-request.dto';
import { CompleteRenewalRequestDto } from '../dtos/complete-renewal-request.dto';
import { RejectRenewalRequestDto } from '../dtos/create-renewal-request.dto';
import {
  AdminListRenewalsQueryDto,
  CustomerListRenewalsQueryDto,
} from '../dtos/list-renewals-query.dto';
import { RenewalsService } from '../services/renewals.service';

@ApiTags('renewals')
@Controller('renewals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT')
export class RenewalsController {
  constructor(
    private readonly renewalsService: RenewalsService,
    private readonly customerClient: CustomerClient,
  ) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Submit a renewal request (customer)' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRenewalRequestDto,
  ) {
    const customer = await this.customerClient.findByEmail(user.email);
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return this.renewalsService.createForCustomer(customer.id, dto);
  }

  @Get('mine')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'List own renewal requests (customer)' })
  async findMine(
    @CurrentUser() user: JwtPayload,
    @Query() query: CustomerListRenewalsQueryDto,
  ) {
    const customer = await this.customerClient.findByEmail(user.email);
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return this.renewalsService.findMine(
      customer.id,
      query.page ?? 1,
      query.limit ?? 10,
      query.status,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all renewal requests (admin)' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: AdminListRenewalsQueryDto) {
    return this.renewalsService.findAll(query.page ?? 1, query.limit ?? 10, {
      status: query.status,
      requestType: query.requestType,
      customerId: query.customerId,
    }, user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get renewal request by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const request = await this.renewalsService.findById(id, user);

    if (user.role === UserRole.CUSTOMER) {
      const customer = await this.customerClient.findByEmail(user.email);
      if (!customer || request.customerId !== customer.id) {
        throw new NotFoundException('Renewal request not found');
      }
    }

    return request;
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve renewal request (admin)' })
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.renewalsService.approve(id, user);
  }

  @Patch(':id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject renewal request (admin)' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectRenewalRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.renewalsService.reject(id, dto, user);
  }

  @Patch(':id/complete')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Complete renewal request and renew extinguisher (admin)',
  })
  complete(
    @Param('id') id: string,
    @Body() dto: CompleteRenewalRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.renewalsService.complete(id, dto, user);
  }
}
