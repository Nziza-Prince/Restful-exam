import { useEffect, useMemo, useState } from 'react';
import { Badge, DataTable, PageHeader, type Column } from '@/components/ui/DataTable';
import { extinguisherService } from '@/services/extinguisherService';
import type { FireExtinguisher, MaintenanceLog } from '@/types';
import { formatDate } from '@/utils';

export function MaintenanceHistoryPage() {
  const [rows, setRows] = useState<MaintenanceLog[]>([]);
  const [extinguishers, setExtinguishers] = useState<FireExtinguisher[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const extinguisherById = useMemo(
    () => new Map(extinguishers.map((item) => [item.id, item])),
    [extinguishers],
  );

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [maintenance, inventory] = await Promise.all([
        extinguisherService.listAllMaintenance({ page, limit: 10 }),
        extinguisherService.listAll({ page: 1, limit: 100 }),
      ]);
      setRows(maintenance.data);
      setTotalPages(maintenance.meta.totalPages);
      setExtinguishers(inventory.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const columns: Column<MaintenanceLog>[] = [
    {
      key: 'extinguisher',
      header: 'Extinguisher',
      render: (row) => {
        const extinguisher = extinguisherById.get(row.extinguisherId);
        return (
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {extinguisher?.serialNumber ?? row.extinguisherId.slice(0, 8)}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {extinguisher ? `${extinguisher.type} - ${extinguisher.location}` : 'Details unavailable'}
            </p>
          </div>
        );
      },
    },
    { key: 'actionDate', header: 'Date of Action', render: (row) => <span className="font-mono text-xs">{formatDate(row.actionDate)}</span> },
    { key: 'actionsTaken', header: 'Actions Taken' },
    { key: 'conditionsNoted', header: 'Conditions Noted' },
    { key: 'loggedBy', header: 'Logged By', render: (row) => <Badge tone="neutral">{row.loggedBy.slice(0, 8)}</Badge> },
  ];

  return (
    <div className="page-container">
      <PageHeader title="Maintenance History" description="All maintenance actions logged by inspectors and admins" />
      {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        rowKey={(row) => row.id}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No maintenance logs found"
      />
    </div>
  );
}
