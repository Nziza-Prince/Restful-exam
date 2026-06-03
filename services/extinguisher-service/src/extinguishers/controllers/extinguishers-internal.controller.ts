import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceAuthGuard } from '@fems/shared';
import { RenewExtinguisherDto } from '../dtos/update-extinguisher.dto';
import { ExtinguisherStatus } from '../entities/extinguisher-status.enum';
import { ExtinguishersService } from '../services/extinguishers.service';

@ApiTags('internal')
@Controller('internal/extinguishers')
@UseGuards(ServiceAuthGuard)
export class ExtinguishersInternalController {
  constructor(private readonly extinguishersService: ExtinguishersService) {}

  @Get()
  findAll(
    @Query('createdBy') createdBy?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.extinguishersService.findAllForInternal(createdBy, customerId);
  }

  @Get('expired')
  expired(@Query('adminId') adminId?: string) {
    return this.extinguishersService.findReportByStatus(ExtinguisherStatus.EXPIRED, adminId);
  }

  @Get('expiring')
  expiring(@Query('adminId') adminId?: string) {
    return this.extinguishersService.findReportByStatus(
      ExtinguisherStatus.EXPIRING_SOON,
      adminId,
    );
  }

  @Get('inspection-status')
  inspectionStatus() {
    return this.extinguishersService.inspectionStatusReport();
  }

  @Get('maintenance-history')
  maintenanceHistory() {
    return this.extinguishersService.maintenanceHistoryReport();
  }

  @Patch(':id/renew')
  renew(@Param('id') id: string, @Body() dto: RenewExtinguisherDto) {
    return this.extinguishersService.renew(id, dto);
  }
}
