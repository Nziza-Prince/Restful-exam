import { useEffect, useState } from 'react';
import { Badge, DataTable, PageHeader, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { userService, type CreateUserPayload } from '@/services/userService';
import type { PaginationMeta, User, UserRole } from '@/types';
import { formatDate } from '@/utils';
import { showToast } from '@/utils/toast';

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'user', label: 'User' },
  { value: 'inspector', label: 'Inspector' },
  { value: 'admin', label: 'Admin' },
];

const emptyForm: CreateUserPayload = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'user',
};

export function CustomersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [form, setForm] = useState<CreateUserPayload>(emptyForm);

  useEffect(() => {
    let ignore = false;

    async function loadUsers() {
      setLoading(true);
      try {
        const result = await userService.list({ page, limit: 10, search: search || undefined });
        if (!ignore) {
          setItems(result.data);
          setMeta(result.meta);
        }
      } catch (error) {
        if (!ignore) showToast((error as Error).message, 'error');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadUsers();
    return () => {
      ignore = true;
    };
  }, [page, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role,
    });
    setModalOpen(true);
  };

  const refreshUsers = async () => {
    const result = await userService.list({ page, limit: 10, search: search || undefined });
    setItems(result.data);
    setMeta(result.meta);
  };

  const saveUser = async () => {
    setSaving(true);
    try {
      if (editing) {
        const { password, ...profile } = form;
        await userService.update(editing.id, password ? form : profile);
        showToast('User updated.');
      } else {
        await userService.create(form);
        showToast('User created.');
      }
      setModalOpen(false);
      await refreshUsers();
    } catch (error) {
      showToast((error as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    if (!deleting) return;

    setSaving(true);
    try {
      await userService.remove(deleting.id);
      showToast('User deleted.');
      setDeleting(null);
      await refreshUsers();
    } catch (error) {
      showToast((error as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'fullName',
      header: 'Name',
      render: (row) => (
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">{row.fullName}</p>
          <p className="text-xs text-zinc-400">{row.id}</p>
        </div>
      ),
    },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Badge tone={row.role === 'admin' ? 'danger' : row.role === 'inspector' ? 'info' : 'neutral'}>
          {row.role}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Registered',
      render: (row) => <span className="font-mono text-xs">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleting(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Users"
        description="System users and their account details"
        action={
          <Button type="button" onClick={openCreate}>
            New user
          </Button>
        }
      />

      <div className="mb-4 max-w-md">
        <Input
          placeholder="Search by name or email..."
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
        emptyMessage="No users found"
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit user' : 'New user'}
        footer={
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" loading={saving} onClick={saveUser}>
              Save
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            value={form.firstName}
            onChange={(e) => setForm((value) => ({ ...value, firstName: e.target.value }))}
          />
          <Input
            label="Last name"
            value={form.lastName}
            onChange={(e) => setForm((value) => ({ ...value, lastName: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((value) => ({ ...value, email: e.target.value }))}
          />
          <Select
            label="Role"
            value={form.role}
            options={roleOptions}
            onChange={(e) =>
              setForm((value) => ({ ...value, role: e.target.value as UserRole }))
            }
          />
          <div className="sm:col-span-2">
            <Input
              label={editing ? 'New password' : 'Password'}
              type="password"
              placeholder={editing ? 'Leave blank to keep current password' : undefined}
              value={form.password}
              onChange={(e) => setForm((value) => ({ ...value, password: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete user"
        description={deleting ? `Delete ${deleting.fullName}? This cannot be undone.` : undefined}
        size="sm"
        footer={
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <Button variant="secondary" size="sm" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" loading={saving} onClick={deleteUser}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          The account will be removed from authentication and active refresh tokens will be revoked.
        </p>
      </Modal>
    </div>
  );
}
