import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser, JwtAuthGuard, JwtPayload, Roles, RolesGuard, UserRole } from '@fems/shared';
import { ReportQueryDto } from './dto/report-query.dto';
import { ExportResult } from './export.service';
import { ReportsService } from './reports.service';

function isExportResult(value: unknown): value is ExportResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'buffer' in value &&
    'contentType' in value &&
    'filename' in value
  );
}

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('expired-extinguishers')
  async expiredExtinguishers(
    @CurrentUser() user: JwtPayload,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    return this.sendReport(
      await this.reportsService.expiredExtinguishers({ ...query, adminId: user.sub }),
      res,
    );
  }

  @Get('expiring-soon')
  async expiringSoon(
    @CurrentUser() user: JwtPayload,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    return this.sendReport(
      await this.reportsService.expiringSoon({ ...query, adminId: user.sub }),
      res,
    );
  }

  @Get('customer-compliance')
  async customerCompliance(
    @CurrentUser() user: JwtPayload,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    return this.sendReport(
      await this.reportsService.customerCompliance({ ...query, adminId: user.sub }),
      res,
    );
  }

  @Get('renewal-requests')
  async renewalRequests(
    @CurrentUser() user: JwtPayload,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    return this.sendReport(
      await this.reportsService.renewalRequests({ ...query, adminId: user.sub }),
      res,
    );
  }

  @Get('notifications')
  async notifications(
    @CurrentUser() user: JwtPayload,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    return this.sendReport(
      await this.reportsService.notifications({ ...query, adminId: user.sub }),
      res,
    );
  }

  @Get('dashboard-summary')
  dashboardSummary(
    @CurrentUser() user: JwtPayload,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.dashboardSummary({ ...query, adminId: user.sub });
  }

  private sendReport(result: ExportResult | Record<string, unknown>[], res: Response) {
    if (isExportResult(result)) {
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.send(result.buffer);
    }
    return res.json({ data: result });
  }
}
