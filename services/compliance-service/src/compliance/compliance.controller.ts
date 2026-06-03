import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, JwtPayload, Roles, RolesGuard, UserRole } from '@fems/shared';
import { ComplianceService } from './compliance.service';
import {
  CreateComplianceCaseDto,
  UpdateComplianceCaseDto,
} from './dto/compliance-case.dto';
import { ListComplianceCasesQueryDto } from './dto/list-compliance-cases-query.dto';

@ApiTags('compliance')
@Controller('compliance/cases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListComplianceCasesQueryDto) {
    return this.complianceService.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.complianceService.findOne(id, user);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateComplianceCaseDto) {
    return this.complianceService.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateComplianceCaseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.complianceService.update(id, dto, user);
  }

  @Post(':id/close')
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('notes') notes: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.complianceService.close(id, notes, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.complianceService.remove(id, user);
  }
}
