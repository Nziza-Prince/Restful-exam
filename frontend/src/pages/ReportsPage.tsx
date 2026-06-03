import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import type { ReportFormat, ReportType } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { downloadReport } from '@/store/slices/reportSlice';
import { downloadBlob } from '@/utils';

/**
 * REPORTS PAGE
 * 
 * Admin-only page for generating and downloading comprehensive compliance reports.
 * 
 * FEATURES:
 * - Generate compliance summary reports in multiple formats (CSV, XLSX, PDF)
 * - Reports include: stock totals, inspection status breakdown, expired extinguishers list, and maintenance history
 * - Export format selection (CSV for data analysis, XLSX for spreadsheets, PDF for formal documentation)
 * 
 * REPORT CONTENTS:
 * - Total extinguisher count in inventory
 * - Inspection request status breakdown (pending, in progress, completed, etc.)
 * - Complete list of expired extinguishers with details
 * - Maintenance history log entries
 */

// ── Available report configurations ───────────────────────────────────────────
const reports: { type: ReportType; title: string; description: string }[] = [
  {
    type: 'compliance-summary',
    title: 'Fire Extinguisher Compliance Report',
    description:
      'Includes stock total, expired extinguishers count, inspection status, expired unit details, and maintenance history',
  },
];

export function ReportsPage() {
  const dispatch = useAppDispatch();
  const { downloading, error } = useAppSelector((state) => state.reports);
  const [format, setFormat] = useState<ReportFormat>('csv');
  const [downloadingType, setDownloadingType] = useState<ReportType | null>(null);

  /**
   * Triggers report generation and download
   * - Dispatches API call to generate report in selected format
   * - Downloads file automatically when ready
   * - Report covers last 90 days by default
   */
  const handleDownload = async (type: ReportType) => {
    setDownloadingType(type);
    const result = await dispatch(downloadReport({ type, params: { format, days: '90' } }));
    if (downloadReport.fulfilled.match(result)) {
      downloadBlob(result.payload.blob, result.payload.filename);
    }
    setDownloadingType(null);
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Reports"
        description="Export the required compliance report as PDF, Excel, or CSV"
        action={
          <div className="w-40">
            <Select
              label="Format"
              value={format}
              onChange={(e) => setFormat(e.target.value as ReportFormat)}
              options={[
                { value: 'csv', label: 'CSV' },
                { value: 'xlsx', label: 'XLSX' },
                { value: 'pdf', label: 'PDF' },
              ]}
            />
          </div>
        }
      />

      {error && <p className="mb-4 text-sm text-ember-600">{error}</p>}

      {/* ── Report cards grid ──────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.type} title={report.title} description={report.description}>
            {/* Report contents preview */}
            <div className="mb-4 grid gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <span>✓ Total number of extinguishers in stock</span>
              <span>✓ Expired extinguishers count</span>
              <span>✓ Inspection status breakdown</span>
              <span>✓ Expired unit details</span>
              <span>✓ Maintenance history logs</span>
            </div>
            <Button
              loading={downloading && downloadingType === report.type}
              onClick={() => handleDownload(report.type)}
            >
              Download {format.toUpperCase()}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
