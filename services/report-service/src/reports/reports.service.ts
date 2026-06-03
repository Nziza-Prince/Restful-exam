import { Injectable } from '@nestjs/common';
import { ComplianceClient } from '../clients/compliance.client';
import { CustomerClient } from '../clients/customer.client';
import { ExtinguisherClient } from '../clients/extinguisher.client';
import { NotificationClient } from '../clients/notification.client';
import { RenewalClient } from '../clients/renewal.client';
import { ReportQueryDto } from './dto/report-query.dto';
import { ExportResult, ExportService } from './export.service';
import { ReportFormat } from './enums/report-format.enum';

/**
 * REPORTS SERVICE
 * 
 * Business logic for generating compliance and operational reports.
 * Aggregates data from multiple microservices (extinguisher, compliance, renewal, notification)
 * and formats results for export in various formats (CSV, XLSX, PDF).
 * 
 * KEY FEATURES:
 * - Multi-service data aggregation
 * - Admin-scoped filtering (only show data for extinguishers created by requesting admin)
 * - Flexible export formatting
 * - Real-time dashboard metrics
 * 
 * REPORT TYPES:
 * - expiredExtinguishers: Units past expiry
 * - expiringSoon: Units approaching expiry
 * - complianceSummary: Comprehensive compliance overview (includes expired count as metric)
 * - maintenanceHistory: Maintenance activity log
 * - inspectionStatus: Inspection request status breakdown
 * - dashboardSummary: Live metrics for dashboard widgets
 */

@Injectable()
export class ReportsService {
  constructor(
    private readonly extinguisherClient: ExtinguisherClient,
    private readonly customerClient: CustomerClient,
    private readonly notificationClient: NotificationClient,
    private readonly complianceClient: ComplianceClient,
    private readonly renewalClient: RenewalClient,
    private readonly exportService: ExportService,
  ) {}

  /**
   * Build query parameters for time-based reports
   * - Defaults to 90-day window if not specified
   * - Includes adminId for access control filtering
   */
  private params(query: ReportQueryDto & { adminId?: string }) {
    return {
      customerId: query.customerId,
      from: query.from,
      to: query.to,
      days: query.days ?? '90',
      adminId: query.adminId,
    };
  }

  /**
   * Build pagination parameters for internal service list endpoints
   * - Fetches up to 100 records per call
   * - Optionally filters by customerId
   */
  private internalListParams(query: ReportQueryDto) {
    return {
      page: '1',
      limit: '100',
      ...(query.customerId ? { customerId: query.customerId } : {}),
    };
  }

  async expiredExtinguishers(query: ReportQueryDto & { adminId?: string }): Promise<ExportResult | Record<string, unknown>[]> {
    const rows = await this.extinguisherClient.getExpired(this.params(query));
    return this.respond('expired-extinguishers', rows, query.format ?? ReportFormat.CSV);
  }

  async expiringSoon(query: ReportQueryDto & { adminId?: string }): Promise<ExportResult | Record<string, unknown>[]> {
    const rows = await this.extinguisherClient.getExpiringSoon(this.params(query));
    return this.respond('expiring-soon', rows, query.format ?? ReportFormat.CSV);
  }

  async customerCompliance(query: ReportQueryDto & { adminId?: string }): Promise<ExportResult | Record<string, unknown>[]> {
    let rows = await this.complianceClient.getCases(this.internalListParams(query));
    if (query.adminId) {
      const extinguishers = await this.extinguisherClient.getExtinguishers({ createdBy: query.adminId });
      const ids = new Set(extinguishers.map(e => e.id as string));
      rows = rows.filter(r => ids.has(r.extinguisherId as string));
    }
    return this.respond('customer-compliance', rows, query.format ?? ReportFormat.CSV);
  }

  async renewalRequests(query: ReportQueryDto & { adminId?: string }): Promise<ExportResult | Record<string, unknown>[]> {
    let rows = await this.renewalClient.getRenewalRequests(this.internalListParams(query));
    if (query.adminId) {
      const extinguishers = await this.extinguisherClient.getExtinguishers({ createdBy: query.adminId });
      const ids = new Set(extinguishers.map(e => e.id as string));
      rows = rows.filter(r => ids.has(r.extinguisherId as string));
    }
    return this.respond('renewal-requests', rows, query.format ?? ReportFormat.CSV);
  }

