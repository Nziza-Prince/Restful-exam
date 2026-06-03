import { useEffect, useState } from 'react';
import { DataTable, PageHeader, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import type { Customer } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  createCustomer,
  deleteCustomer,
  fetchCustomers,
  updateCustomer,
} from '@/store/slices/customerSlice';
import { formatDate } from '@/utils';

const emptyForm = {
  fullName: '',
  nationalId: '',
  phone: '',
  email: '',
  address: '',
};

export function CustomersPage() {
  const dispatch = useAppDispatch();
  const { items, meta, loading, saving, error } = useAppSelector((state) => state.customers);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Create / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<{ phone?: string }>({});
  const [formApiError, setFormApiError] = useState('');

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const reload = () =>
    dispatch(fetchCustomers({ page, limit: 10, search: search || undefined }));

  useEffect(() => {
    reload();
  }, [dispatch, page, search]);

  // ── Form validation ─────────────────────────────────────────────────────
  const validateForm = () => {
    const errors: { phone?: string } = {};
    if (!/^\d{10}$/.test(form.phone)) {
      errors.phone = 'Phone must be exactly 10 digits (no spaces or dashes).';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Open create modal ───────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormApiError('');
    setModalOpen(true);
  };

  // ── Open edit modal ─────────────────────────────────────────────────────
  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setFormErrors({});
    setFormApiError('');
    setForm({
      fullName: customer.fullName,
      nationalId: customer.nationalId,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
    });
    setModalOpen(true);
  };

  // ── Save (create or update) ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!validateForm()) return;
    setFormApiError('');

    if (editing) {
      const result = await dispatch(updateCustomer({ id: editing.id, payload: form }));
      if (updateCustomer.fulfilled.match(result)) {
        // Success: close modal and pull fresh data from DB
        setModalOpen(false);
        reload();
      } else {
        // Keep modal open so user can correct the error
        const msg = (result.payload as string) || 'Failed to update customer.';
        setFormApiError(msg);
      }
    } else {
      const result = await dispatch(createCustomer(form));
      if (createCustomer.fulfilled.match(result)) {
        // Success: close modal and pull fresh data from DB
        setModalOpen(false);
        reload();
      } else {
        // Keep modal open so user can correct the error
        const msg = (result.payload as string) || 'Failed to create customer.';
        setFormApiError(msg);
      }
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');

    const result = await dispatch(deleteCustomer(deleteTarget.id));

    if (deleteCustomer.fulfilled.match(result)) {
      // Success: close modal and re-fetch from DB to confirm removal
      setDeleteTarget(null);
      reload();
    } else {
      // Show error inside the confirmation modal
      setDeleteError((result.payload as string) || 'Failed to delete customer.');
    }

    setDeleting(false);
  };

  // ── Table columns ───────────────────────────────────────────────────────
  const columns: Column<Customer>[] = [
    { key: 'fullName', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'nationalId', header: 'National ID' },
    {
      key: 'createdAt',
      header: 'Added',
      render: (row) => <span className="font-mono text-xs">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setDeleteError('');
              setDeleteTarget(row);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Customers"
        description="All registered customers — admin-created and self-registered"
        action={<Button onClick={openCreate}>Add Customer</Button>}
      />

      <div className="mb-4 max-w-md">
        <Input
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        rowKey={(row) => row.id}
        page={meta?.page}
        totalPages={meta?.totalPages}
        onPageChange={setPage}
        emptyMessage="No customers found"
      />

      {/* ── Create / Edit modal ───────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Customer' : 'Add Customer'}
        description={
          editing
            ? 'Changes are saved directly to the database.'
            : 'The new customer is saved immediately to the database and will appear in the list.'
        }
        footer={
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleSave}>
              {editing ? 'Save Changes' : 'Add Customer'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {/* API error shown inside the modal so user keeps their form data */}
          {formApiError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              {formApiError}
            </div>
          )}

          <Input
            label="Full name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
          />
          <Input
            label="National ID"
            value={form.nationalId}
            onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
            required
          />
          <Input
            label="Phone"
            placeholder="10 digits, e.g. 0788123456"
            value={form.phone}
            error={formErrors.phone}
            onChange={(e) => {
              setForm({ ...form, phone: e.target.value });
              if (formErrors.phone && /^\d{10}$/.test(e.target.value)) {
                setFormErrors({ ...formErrors, phone: undefined });
              }
            }}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <TextArea
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          />
        </div>
      </Modal>

      {/* ── Delete confirmation modal ─────────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Customer"
        size="sm"
        footer={
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Yes, Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Are you sure you want to permanently delete{' '}
            <strong className="text-zinc-900 dark:text-zinc-100">
              {deleteTarget?.fullName}
            </strong>
            ? This cannot be undone.
          </p>
          {deleteError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              {deleteError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
