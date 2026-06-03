import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import type { ReportFormat, ReportType } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { downloadReport } from '@/store/slices/reportSlice';
import { downloadBlob } from '@/utils';

const reports: { type: ReportType; title: string; description: string }[] = [
  {
    type: 'expired-extinguishers',
    title: 'Expired Extinguishers',
    description: 'All extinguishers past their expiry date',
  },
  {
    type: 'expiring-soon',
    title: 'Expiring Soon',
    description: 'Units approaching expiry within configured window',
  },
  {
    type: 'customer-compliance',
    title: 'Customer Compliance',
    description: 'Compliance summary across customers',
  },
  {
    type: 'renewal-requests',
    title: 'Renewal Requests',
    description: 'Pending and completed renewal activity',
  },
  {
    type: 'notifications',
    title: 'Notifications',
    description: 'Notification delivery history',
  },
  {
    type: 'daily',
    title: 'Daily Extinguisher Report',
    description: 'Daily registration and stock activity',
  },
  {
    type: 'monthly',
    title: 'Monthly Extinguisher Report',
    description: 'Monthly extinguisher trends',
  },
  {
    type: 'yearly',
    title: 'Yearly Extinguisher Report',
    description: 'Yearly extinguisher trends',
  },
  {
    type: 'inspection-status',
    title: 'Inspection Status',
    description: 'Scheduled, completed, and cancelled inspections',
  },
  {
    type: 'maintenance-history',
    title: 'Maintenance History',
    description: 'Inspector maintenance action history',
  },
];

export function ReportsPage() {
  const dispatch = useAppDispatch();
  const { downloading, error } = useAppSelector((state) => state.reports);
  const [format, setFormat] = useState<ReportFormat>('csv');
  const [downloadingType, setDownloadingType] = useState<ReportType | null>(null);

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
        description="Export operational data as PDF, Excel, or CSV"
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

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.type} title={report.title} description={report.description}>
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
