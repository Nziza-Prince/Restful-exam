import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceAuthGuard } from '@fems/shared';
import { AdminListRenewalsQueryDto } from '../dtos/list-renewals-query.dto';
import { RenewalsService } from '../services/renewals.service';

@ApiTags('internal')
@Controller('internal/renewals')
@UseGuards(ServiceAuthGuard)
export class RenewalsInternalController {
  constructor(private readonly renewalsService: RenewalsService) {}

  @Get('report')
  report(@Query() query: AdminListRenewalsQueryDto) {
    return this.renewalsService.findAll(1, Math.min(query.limit ?? 1000, 1000), {
      status: query.status,
      requestType: query.requestType,
      customerId: query.customerId,
    });
  }
}