  async notifications(query: ReportQueryDto & { adminId?: string }): Promise<ExportResult | Record<string, unknown>[]> {
    let rows = await this.notificationClient.getNotifications(this.internalListParams(query));
    if (query.adminId) {
      const extinguishers = await this.extinguisherClient.getExtinguishers({ createdBy: query.adminId });
      const ids = new Set(extinguishers.map(e => e.id as string));
      rows = rows.filter(r => ids.has(r.extinguisherId as string));
    }
    return this.respond('notifications', rows, query.format ?? ReportFormat.CSV);
  }

  async totalStock(query: ReportQueryDto & { adminId?: string }) {
    const rows = await this.extinguisherClient.getExtinguishers({ createdBy: query.adminId });
    return {
      total: rows.length,
      generatedAt: new Date().toISOString(),
    };
  }

  async complianceSummary(query: ReportQueryDto & { adminId?: string }): Promise<ExportResult | Record<string, unknown>[]> {
    const [stock, expired, inspectionStatus, maintenanceHistory] = await Promise.all([
      this.extinguisherClient.getExtinguishers({ createdBy: query.adminId }),
      this.extinguisherClient.getExpired(this.params(query)),
      this.extinguisherClient.getInspectionStatus({ adminId: query.adminId }),
      this.extinguisherClient.getMaintenanceHistory({ adminId: query.adminId }),
    ]);

    const rows: Record<string, unknown>[] = [
      {
        section: 'Total number of extinguishers in stock',
        metric: 'totalStock',
        value: stock.length,
        details: 'Registered extinguishers currently in inventory',
      },
      // ── Inspection status breakdown ─────────────────────────────────────
      ...inspectionStatus.map((row) => ({
        section: 'Inspection status',
        metric: row.status ?? 'unknown',
        value: row.count ?? 0,
        details: 'Inspection request count by review status',
      })),
      // ── Expired extinguisher details (one row per unit) ─────────────────
      ...expired.map((row) => ({
        section: 'Expired extinguishers',
        metric: row.serialNumber ?? row.extinguisherId ?? 'Unknown extinguisher',
        value: row.status ?? 'EXPIRED',
        details: [
          row.type,
          row.location,
          row.size ?? row.capacity,
          row.expiryDate ? `Expires: ${row.expiryDate}` : undefined,
        ].filter(Boolean).join(' | '),
      })),
      // ── Maintenance history logs (one row per log entry) ────────────────
      ...maintenanceHistory.map((row) => ({
        section: 'Maintenance history',
        metric: row.actionDate ?? 'Unknown date',
        value: row.actionsTaken ?? 'No actions recorded',
        details: [
          `Extinguisher: ${row.extinguisherId ?? 'Unknown'}`,
          `Conditions: ${row.conditionsNoted ?? 'Not specified'}`,
          `Performed by: ${row.loggedBy ?? 'Unknown'}`,
        ].filter(Boolean).join(' | '),
      })),
    ];

    return this.respond('fire-extinguisher-compliance-report', rows, query.format ?? ReportFormat.CSV);
  }

