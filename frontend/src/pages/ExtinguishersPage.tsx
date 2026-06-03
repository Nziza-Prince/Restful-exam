import { useEffect, useState } from 'react';
import { Badge, DataTable, PageHeader, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import type { ExtinguisherStatus, FireExtinguisher } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  assignExtinguisher,
  buyExtinguisher,
  createExtinguisher,
  deleteExtinguisher,
  fetchExtinguishers,
  updateExtinguisher,
} from '@/store/slices/extinguisherSlice';
import { fetchCustomers } from '@/store/slices/customerSlice';
import { formatDate } from '@/utils';

const statusTone = (status: ExtinguisherStatus) => {
  if (status === 'EXPIRED') return 'danger';
  if (status === 'EXPIRING_SOON') return 'warning';
  if (status === 'RENEWED') return 'success';
  return 'info';
};

const emptyForm = {
  serialNumber: '',
  type: '',
  capacity: '',
  purchaseDate: '',
  expiryDate: '',
  customerId: '',
  status: 'ACTIVE' as ExtinguisherStatus,
};

// Returns today's date as YYYY-MM-DD for max/comparison
function today() {
  return new Date().toISOString().split('T')[0];
}

export function ExtinguishersPage() {
  const dispatch = useAppDispatch();
  const { isAdmin } = useAuth();
  const { items, meta, loading, saving, error } = useAppSelector((state) => state.extinguishers);
  const customers = useAppSelector((state) => state.customers.items);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FireExtinguisher | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<{ purchaseDate?: string; expiryDate?: string }>({});
  const [tab, setTab] = useState<'mine' | 'available'>('mine');

  // Assign modal state
  const [assignTarget, setAssignTarget] = useState<FireExtinguisher | null>(null);
  const [assignCustomerId, setAssignCustomerId] = useState('');
  const [assignError, setAssignError] = useState('');

  const reload = () =>
    dispatch(
      fetchExtinguishers({
        scope: isAdmin ? 'admin' : tab === 'mine' ? 'customer' : 'admin',
        page,
        limit: 10,
        search: search || undefined,
        status: (status as ExtinguisherStatus) || undefined,
      }),
    );

  useEffect(() => {
    reload();
  }, [dispatch, isAdmin, tab, page, search, status]);

  useEffect(() => {
    if (isAdmin) dispatch(fetchCustomers({ page: 1, limit: 100 }));
  }, [dispatch, isAdmin]);

  const validateDates = (f: typeof form) => {
    const errors: { purchaseDate?: string; expiryDate?: string } = {};
    const todayStr = today();

    if (f.purchaseDate && f.purchaseDate > todayStr) {
      errors.purchaseDate = 'Purchase date cannot be a future date.';
    }
    if (f.purchaseDate && f.expiryDate && f.expiryDate <= f.purchaseDate) {
      errors.expiryDate = 'Expiry date must be after the purchase date.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (item: FireExtinguisher) => {
    setEditing(item);
    setForm({
      serialNumber: item.serialNumber,
      type: item.type,
      capacity: item.capacity,
      purchaseDate: item.purchaseDate,
      expiryDate: item.expiryDate,
      customerId: item.customerId || '',
      status: item.status,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!validateDates(form)) return;

    if (editing) {
      await dispatch(updateExtinguisher({ id: editing.id, payload: form }));
    } else {
      // Strip `status` (server computes from expiryDate) and omit empty customerId
      const { status: _s, customerId, ...rest } = form;
      await dispatch(createExtinguisher({ ...rest, customerId: customerId || undefined }));
    }
    setModalOpen(false);
    reload();
  };

  const handleAssign = async () => {
    if (!assignTarget) return;
    if (!assignCustomerId) {
      setAssignError('Please select a customer.');
      return;
    }
    setAssignError('');
    const result = await dispatch(assignExtinguisher({ id: assignTarget.id, customerId: assignCustomerId }));
    if (assignExtinguisher.fulfilled.match(result)) {
      setAssignTarget(null);
      setAssignCustomerId('');
      reload();
    } else {
      setAssignError((result.payload as string) || 'Assignment failed.');
    }
  };

  const adminColumns: Column<FireExtinguisher>[] = [
    { key: 'serialNumber', header: 'Serial' },
    { key: 'type', header: 'Type' },
    { key: 'capacity', header: 'Capacity' },
    {
      key: 'expiryDate',
      header: 'Expiry',
      render: (row) => <span className="font-mono text-xs">{formatDate(row.expiryDate)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
    },
    {
      key: 'assignment',
      header: 'Assignment',
      render: (row) =>
        row.customerId ? (
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {customers.find((c) => c.id === row.customerId)?.fullName ?? '—'}
          </span>
        ) : (
          <Badge tone="neutral">Unassigned</Badge>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setAssignTarget(row);
              setAssignCustomerId(row.customerId || '');
              setAssignError('');
            }}
          >
            {row.customerId ? 'Reassign' : 'Assign'}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => dispatch(deleteExtinguisher(row.id))}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const customerAvailableColumns: Column<FireExtinguisher>[] = [
    { key: 'serialNumber', header: 'Serial' },
    { key: 'type', header: 'Type' },
    { key: 'capacity', header: 'Capacity' },
    {
      key: 'expiryDate',
      header: 'Expiry',
      render: (row) => <span className="font-mono text-xs">{formatDate(row.expiryDate)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button
          size="sm"
          onClick={async () => {
            await dispatch(buyExtinguisher(row.id));
            reload();
          }}
        >
          Buy
        </Button>
      ),
    },
  ];

  const customerMineColumns: Column<FireExtinguisher>[] = [
    { key: 'serialNumber', header: 'Serial' },
    { key: 'type', header: 'Type' },
    { key: 'capacity', header: 'Capacity' },
    {
      key: 'expiryDate',
      header: 'Expiry',
      render: (row) => <span className="font-mono text-xs">{formatDate(row.expiryDate)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
    },
  ];

  const columns = isAdmin
    ? adminColumns
    : tab === 'available'
    ? customerAvailableColumns
    : customerMineColumns;

  return (
    <div className="page-container">
      <PageHeader
        title={
          isAdmin
            ? 'Extinguishers'
            : tab === 'mine'
            ? 'My Extinguishers'
            : 'Browse Extinguishers'
        }
        description={
          isAdmin
            ? 'Manage and assign fire extinguisher inventory'
            : tab === 'mine'
            ? 'Your registered fire extinguishers'
            : 'Available extinguishers you can acquire'
        }
        action={isAdmin ? <Button onClick={openCreate}>Register Extinguisher</Button> : undefined}
      />

      {/* Customer tabs */}
      {!isAdmin && (
        <div className="mb-4 flex border-b border-zinc-200 dark:border-zinc-800">
          {(['mine', 'available'] as const).map((t) => (
            <button
              key={t}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-150 ${
                tab === t
                  ? 'border-fire-700 text-fire-700 dark:text-fire-500'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              onClick={() => { setTab(t); setPage(1); }}
            >
              {t === 'mine' ? 'My Extinguishers' : 'Available to Buy'}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          placeholder="Search serial or type…"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
        />
        <Select
          label="Status filter"
          value={status}
          onChange={(e) => { setPage(1); setStatus(e.target.value); }}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'EXPIRING_SOON', label: 'Expiring Soon' },
            { value: 'EXPIRED', label: 'Expired' },
            { value: 'RENEWED', label: 'Renewed' },
          ]}
        />
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        rowKey={(row) => row.id}
        page={meta?.page}
        totalPages={meta?.totalPages}
        onPageChange={setPage}
      />

      {/* ── Register / Edit modal ─────────────────────────────────── */}
      {isAdmin && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? 'Edit Extinguisher' : 'Register Extinguisher'}
          footer={
            <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button loading={saving} onClick={handleSave}>
                {editing ? 'Save Changes' : 'Register'}
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <Input
              label="Serial number"
              value={form.serialNumber}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              required
            />
            <Input
              label="Type"
              placeholder="e.g. CO2, Dry Chemical, Water"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              required
            />
            <Input
              label="Capacity"
              placeholder="e.g. 6kg, 9L"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              required
            />
            <Input
              label="Purchase date"
              type="date"
              max={today()}
              value={form.purchaseDate}
              onChange={(e) => {
                const updated = { ...form, purchaseDate: e.target.value };
                setForm(updated);
                validateDates(updated);
              }}
              error={formErrors.purchaseDate}
              required
            />
            <Input
              label="Expiry date"
              type="date"
              min={form.purchaseDate ? form.purchaseDate : undefined}
              value={form.expiryDate}
              onChange={(e) => {
                const updated = { ...form, expiryDate: e.target.value };
                setForm(updated);
                validateDates(updated);
              }}
              error={formErrors.expiryDate}
              required
            />
            {editing && (
              <Select
                label="Assigned customer"
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                options={[
                  { value: '', label: 'Unassigned' },
                  ...customers.map((c) => ({ value: c.id, label: c.fullName })),
                ]}
              />
            )}
            {editing && (
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ExtinguisherStatus })}
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'EXPIRING_SOON', label: 'Expiring Soon' },
                  { value: 'EXPIRED', label: 'Expired' },
                  { value: 'RENEWED', label: 'Renewed' },
                ]}
              />
            )}
          </div>
        </Modal>
      )}

      {/* ── Assign modal ──────────────────────────────────────────── */}
      {isAdmin && (
        <Modal
          open={!!assignTarget}
          onClose={() => { setAssignTarget(null); setAssignCustomerId(''); setAssignError(''); }}
          title={assignTarget?.customerId ? 'Reassign Extinguisher' : 'Assign Extinguisher'}
          description={
            assignTarget
              ? `Serial: ${assignTarget.serialNumber} — ${assignTarget.type} ${assignTarget.capacity}`
              : undefined
          }
          size="sm"
          footer={
            <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
              <Button
                variant="secondary"
                onClick={() => { setAssignTarget(null); setAssignCustomerId(''); setAssignError(''); }}
              >
                Cancel
              </Button>
              <Button loading={saving} onClick={handleAssign}>
                {assignTarget?.customerId ? 'Reassign' : 'Assign'}
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            {assignTarget?.customerId && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
                Currently assigned to:{' '}
                <strong>
                  {customers.find((c) => c.id === assignTarget.customerId)?.fullName ??
                    assignTarget.customerId}
                </strong>
              </div>
            )}
            <Select
              label="Select customer"
              value={assignCustomerId}
              onChange={(e) => { setAssignCustomerId(e.target.value); setAssignError(''); }}
              options={[
                { value: '', label: 'Choose a customer…' },
                ...customers.map((c) => ({ value: c.id, label: `${c.fullName} (${c.email})` })),
              ]}
              error={assignError || undefined}
            />
            <p className="text-xs text-zinc-400">
              The customer will receive an email notification confirming the assignment.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
