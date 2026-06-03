import { useEffect, useState } from 'react';
import { Badge, DataTable, PageHeader, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Select, TextArea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { extinguisherService } from '@/services/extinguisherService';
import type { ExtinguisherInspection, InspectionStatus } from '@/types';
import { formatDateTime } from '@/utils';
import { showToast } from '@/utils/toast';

/**
 * INSPECTION REVIEWS PAGE
 * 
 * Purpose: Review inspection reports submitted by inspectors
 * 
 * Inspection = Safety check (visual inspection, pressure check, etc.)
 * - Inspectors look at extinguishers to verify they're safe
 * - Result: APPROVED (safe to use) or REJECTED (needs maintenance)
 * - No physical work done - just checking and reporting
 * 
 * This page allows admins to:
 * - Review submitted inspection reports
 * - Approve inspections if extinguisher is safe
 * - Reject inspections if issues found
 * - Flag for maintenance if repairs needed
 */

type ReviewStatus = 'APPROVED' | 'REJECTED' | 'REQUIRES_MAINTENANCE';

const statusOptions: { value: '' | InspectionStatus; label: string }[] = [
  { value: 'COMPLETED_PENDING_ADMIN_REVIEW', label: 'Awaiting review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'REQUIRES_MAINTENANCE', label: 'Requires maintenance' },
  { value: '', label: 'All statuses' },
];

export function InspectionReviewsPage() {
  const [rows, setRows] = useState<ExtinguisherInspection[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<'' | InspectionStatus>('COMPLETED_PENDING_ADMIN_REVIEW');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewTarget, setReviewTarget] = useState<ExtinguisherInspection | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');

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

  const openReview = (row: ExtinguisherInspection) => {
    setReviewTarget(row);
    setReviewStatus('APPROVED');
    setReviewNotes('');
  };

  const submitReview = async () => {
    if (!reviewTarget) return;
    await extinguisherService.reviewInspection(reviewTarget.id, {
      status: reviewStatus,
      notes: reviewNotes || undefined,
    });
    showToast(`Inspection report marked ${reviewStatus}.`);
    setReviewTarget(null);
    await load();
  };

  const columns: Column<ExtinguisherInspection>[] = [
    {
      key: 'extinguisher',
      header: 'Extinguisher',
      render: (row) => (
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{row.extinguisher?.serialNumber ?? row.extinguisherId.slice(0, 8)}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{row.extinguisher ? `${row.extinguisher.type} - ${row.extinguisher.location}` : 'Details unavailable'}</p>
        </div>
      ),
    },
    { key: 'owner', header: 'Owner', render: (row) => row.customer?.fullName ?? 'Unassigned' },
    { key: 'scheduledAt', header: 'Date and Time', render: (row) => <span className="font-mono text-xs">{formatDateTime(row.scheduledAt)}</span> },
    { key: 'status', header: 'Status', render: (row) => <Badge tone={row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'danger' : 'info'}>{row.status}</Badge> },
    { key: 'result', header: 'Result', render: (row) => row.result ?? '—' },
    { key: 'actionsTaken', header: 'Actions Taken', render: (row) => row.actionsTaken ?? '—' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => row.status === 'COMPLETED_PENDING_ADMIN_REVIEW' ? (
        <Button size="sm" onClick={() => openReview(row)}>Review</Button>
      ) : (
        <span className="text-xs text-zinc-400">Reviewed</span>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader title="Inspection Reviews" description="Approve, reject, or require follow-up maintenance" />
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
        emptyMessage="No inspection reports found"
      />

      <Modal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title="Review Inspection Report"
        description={reviewTarget?.extinguisher?.serialNumber}
        footer={
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <Button variant="secondary" onClick={() => setReviewTarget(null)}>Cancel</Button>
            <Button onClick={submitReview}>Submit review</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950/50">
            <p><span className="font-semibold">Condition:</span> {reviewTarget?.reportCondition ?? '—'}</p>
            <p className="mt-1"><span className="font-semibold">Actions taken:</span> {reviewTarget?.actionsTaken ?? '—'}</p>
            <p className="mt-1"><span className="font-semibold">Result:</span> {reviewTarget?.result ?? '—'}</p>
            <p className="mt-1"><span className="font-semibold">Notes:</span> {reviewTarget?.reportNotes ?? '—'}</p>
          </div>
          <Select
            label="Admin decision"
            value={reviewStatus}
            onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
            options={[
              { value: 'APPROVED', label: 'Approve' },
              { value: 'REJECTED', label: 'Reject' },
              { value: 'REQUIRES_MAINTENANCE', label: 'Requires follow-up maintenance' },
            ]}
          />
          <TextArea label="Review notes" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
