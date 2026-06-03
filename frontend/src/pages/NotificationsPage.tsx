import { useEffect, useState } from 'react';
import { Badge, DataTable, PageHeader, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import type { Notification } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchNotifications, markNotificationRead } from '@/store/slices/notificationSlice';
import { formatDateTime } from '@/utils';

export function NotificationsPage() {
  const dispatch = useAppDispatch();
  const { isAdmin } = useAuth();
  const { items, meta, loading, error } = useAppSelector((state) => state.notifications);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(
      fetchNotifications({
        scope: isAdmin ? 'admin' : 'customer',
        page,
        limit: 10,
      }),
    );
  }, [dispatch, isAdmin, page]);

  const columns: Column<Notification>[] = [
    {
      key: 'message',
      header: 'Message',
      render: (row) => (
        <span className={row.readAt ? 'text-zinc-400 dark:text-zinc-500' : 'font-medium text-zinc-900 dark:text-zinc-100'}>{row.message}</span>
      ),
    },
    { key: 'type', header: 'Type' },
    { key: 'channel', header: 'Channel' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.readAt ? 'neutral' : 'warning'}>
          {row.readAt ? 'Read' : 'Unread'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Sent',
      render: (row) => formatDateTime(row.sentAt ?? row.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) =>
        !row.readAt ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => dispatch(markNotificationRead({ id: row.id, isAdmin }))}
          >
            Mark read
          </Button>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Notifications"
        description="View alerts about expiring extinguishers and renewal updates"
      />

      {error && <p className="mb-3 text-sm text-ember-600">{error}</p>}

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        rowKey={(row) => row.id}
        page={meta?.page}
        totalPages={meta?.totalPages}
        onPageChange={setPage}
        emptyMessage="No notifications yet"
      />
    </div>
  );
}
