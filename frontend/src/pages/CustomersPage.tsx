import { useEffect, useState } from 'react';
import { DataTable, PageHeader, type Column } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import type { Customer } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCustomers } from '@/store/slices/customerSlice';
import { formatDate } from '@/utils';

export function CustomersPage() {
  const dispatch = useAppDispatch();
  const { items, meta, loading } = useAppSelector((state) => state.customers);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchCustomers({ page, limit: 10, search: search || undefined }));
  }, [dispatch, page, search]);

  const columns: Column<Customer>[] = [
    { key: 'fullName', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'createdAt',
      header: 'Registered',
      render: (row) => <span className="font-mono text-xs">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Users"
        description="People who created their own FEMS accounts"
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
    </div>
  );
}
