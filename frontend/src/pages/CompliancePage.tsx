import { useEffect, useState } from 'react';
import { Badge, DataTable, PageHeader, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Select, TextArea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import type { CaseStatus, ComplianceCase } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  closeComplianceCase,
  createComplianceCase,
  deleteComplianceCase,
  fetchComplianceCases,
  updateComplianceCase,
} from '@/store/slices/complianceSlice';
import { fetchCustomers } from '@/store/slices/customerSlice';
import { fetchExtinguishers } from '@/store/slices/extinguisherSlice';
import { formatDate, formatDateTime } from '@/utils';

const statusTone = (status: CaseStatus) => {
  if (status === 'CLOSED') return 'success';
  if (status === 'ESCALATED' || status === 'FINAL_WARNING') return 'danger';
  if (status === 'WARNING_SENT') return 'warning';
  return 'info';
};

const emptyForm = {
  customerId: '',
  extinguisherId: '',
  caseStatus: 'OPEN' as CaseStatus,
  notes: '',
};

export function CompliancePage() {
  const dispatch = useAppDispatch();
  const { items, meta, loading, saving, error } = useAppSelector((state) => state.compliance);
  const customers = useAppSelector((state) => state.customers.items);
  const extinguishers = useAppSelector((state) => state.extinguishers.items);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ComplianceCase | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    dispatch(
      fetchComplianceCases({
        page,
        limit: 10,
        caseStatus: (statusFilter as CaseStatus) || undefined,
      }),
    );
  }, [dispatch, page, statusFilter]);

  useEffect(() => {
    dispatch(fetchCustomers({ page: 1, limit: 100 }));
    dispatch(fetchExtinguishers({ scope: 'admin', page: 1, limit: 100 }));
  }, [dispatch]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: ComplianceCase) => {
    setEditing(item);
    setForm({
      customerId: item.customerId,
      extinguisherId: item.extinguisherId,
      caseStatus: item.caseStatus,
      notes: item.notes ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (editing) {
      await dispatch(
        updateComplianceCase({
          id: editing.id,
          payload: { caseStatus: form.caseStatus, notes: form.notes },
        }),
      );
    } else {
      await dispatch(createComplianceCase(form));
    }
    setModalOpen(false);
    dispatch(fetchComplianceCases({ page, limit: 10 }));
  };

  const columns: Column<ComplianceCase>[] = [
    {
      key: 'caseStatus',
      header: 'Status',
      render: (row) => <Badge tone={statusTone(row.caseStatus)}>{row.caseStatus}</Badge>,
    },
    {
      key: 'customerId',
      header: 'Customer',
      render: (row) => customers.find((c) => c.id === row.customerId)?.fullName ?? row.customerId.slice(0, 8),
    },
    {
      key: 'extinguisherId',
      header: 'Extinguisher',
      render: (row) =>
        extinguishers.find((e) => e.id === row.extinguisherId)?.serialNumber ??
        row.extinguisherId.slice(0, 8),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (row) => row.notes ?? '—',
    },
    {
      key: 'createdAt',
      header: 'Opened',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'closedAt',
      header: 'Closed',
      render: (row) => formatDateTime(row.closedAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
            Edit
          </Button>
          {row.caseStatus !== 'CLOSED' && (
            <Button
              size="sm"
              onClick={() => dispatch(closeComplianceCase({ id: row.id, notes: 'Closed from portal' }))}
            >
              Close
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={() => dispatch(deleteComplianceCase(row.id))}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Compliance Cases"
        description="Track non-compliance incidents and escalation workflow"
        action={<Button onClick={openCreate}>Open Case</Button>}
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
            { value: 'OPEN', label: 'Open' },
            { value: 'WARNING_SENT', label: 'Warning Sent' },
            { value: 'FINAL_WARNING', label: 'Final Warning' },
            { value: 'ESCALATED', label: 'Escalated' },
            { value: 'CLOSED', label: 'Closed' },
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
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Update Case' : 'Open Compliance Case'}
        footer={
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleSave}>
              Save
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {!editing && (
            <>
              <Select
                label="Customer"
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                options={[
                  { value: '', label: 'Select customer' },
                  ...customers.map((c) => ({ value: c.id, label: c.fullName })),
                ]}
              />
              <Select
                label="Extinguisher"
                value={form.extinguisherId}
                onChange={(e) => setForm({ ...form, extinguisherId: e.target.value })}
                options={[
                  { value: '', label: 'Select extinguisher' },
                  ...extinguishers.map((e) => ({ value: e.id, label: e.serialNumber })),
                ]}
              />
            </>
          )}
          <Select
            label="Case status"
            value={form.caseStatus}
            onChange={(e) => setForm({ ...form, caseStatus: e.target.value as CaseStatus })}
            options={[
              { value: 'OPEN', label: 'Open' },
              { value: 'WARNING_SENT', label: 'Warning Sent' },
              { value: 'FINAL_WARNING', label: 'Final Warning' },
              { value: 'ESCALATED', label: 'Escalated' },
              { value: 'CLOSED', label: 'Closed' },
            ]}
          />
          <TextArea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
