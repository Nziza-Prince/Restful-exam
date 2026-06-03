import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser, JwtAuthGuard, JwtPayload, Roles, RolesGuard, UserRole } from '@fems/shared';
import { ReportQueryDto } from './dto/report-query.dto';
import { ExportResult } from './export.service';
import { ReportsService } from './reports.service';

/**
 * REPORTS CONTROLLER
 * 
 * REST API endpoints for generating compliance and operational reports.
 * All endpoints are admin-only and require JWT authentication.
 * 
 * REPORT TYPES:
 * - Expired extinguishers: Units past expiry date
 * - Expiring soon: Units approaching expiry within threshold
 * - Customer compliance: Compliance case summary by customer
 * - Renewal requests: Pending renewal/replacement requests
 * - Notifications: System notifications log
 * - Compliance summary: Comprehensive compliance report (stock, expired count, inspections, maintenance)
 * - Period reports: Daily/monthly/yearly extinguisher registration trends
 * - Inspection status: Breakdown of inspection request states
 * - Maintenance history: Historical maintenance activity log
 * - Dashboard summary: Real-time metrics for dashboard display
 * 
 * EXPORT FORMATS:
 * - CSV: Comma-separated values for data analysis
 * - XLSX: Excel spreadsheet format
 * - PDF: Formatted printable document
 * - JSON: Raw data for API consumers
 */

/**
 * Type guard to check if service response is a file export or JSON data
 */
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

  /**
   * GET /reports/expired-extinguishers
   * List all extinguishers past their expiry date
   */
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

  /**
   * GET /reports/expiring-soon
   * List extinguishers approaching expiry within threshold days
   */
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

  /**
   * GET /reports/customer-compliance
   * Compliance case summary grouped by customer
   */
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

  @Get('total-stock')
  totalStock(@CurrentUser() user: JwtPayload, @Query() query: ReportQueryDto) {
    return this.reportsService.totalStock({ ...query, adminId: user.sub });
  }

  /**
   * GET /reports/compliance-summary
   * Comprehensive compliance report including:
   * - Total stock count
   * - Expired extinguishers count (summary metric)
   * - Inspection status breakdown
   * - Detailed expired extinguisher list
   * - Maintenance history logs
   */
  @Get('compliance-summary')
  async complianceSummary(
    @CurrentUser() user: JwtPayload,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    return this.sendReport(
      await this.reportsService.complianceSummary({ ...query, adminId: user.sub }),
      res,
    );
  }

  @Get('daily')
  async daily(@CurrentUser() user: JwtPayload, @Query() query: ReportQueryDto, @Res() res: Response) {
    return this.sendReport(
      await this.reportsService.extinguisherPeriodReport('daily', { ...query, adminId: user.sub }),
      res,
    );
  }

  @Get('monthly')
  async monthly(@CurrentUser() user: JwtPayload, @Query() query: ReportQueryDto, @Res() res: Response) {
    return this.sendReport(
      await this.reportsService.extinguisherPeriodReport('monthly', { ...query, adminId: user.sub }),
      res,
    );
  }

  @Get('yearly')
  async yearly(@CurrentUser() user: JwtPayload, @Query() query: ReportQueryDto, @Res() res: Response) {
    return this.sendReport(
      await this.reportsService.extinguisherPeriodReport('yearly', { ...query, adminId: user.sub }),
      res,
    );
  }

  @Get('inspection-status')
  async inspectionStatus(
    @CurrentUser() user: JwtPayload,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    return this.sendReport(
      await this.reportsService.inspectionStatus({ ...query, adminId: user.sub }),
      res,
    );
  }

  @Get('maintenance-history')
  async maintenanceHistory(
    @CurrentUser() user: JwtPayload,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    return this.sendReport(
      await this.reportsService.maintenanceHistory({ ...query, adminId: user.sub }),
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

  /**
   * Helper method to send report response
   * - If ExportResult (file): Set headers and send binary buffer
   * - If JSON data: Send as application/json
   */
  private sendReport(result: ExportResult | Record<string, unknown>[], res: Response) {
    if (isExportResult(result)) {
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.send(result.buffer);
    }
    return res.json({ data: result });
  }
}
