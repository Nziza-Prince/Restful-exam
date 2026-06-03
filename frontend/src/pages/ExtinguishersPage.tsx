import { useEffect, useState } from 'react';
import { Badge, DataTable, PageHeader, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { extinguisherService } from '@/services/extinguisherService';
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
  location: '',
  size: '',
  installationDate: '',
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
  const { isAdmin, isInspector } = useAuth();
  const { items, meta, loading, saving, error } = useAppSelector((state) => state.extinguishers);
  const customers = useAppSelector((state) => state.customers.items);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FireExtinguisher | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<{ installationDate?: string; expiryDate?: string }>({});
  const [tab, setTab] = useState<'mine' | 'available'>('mine');
  const [details, setDetails] = useState<FireExtinguisher | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [inspectionTarget, setInspectionTarget] = useState<FireExtinguisher | null>(null);
  const [inspectionDateTime, setInspectionDateTime] = useState('');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [inspectionSaving, setInspectionSaving] = useState(false);
  const [inspectionError, setInspectionError] = useState('');
  const [inspectionMessage, setInspectionMessage] = useState('');

  // Assign modal state
  const [assignTarget, setAssignTarget] = useState<FireExtinguisher | null>(null);
  const [assignCustomerId, setAssignCustomerId] = useState('');
  const [assignError, setAssignError] = useState('');

  const reload = () =>
    dispatch(
      fetchExtinguishers({
        scope: isAdmin || isInspector ? 'admin' : tab === 'mine' ? 'customer' : 'admin',
        page,
        limit: 10,
        search: search || undefined,
        status: (status as ExtinguisherStatus) || undefined,
      }),
    );

  useEffect(() => {
    reload();
  }, [dispatch, isAdmin, isInspector, tab, page, search, status]);

  useEffect(() => {
    if (isAdmin) dispatch(fetchCustomers({ page: 1, limit: 100 }));
  }, [dispatch, isAdmin]);

  const validateDates = (f: typeof form) => {
    const errors: { installationDate?: string; expiryDate?: string } = {};
    const todayStr = today();

    if (f.installationDate && f.installationDate > todayStr) {
      errors.installationDate = 'Installation date cannot be a future date.';
    }
    if (f.installationDate && f.expiryDate && f.expiryDate <= f.installationDate) {
      errors.expiryDate = 'Expiry date must be after the installation date.';
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
      location: item.location,
      size: item.size,
      installationDate: item.installationDate,
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
      const { customerId, ...rest } = form;
      await dispatch(createExtinguisher({ ...rest, customerId: customerId || undefined }));
    }
    setModalOpen(false);
    reload();
  };

  const openDetails = async (row: FireExtinguisher) => {
    setDetails(row);
    setDetailsError('');
    setDetailsLoading(true);
    try {
      setDetails(await extinguisherService.getById(row.id));
    } catch (error) {
      setDetailsError((error as Error).message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const openInspection = (row: FireExtinguisher) => {
    setInspectionTarget(row);
    setInspectionDateTime('');
    setInspectionNotes('');
    setInspectionError('');
    setInspectionMessage('');
  };

  const scheduleInspection = async () => {
    if (!inspectionTarget) return;
    if (!inspectionDateTime) {
      setInspectionError('Choose an inspection date and time.');
      return;
    }

    setInspectionSaving(true);
    setInspectionError('');
    setInspectionMessage('');

    try {
      await extinguisherService.scheduleInspection(inspectionTarget.id, {
        scheduledAt: new Date(inspectionDateTime).toISOString(),
        notes: inspectionNotes || undefined,
      });
      setInspectionMessage('Inspection scheduled successfully.');
    } catch (error) {
      setInspectionError((error as Error).message);
    } finally {
      setInspectionSaving(false);
    }
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
    { key: 'location', header: 'Location' },
    { key: 'size', header: 'Size' },
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
          <Button size="sm" variant="secondary" onClick={() => openDetails(row)}>
            View
          </Button>
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
    { key: 'location', header: 'Location' },
    {
      key: 'owner',
      header: 'Owner',
      render: (row) =>
        row.customerId ? (
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {row.customer?.fullName ?? customers.find((c) => c.id === row.customerId)?.fullName ?? 'Assigned'}
          </span>
        ) : (
          <Badge tone="neutral">Unassigned</Badge>
        ),
    },
    { key: 'size', header: 'Size' },
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
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => openDetails(row)}>
            View
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              await dispatch(buyExtinguisher(row.id));
              reload();
            }}
          >
            Buy
          </Button>
        </div>
      ),
    },
  ];

  const customerMineColumns: Column<FireExtinguisher>[] = [
    { key: 'serialNumber', header: 'Serial' },
    { key: 'type', header: 'Type' },
    { key: 'location', header: 'Location' },
    { key: 'size', header: 'Size' },
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
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => openDetails(row)}>
            View
          </Button>
        </div>
      ),
    },
  ];

  const inspectorColumns: Column<FireExtinguisher>[] = [
    { key: 'serialNumber', header: 'Serial' },
    { key: 'type', header: 'Type' },
    { key: 'location', header: 'Location' },
    { key: 'size', header: 'Size' },
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
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => openDetails(row)}>
            View
          </Button>
          <Button size="sm" onClick={() => openInspection(row)}>
            Schedule
          </Button>
        </div>
      ),
    },
  ];

  const columns = isAdmin
    ? adminColumns
    : isInspector
    ? inspectorColumns
    : tab === 'available'
    ? customerAvailableColumns
    : customerMineColumns;

  return (
    <div className="page-container">
      <PageHeader
        title={
          isAdmin
            ? 'Extinguishers'
            : isInspector
            ? 'Extinguishers'
            : tab === 'mine'
            ? 'My Extinguishers'
            : 'Browse Extinguishers'
        }
        description={
          isAdmin
            ? 'Manage and assign fire extinguisher inventory'
            : isInspector
            ? 'Review assigned extinguisher details'
            : tab === 'mine'
            ? 'Your registered fire extinguishers'
            : 'Available extinguishers you can acquire'
        }
        action={isAdmin ? <Button onClick={openCreate}>Register Extinguisher</Button> : undefined}
      />

      {/* Customer tabs */}
      {!isAdmin && !isInspector && (
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
            <Select
              label="Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={[
                { value: '', label: 'Select type' },
                { value: 'Water', label: 'Water' },
                { value: 'CO2', label: 'CO2' },
                { value: 'Foam', label: 'Foam' },
                { value: 'Dry Chemical', label: 'Dry Chemical' },
              ]}
              required
            />
            <Input
              label="Location"
              placeholder="Building A - Lobby"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            />
            <Select
              label="Size"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
              options={[
                { value: '', label: 'Select size' },
                { value: '2.5lbs', label: '2.5lbs' },
                { value: '5lbs', label: '5lbs' },
                { value: '9lbs', label: '9lbs' },
                { value: '12lbs', label: '12lbs' },
              ]}
              required
            />
            <Input
              label="Installation date"
              type="date"
              max={today()}
              value={form.installationDate}
              onChange={(e) => {
                const updated = { ...form, installationDate: e.target.value };
                setForm(updated);
                validateDates(updated);
              }}
              error={formErrors.installationDate}
              required
            />
            <Input
              label="Expiry date"
              type="date"
              min={form.installationDate ? form.installationDate : undefined}
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
          </div>
        </Modal>
      )}

      <Modal
        open={!!details}
        onClose={() => {
          setDetails(null);
          setDetailsError('');
        }}
        title="Extinguisher Details"
        description={details ? `Serial: ${details.serialNumber}` : undefined}
        size="lg"
      >
        {detailsError && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            {detailsError}
          </p>
        )}
        {detailsLoading && <p className="text-sm text-zinc-500">Loading latest details...</p>}
        {details && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="Serial number" value={details.serialNumber} />
            <Detail label="Status" value={details.status} />
            <Detail label="Type" value={details.type} />
            <Detail label="Size" value={details.size} />
            <Detail label="Location" value={details.location} />
            <Detail label="Assigned to" value={customers.find((c) => c.id === details.customerId)?.fullName ?? (details.customerId ? details.customerId : 'Unassigned')} />
            <Detail label="Installation date" value={formatDate(details.installationDate)} />
            <Detail label="Expiry date" value={formatDate(details.expiryDate)} />
            <Detail label="Created" value={formatDate(details.createdAt)} />
            <Detail label="Last updated" value={formatDate(details.updatedAt)} />
          </div>
        )}
      </Modal>

      <Modal
        open={!!inspectionTarget}
        onClose={() => setInspectionTarget(null)}
        title="Schedule Inspection"
        description={
          inspectionTarget
            ? `${inspectionTarget.serialNumber} - ${inspectionTarget.location}`
            : undefined
        }
        footer={
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <Button variant="secondary" onClick={() => setInspectionTarget(null)}>
              Close
            </Button>
            <Button loading={inspectionSaving} onClick={scheduleInspection}>
              Schedule inspection
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {inspectionError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              {inspectionError}
            </p>
          )}
          {inspectionMessage && (
            <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400">
              {inspectionMessage}
            </p>
          )}
          <Input
            label="Inspection date and time"
            type="datetime-local"
            value={inspectionDateTime}
            min={new Date().toISOString().slice(0, 16)}
            onChange={(e) => {
              setInspectionDateTime(e.target.value);
              setInspectionError('');
            }}
            required
          />
          <TextArea
            label="Notes"
            value={inspectionNotes}
            onChange={(e) => setInspectionNotes(e.target.value)}
            placeholder="Access instructions, preferred inspector, or safety notes"
          />
        </div>
      </Modal>

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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/50">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}
