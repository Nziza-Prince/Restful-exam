import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatCard } from '@/components/ui/Card';
import { Card } from '@/components/ui/Card';
import { Badge, DataTable, PageHeader, type Column } from '@/components/ui/DataTable';
import { useAuth } from '@/hooks/useAuth';
import { customerService } from '@/services/customerService';
import { extinguisherService } from '@/services/extinguisherService';
import type { ExtinguisherInspection } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDashboardSummary, setDashboardCounts } from '@/store/slices/reportSlice';
import { formatDateTime, recordToChartData } from '@/utils';

// Cohesive chart palette — warm copper to amber to gold, no neon
const CHART_COLORS = ['#b45309', '#d97706', '#f59e0b', '#78350f', '#92400e'];

// Muted tooltip style to match the design system
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-md dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="font-mono text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {payload[0].value}
      </p>
    </div>
  );
}

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const { isAdmin, isInspector } = useAuth();
  const { dashboard, totalCustomers, totalExtinguishers, loading } = useAppSelector(
    (state) => state.reports,
  );
  const [inspectionRequests, setInspectionRequests] = useState<ExtinguisherInspection[]>([]);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [inspectionError, setInspectionError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (isAdmin) {
        dispatch(fetchDashboardSummary({ days: '90' }));
        const [customers, extinguishers] = await Promise.all([
          customerService.list({ page: 1, limit: 1 }),
          extinguisherService.listAll({ page: 1, limit: 1 }),
        ]);
        dispatch(
          setDashboardCounts({
            totalCustomers: customers.meta.total,
            totalExtinguishers: extinguishers.meta.total,
          }),
        );
      } else if (isInspector) {
        setInspectionLoading(true);
        setInspectionError('');
        try {
          const [extinguishers, inspections] = await Promise.all([
            extinguisherService.listAll({ page: 1, limit: 1 }),
            extinguisherService.listInspections({ page: 1, limit: 8 }),
          ]);
          setInspectionRequests(inspections.data);
          dispatch(
            setDashboardCounts({
              totalCustomers: 0,
              totalExtinguishers: extinguishers.meta.total,
            }),
          );
        } catch (error) {
          setInspectionError((error as Error).message);
        } finally {
          setInspectionLoading(false);
        }
      } else {
        const extinguishers = await extinguisherService.listMine({ page: 1, limit: 1 });
        dispatch(
          setDashboardCounts({
            totalCustomers: 0,
            totalExtinguishers: extinguishers.meta.total,
          }),
        );
      }
    };
    load();
  }, [dispatch, isAdmin, isInspector]);

  const charts = dashboard?.charts;
  const expiredByMonth = recordToChartData(dashboard?.breakdown.expiredByMonth ?? {});
  const expiringByDays = recordToChartData(dashboard?.breakdown.expiringByDays ?? {});
  const complianceByStatus = recordToChartData(dashboard?.breakdown.complianceByStatus ?? {});

  const axisStyle = { fontSize: 11, fill: '#71717a', fontFamily: 'JetBrains Mono, monospace' };
  const scheduledCount = inspectionRequests.filter((request) => request.status === 'SCHEDULED').length;
  const completedCount = inspectionRequests.filter((request) => request.status === 'COMPLETED').length;
  const inspectionColumns: Column<ExtinguisherInspection>[] = [
    {
      key: 'extinguisherId',
      header: 'Extinguisher',
      render: (row) => <span className="font-mono text-xs">{row.extinguisherId.slice(0, 8)}...</span>,
    },
    {
      key: 'scheduledAt',
      header: 'Date and Time',
      render: (row) => <span className="font-mono text-xs">{formatDateTime(row.scheduledAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.status === 'COMPLETED' ? 'success' : row.status === 'CANCELLED' ? 'danger' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (row) => row.notes ?? '—',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            disabled={row.status === 'COMPLETED'}
            onClick={async () => {
              await extinguisherService.updateInspection(row.id, { status: 'COMPLETED' });
              const inspections = await extinguisherService.listInspections({ page: 1, limit: 8 });
              setInspectionRequests(inspections.data);
            }}
          >
            Complete
          </button>
          <button
            type="button"
            className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            disabled={row.status === 'CANCELLED'}
            onClick={async () => {
              await extinguisherService.updateInspection(row.id, { status: 'CANCELLED' });
              const inspections = await extinguisherService.listInspections({ page: 1, limit: 8 });
              setInspectionRequests(inspections.data);
            }}
          >
            Cancel
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Dashboard"
        description={
          isAdmin
            ? 'Overview of customers, extinguishers, and compliance activity'
            : isInspector
            ? 'Inspection requests and maintenance workload'
            : 'Your fire extinguisher safety overview'
        }
      />

      {/* Stat cards — asymmetric grid for visual interest */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isAdmin && (
          <StatCard label="Total Customers" value={totalCustomers} accent="slate" />
        )}
        <StatCard label="Total Extinguishers" value={totalExtinguishers} accent="fire" />
        {isAdmin ? (
          <>
            <StatCard
              label="Expiring Soon"
              value={charts?.expiringSoonCount ?? '—'}
              accent="amber"
              sub="Next 90 days"
            />
            <StatCard
              label="Expired"
              value={charts?.expiredCount ?? '—'}
              accent="ember"
            />
            <StatCard
              label="Pending Renewals"
              value={charts?.pendingRenewals ?? '—'}
              accent="fire"
            />
            <StatCard
              label="Compliance Cases"
              value={charts?.complianceIssues ?? '—'}
              accent="ember"
            />
          </>
        ) : isInspector ? (
          <>
            <StatCard label="Scheduled Requests" value={scheduledCount} accent="amber" />
            <StatCard label="Completed Requests" value={completedCount} accent="green" />
            <StatCard label="Monitoring" value="Active" accent="green" />
          </>
        ) : (
          <>
            <StatCard label="My Extinguishers" value={totalExtinguishers} accent="fire" />
            <StatCard label="Monitoring" value="Active" accent="green" />
          </>
        )}
      </div>

      {isInspector && (
        <Card title="Inspection Requests" description="Scheduled inspection requests from users and admins">
          {inspectionError && (
            <p className="mb-3 text-sm text-red-600 dark:text-red-400">{inspectionError}</p>
          )}
          <DataTable
            columns={inspectionColumns}
            data={inspectionRequests}
            loading={inspectionLoading}
            rowKey={(row) => row.id}
            emptyMessage="No inspection requests found"
          />
        </Card>
      )}

      {/* Admin charts */}
      {isAdmin && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Expired by Month" description="Monthly distribution of expired units">
            {loading ? (
              <div className="flex h-64 items-center justify-center text-sm italic text-zinc-400">
                Loading chart data…
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expiredByMonth} margin={{ left: -10, right: 4, top: 4, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e4e4e7"
                      className="dark:stroke-zinc-800"
                      vertical={false}
                    />
                    <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(180,83,9,0.06)' }} />
                    <Bar dataKey="value" fill="#b45309" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card title="Expiring Soon" description="Days until expiry breakdown">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expiringByDays} margin={{ left: -10, right: 4, top: 4, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e4e4e7"
                    className="dark:stroke-zinc-800"
                    vertical={false}
                  />
                  <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(217,119,6,0.06)' }} />
                  <Bar dataKey="value" fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Compliance by Status" description="Open and escalated case distribution">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complianceByStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={88}
                    innerRadius={40}
                    paddingAngle={2}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {complianceByStatus.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Summary">
            <dl className="grid grid-cols-2 gap-5">
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Recent Notifications
                </dt>
                <dd className="mt-1 font-mono text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {charts?.recentNotifications ?? 0}
                </dd>
              </div>
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Generated
                </dt>
                <dd className="mt-1 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                  {dashboard?.generatedAt
                    ? new Date(dashboard.generatedAt).toLocaleString()
                    : '—'}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      )}
    </div>
  );
}
