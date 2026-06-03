import { useEffect, useState } from 'react';
import { Badge, DataTable, PageHeader, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { extinguisherService } from '@/services/extinguisherService';
import type { ExtinguisherInspection, InspectionStatus } from '@/types';
import { formatDate, formatDateTime } from '@/utils';
import { showToast } from '@/utils/toast';

const statusOptions: { value: '' | InspectionStatus; label: string }[] = [
  { value: '', label: 'Active requests' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED_PENDING_ADMIN_REVIEW', label: 'Awaiting admin review' },
  { value: 'REQUIRES_MAINTENANCE', label: 'Requires maintenance' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const tone = (status: InspectionStatus): 'neutral' | 'success' | 'warning' | 'danger' | 'info' => {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED' || status === 'REQUIRES_MAINTENANCE') return 'danger';
  if (status === 'IN_PROGRESS' || status === 'COMPLETED_PENDING_ADMIN_REVIEW') return 'info';
  return 'warning';
};

export function InspectionRequestsPage() {
  const [rows, setRows] = useState<ExtinguisherInspection[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<'' | InspectionStatus>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState<ExtinguisherInspection | null>(null);
  const [reportTarget, setReportTarget] = useState<ExtinguisherInspection | null>(null);
  const [condition, setCondition] = useState('');
  const [notes, setNotes] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [result, setResult] = useState('PASS');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [maintenanceTarget, setMaintenanceTarget] = useState<ExtinguisherInspection | null>(null);
  const [maintenanceActions, setMaintenanceActions] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [maintenanceConditions, setMaintenanceConditions] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await extinguisherService.listInspections({
        page,
        limit: 10,
        status: status || undefined,
      });
      setRows(result.data);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, status]);

  const openReport = (row: ExtinguisherInspection) => {
    setReportTarget(row);
    setCondition('');
    setNotes('');
    setActionsTaken('');
    setResult('PASS');
    setInspectionDate(new Date().toISOString().slice(0, 10));
  };

  const submitReport = async () => {
    if (!reportTarget) return;
    await extinguisherService.submitInspectionReport(reportTarget.id, {
      condition,
      notes: notes || undefined,
      actionsTaken,
      result,
      inspectionDate,
    });
    showToast('Inspection report submitted for admin review.');
    setReportTarget(null);
    await load();
  };

  const startInspection = async (row: ExtinguisherInspection) => {
    await extinguisherService.startInspection(row.id);
    showToast('Inspection started.');
    await load();
  };

  const openMaintenance = (row: ExtinguisherInspection) => {
    setMaintenanceTarget(row);
    setMaintenanceActions('');
    setMaintenanceDate(new Date().toISOString().slice(0, 10));
    setMaintenanceConditions('');
  };

  const submitMaintenance = async () => {
    if (!maintenanceTarget) return;
    await extinguisherService.logMaintenance(maintenanceTarget.extinguisherId, {
      actionsTaken: maintenanceActions,
      actionDate: maintenanceDate,
      conditionsNoted: maintenanceConditions,
    });
    showToast('Maintenance action logged.');
    setMaintenanceTarget(null);
    await load();
  };

  const columns: Column<ExtinguisherInspection>[] = [
    {
      key: 'extinguisher',
      header: 'Extinguisher',
      render: (row) => (
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            {row.extinguisher?.serialNumber ?? row.extinguisherId.slice(0, 8)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {row.extinguisher
              ? `${row.extinguisher.type} - ${row.extinguisher.location}`
              : 'Details unavailable'}
          </p>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {row.customer?.fullName ?? 'Unassigned'}
          </p>
          {row.customer?.email && <p className="text-xs text-zinc-500">{row.customer.email}</p>}
        </div>
      ),
    },
    {
      key: 'scheduledAt',
      header: 'Date and Time',
      render: (row) => <span className="font-mono text-xs">{formatDateTime(row.scheduledAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={tone(row.status)}>{row.status}</Badge>,
    },
    { key: 'notes', header: 'Notes', render: (row) => row.notes ?? '—' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => setDetails(row)}>
            Details
          </Button>
          {row.status === 'PENDING' && (
            <Button size="sm" onClick={() => startInspection(row)}>
              Start Inspection
            </Button>
          )}
          {row.status === 'IN_PROGRESS' && (
            <Button size="sm" onClick={() => openReport(row)}>
              Submit Report
            </Button>
          )}
          {['IN_PROGRESS', 'COMPLETED_PENDING_ADMIN_REVIEW', 'REQUIRES_MAINTENANCE'].includes(row.status) && (
            <Button size="sm" variant="secondary" onClick={() => openMaintenance(row)}>
              Add Maintenance
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader title="Inspection Requests" description="Pending and assigned inspection work" />

      <div className="mb-4 max-w-sm">
        <Select
          label="Status filter"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as '' | InspectionStatus);
          }}
          options={statusOptions}
        />
      </div>

      {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        rowKey={(row) => row.id}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No inspection requests found"
      />

      <Modal
        open={!!details}
        onClose={() => setDetails(null)}
        title="Inspection Request Details"
        description={details?.extinguisher?.serialNumber}
        size="lg"
      >
        {details && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="Serial number" value={details.extinguisher?.serialNumber} />
            <Detail label="Type" value={details.extinguisher?.type} />
            <Detail label="Location" value={details.extinguisher?.location} />
            <Detail label="Size" value={details.extinguisher?.size} />
            <Detail label="Expiry date" value={formatDate(details.extinguisher?.expiryDate)} />
            <Detail label="Current status" value={details.extinguisher?.status} />
            <Detail label="Owner/customer" value={details.customer?.fullName} />
            <Detail label="Owner email" value={details.customer?.email} />
            <Detail label="Requested date/time" value={formatDateTime(details.scheduledAt)} />
            <Detail label="Request status" value={details.status} />
          </div>
        )}
      </Modal>

      <Modal
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
        title="Submit Inspection Report"
        footer={
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <Button variant="secondary" onClick={() => setReportTarget(null)}>Cancel</Button>
            <Button onClick={submitReport}>Submit for admin review</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <TextArea label="Condition" value={condition} onChange={(e) => setCondition(e.target.value)} required />
          <TextArea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <TextArea label="Actions taken" value={actionsTaken} onChange={(e) => setActionsTaken(e.target.value)} required />
          <Select
            label="Result"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            options={[
              { value: 'PASS', label: 'Pass' },
              { value: 'FAIL', label: 'Fail' },
              { value: 'NEEDS_MAINTENANCE', label: 'Needs maintenance' },
            ]}
          />
          <Input label="Inspection date" type="date" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} required />
        </div>
      </Modal>

      <MaintenanceModal
        target={maintenanceTarget}
        actionsTaken={maintenanceActions}
        actionDate={maintenanceDate}
        conditionsNoted={maintenanceConditions}
        setActionsTaken={setMaintenanceActions}
        setActionDate={setMaintenanceDate}
        setConditionsNoted={setMaintenanceConditions}
        onClose={() => setMaintenanceTarget(null)}
        onSubmit={submitMaintenance}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/50">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{value || '—'}</p>
    </div>
  );
}

function MaintenanceModal({
  target,
  actionsTaken,
  actionDate,
  conditionsNoted,
  setActionsTaken,
  setActionDate,
  setConditionsNoted,
  onClose,
  onSubmit,
}: {
  target: ExtinguisherInspection | null;
  actionsTaken: string;
  actionDate: string;
  conditionsNoted: string;
  setActionsTaken: (value: string) => void;
  setActionDate: (value: string) => void;
  setConditionsNoted: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title="Log Maintenance"
      description={target?.extinguisher?.serialNumber}
      footer={
        <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit}>Save maintenance log</Button>
        </div>
      }
    >
      <div className="space-y-3">
        <TextArea label="Actions taken" value={actionsTaken} onChange={(e) => setActionsTaken(e.target.value)} required />
        <Input label="Date of the action" type="date" value={actionDate} onChange={(e) => setActionDate(e.target.value)} required />
        <TextArea label="Conditions noted during maintenance" value={conditionsNoted} onChange={(e) => setConditionsNoted(e.target.value)} required />
      </div>
    </Modal>
  );
}