  async extinguisherPeriodReport(
    period: 'daily' | 'monthly' | 'yearly',
    query: ReportQueryDto & { adminId?: string },
  ): Promise<ExportResult | Record<string, unknown>[]> {
    const rows = await this.extinguisherClient.getExtinguishers({ createdBy: query.adminId });
    const keyLength = period === 'daily' ? 10 : period === 'monthly' ? 7 : 4;
    const grouped = rows.reduce<Record<string, number>>((acc, row) => {
      const raw = String(row.installationDate ?? row.purchaseDate ?? row.createdAt ?? 'unknown');
      const key = raw === 'unknown' ? raw : raw.slice(0, keyLength);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const reportRows = Object.entries(grouped).map(([periodLabel, count]) => ({
      period: periodLabel,
      extinguishers: count,
    }));
    return this.respond(`${period}-extinguisher-report`, reportRows, query.format ?? ReportFormat.CSV);
  }

  async inspectionStatus(query: ReportQueryDto & { adminId?: string }): Promise<ExportResult | Record<string, unknown>[]> {
    const rows = await this.extinguisherClient.getInspectionStatus({ adminId: query.adminId });
    return this.respond('inspection-status', rows, query.format ?? ReportFormat.CSV);
  }

  /**
   * Generate maintenance history report
   * - Lists all maintenance actions performed on extinguishers
   * - Includes: date, extinguisher ID, actions taken, conditions, technician
   * - Cleaned column names for readability in exports
   */
  async maintenanceHistory(query: ReportQueryDto & { adminId?: string }): Promise<ExportResult | Record<string, unknown>[]> {
    const rawRows = await this.extinguisherClient.getMaintenanceHistory({ adminId: query.adminId });
    
    // Transform to more readable column names for export
    const rows = rawRows.map(row => ({
      maintenanceDate: row.actionDate,
      extinguisherId: row.extinguisherId,
      actionsTaken: row.actionsTaken,
      conditionsNoted: row.conditionsNoted,
      performedBy: row.loggedBy,
      recordedAt: row.createdAt,
    }));
    
    return this.respond('maintenance-history', rows, query.format ?? ReportFormat.CSV);
  }

  async dashboardSummary(query: ReportQueryDto & { adminId?: string }) {
    const params = this.params(query);
    const listParams = this.internalListParams(query);
    const [expired, expiring, compliance, renewals, notifications, allExtinguishers] = await Promise.all([
      this.extinguisherClient.getExpired(params),
      this.extinguisherClient.getExpiringSoon(params),
      this.complianceClient.getCases(listParams),
      this.renewalClient.getRenewalRequests(listParams),
      this.notificationClient.getNotifications(listParams),
      this.extinguisherClient.getExtinguishers({ createdBy: query.adminId }),
    ]);

    let filteredCompliance = compliance;
    let filteredRenewals = renewals;
    let filteredNotifications = notifications;

    if (query.adminId) {
      const extinguishers = await this.extinguisherClient.getExtinguishers({ createdBy: query.adminId });
      const ids = new Set(extinguishers.map(e => e.id as string));
      filteredCompliance = compliance.filter(c => ids.has(c.extinguisherId as string));
      filteredRenewals = renewals.filter(r => ids.has(r.extinguisherId as string));
      filteredNotifications = notifications.filter(n => ids.has(n.extinguisherId as string));
    }

    return {
      charts: {
        expiredCount: expired.length,
        totalExtinguishers: allExtinguishers.length,
        expiringSoonCount: expiring.length,
        complianceIssues: filteredCompliance.length,
        pendingRenewals: filteredRenewals.length,
        recentNotifications: filteredNotifications.length,
      },
      breakdown: {
        expiredByMonth: this.groupByMonth(expired, 'expiryDate'),
        expiringByDays: this.groupByField(expiring, 'daysUntilExpiry'),
        complianceByStatus: this.groupByField(filteredCompliance, 'caseStatus'),
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private async respond(
    title: string,
    rows: Record<string, unknown>[],
    format: ReportFormat,
  ): Promise<ExportResult | Record<string, unknown>[]> {
    if (format === ReportFormat.CSV && rows.length === 0) {
      return rows;
    }
    return this.exportService.export(title, rows, format);
  }

  private groupByField(rows: Record<string, unknown>[], field: string) {
    return rows.reduce<Record<string, number>>((acc, row) => {
      const key = String(row[field] ?? 'unknown');
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }

  private groupByMonth(rows: Record<string, unknown>[], dateField: string) {
    return rows.reduce<Record<string, number>>((acc, row) => {
      const raw = row[dateField];
      const key =
        raw instanceof Date
          ? `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, '0')}`
          : String(raw ?? 'unknown').slice(0, 7);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }
}
