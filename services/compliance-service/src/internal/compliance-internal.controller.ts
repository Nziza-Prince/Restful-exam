import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceAuthGuard } from '@fems/shared';
import { ComplianceService } from '../compliance/compliance.service';
import { EscalateComplianceDto } from '../compliance/dto/compliance-case.dto';

@ApiTags('internal')
@Controller('internal/compliance')
@UseGuards(ServiceAuthGuard)
export class ComplianceInternalController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post('escalate')
  escalate(@Body() dto: EscalateComplianceDto) {
    return this.complianceService.escalate(dto);
  }
}
