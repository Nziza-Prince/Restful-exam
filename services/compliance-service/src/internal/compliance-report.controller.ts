import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceAuthGuard } from '@fems/shared';
import { ComplianceService } from '../compliance/compliance.service';
import { ListComplianceCasesQueryDto } from '../compliance/dto/list-compliance-cases-query.dto';

@ApiTags('internal')
@Controller('internal/compliance')
@UseGuards(ServiceAuthGuard)
export class ComplianceReportController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('report')
  async report(@Query() query: ListComplianceCasesQueryDto) {
    const result = await this.complianceService.findAll({
      ...query,
      limit: Math.min(query.limit ?? 1000, 1000),
    });
    return result;
  }
}
