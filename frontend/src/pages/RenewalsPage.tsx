import { useEffect, useState } from 'react';
import { Badge, DataTable, PageHeader, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import type { RenewalRequest, RenewalRequestStatus, RenewalRequestType } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  approveRenewal,
  completeRenewal,
  createRenewal,
  fetchRenewals,
  rejectRenewal,
} from '@/store/slices/renewalSlice';
import { fetchExtinguishers } from '@/store/slices/extinguisherSlice';
import { formatDate } from '@/utils';

const statusTone = (status: RenewalRequestStatus) => {
  if (status === 'PENDING') return 'warning';
  if (status === 'APPROVED') return 'info';
  if (status === 'COMPLETED') return 'success';
  if (status === 'REJECTED') return 'danger';
  return 'neutral';
};

export function RenewalsPage() {
  const dispatch = useAppDispatch();
  const { isAdmin } = useAuth();
  const { items, meta, loading, saving, error } = useAppSelector((state) => state.renewals);
  const extinguishers = useAppSelector((state) => state.extinguishers.items);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState<RenewalRequest | null>(null);
  const [rejectOpen, setRejectOpen] = useState<RenewalRequest | null>(null);
  const [form, setForm] = useState({
    extinguisherId: '',
    requestType: 'SERVICE' as RenewalRequestType,
    description: '',
  });
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const reload = () =>
    dispatch(
      fetchRenewals({
        scope: isAdmin ? 'admin' : 'customer',
        page,
        limit: 10,
        status: (statusFilter as RenewalRequestStatus) || undefined,
      }),
    );

  useEffect(() => {
    reload();
  }, [dispatch, isAdmin, page, statusFilter]);

  useEffect(() => {
    if (!isAdmin) {
      dispatch(fetchExtinguishers({ scope: 'customer', page: 1, limit: 100 }));
    }
  }, [dispatch, isAdmin]);

  const columns: Column<RenewalRequest>[] = [
    { key: 'requestType', header: 'Type' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
    },
    { key: 'extinguisherId', header: 'Extinguisher', render: (row) => row.extinguisherId.slice(0, 8) },
    {
      key: 'description',
      header: 'Description',
      render: (row) => row.description ?? '—',
    },
    {
      key: 'createdAt',
      header: 'Submitted',
      render: (row) => formatDate(row.createdAt),
    },
    ...(isAdmin
      ? [
          {
            key: 'actions',
            header: 'Actions',
            render: (row: RenewalRequest) => (
              <div className="flex flex-wrap gap-2">
                {row.status === 'PENDING' && (
                  <>
                    <Button size="sm" onClick={() => dispatch(approveRenewal(row.id)).then(reload)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setRejectOpen(row)}>
                      Reject
                    </Button>
                  </>
                )}
                {row.status === 'APPROVED' && (
                  <Button size="sm" variant="secondary" onClick={() => setCompleteOpen(row)}>
                    Complete
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Renewals"
        description={
          isAdmin
            ? 'Review and process customer renewal requests'
            : 'Submit and track your extinguisher renewal requests'
        }
        action={
          !isAdmin ? (
            <Button onClick={() => setCreateOpen(true)}>New Request</Button>
          ) : undefined
        }
      />

      <div className="mb-4 max-w-xs">
        <Select
          label="Status filter"
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'REJECTED', label: 'Rejected' },
            { value: 'COMPLETED', label: 'Completed' },
          ]}
        />
      </div>

      {error && <p className="mb-3 text-sm text-ember-600">{error}</p>}

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        rowKey={(row) => row.id}
        page={meta?.page}
        totalPages={meta?.totalPages}
        onPageChange={setPage}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Submit Renewal Request"
        footer={
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={async () => {
                await dispatch(createRenewal(form));
                setCreateOpen(false);
                reload();
              }}
            >
              Submit
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Select
            label="Extinguisher"
            value={form.extinguisherId}
            onChange={(e) => setForm({ ...form, extinguisherId: e.target.value })}
            options={[
              { value: '', label: 'Select extinguisher' },
              ...extinguishers.map((e) => ({
                value: e.id,
                label: `${e.serialNumber} (${e.type})`,
              })),
            ]}
          />
          <Select
            label="Request type"
            value={form.requestType}
            onChange={(e) => setForm({ ...form, requestType: e.target.value as RenewalRequestType })}
            options={[
              { value: 'SERVICE', label: 'Service' },
              { value: 'REPLACEMENT', label: 'Replacement' },
              { value: 'INSPECTION', label: 'Inspection' },
            ]}
          />
          <TextArea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </Modal>

      <Modal
        open={!!completeOpen}
        onClose={() => setCompleteOpen(null)}
        title="Complete Renewal"
        footer={
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <Button variant="secondary" onClick={() => setCompleteOpen(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!completeOpen) return;
                await dispatch(
                  completeRenewal({
                    id: completeOpen.id,
                    payload: { newExpiryDate },
                  }),
                );
                setCompleteOpen(null);
                reload();
              }}
            >
              Complete
            </Button>
          </div>
        }
      >
        <Input
          label="New expiry date"
          type="date"
          value={newExpiryDate}
          onChange={(e) => setNewExpiryDate(e.target.value)}
        />
      </Modal>

      <Modal
        open={!!rejectOpen}
        onClose={() => setRejectOpen(null)}
        title="Reject Renewal"
        footer={
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <Button variant="secondary" onClick={() => setRejectOpen(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!rejectOpen) return;
                await dispatch(
                  rejectRenewal({
                    id: rejectOpen.id,
                    payload: { reason: rejectReason },
                  }),
                );
                setRejectOpen(null);
                reload();
              }}
            >
              Reject
            </Button>
          </div>
        }
      >
        <TextArea
          label="Reason (optional)"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
