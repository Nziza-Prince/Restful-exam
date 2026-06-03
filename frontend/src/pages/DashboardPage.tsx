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
import { Button } from '@/components/ui/Button';
import { Badge, PageHeader, type Column } from '@/components/ui/DataTable';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { customerService } from '@/services/customerService';
import { extinguisherService } from '@/services/extinguisherService';
import type { ExtinguisherInspection, MaintenanceLog } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDashboardSummary, setDashboardCounts } from '@/store/slices/reportSlice';
import { formatDate, formatDateTime, recordToChartData } from '@/utils';

/**
 * DASHBOARD PAGE
 * 
 * Multi-role dashboard showing role-specific metrics and actions.
 * 
 * ADMIN ROLE:
 * - Overview stats: total customers, extinguishers, expired units, compliance issues
 * - Charts: Expired by month, expiring soon distribution, compliance status breakdown
 * - Inspection review queue: Review inspector-submitted reports
 * 
 * INSPECTOR ROLE:
 * - Inspection request queue: Start, complete, and submit reports
 * - Maintenance logging: Record maintenance actions on extinguishers
 * - Workload stats: Pending, in-progress, completed requests
 * 
 * CUSTOMER ROLE:
 * - My extinguishers count
 * - Active monitoring status
 */

// ── Chart styling ─────────────────────────────────────────────────────────────

// Cohesive chart palette — warm copper to amber to gold
const CHART_COLORS = ['#b45309', '#d97706', '#f59e0b', '#78350f', '#92400e'];

/**
 * Custom tooltip component for charts
 * - Displays value with label in styled container
 * - Matches app design system (zinc colors, rounded borders)
 */
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

  // ── Inspection management state ───────────────────────────────────────────
  const [inspectionRequests, setInspectionRequests] = useState<ExtinguisherInspection[]>([]);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [inspectionError, setInspectionError] = useState('');
  
  // ── Inspector report submission modal ─────────────────────────────────────
  const [reportTarget, setReportTarget] = useState<ExtinguisherInspection | null>(null);
  const [reportCondition, setReportCondition] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [reportActions, setReportActions] = useState('');
  const [reportResult, setReportResult] = useState('PASS');
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  
  // ── Admin review modal ────────────────────────────────────────────────────
  const [reviewTarget, setReviewTarget] = useState<ExtinguisherInspection | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED' | 'REQUIRES_MAINTENANCE'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  
  // ── Inspection details modal ──────────────────────────────────────────────
  const [detailsTarget, setDetailsTarget] = useState<ExtinguisherInspection | null>(null);
  
  // ── Maintenance logging modal ─────────────────────────────────────────────
  const [maintenanceTarget, setMaintenanceTarget] = useState<ExtinguisherInspection | null>(null);
  const [maintenanceActionsTaken, setMaintenanceActionsTaken] = useState('');
  const [maintenanceActionDate, setMaintenanceActionDate] = useState(new Date().toISOString().slice(0, 10));
  const [maintenanceConditionsNoted, setMaintenanceConditionsNoted] = useState('');
  const [maintenanceError, setMaintenanceError] = useState('');
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [maintenanceLogsLoading, setMaintenanceLogsLoading] = useState(false);
  
  void inspectionLoading;
  void inspectionError;

  /**
   * Load dashboard data on mount
   * - Admin: Fetches dashboard metrics, customer count, extinguisher count, and inspection queue
   * - Inspector: Fetches inspection requests and extinguisher count
   * - Customer: Fetches owned extinguisher count
   */
  useEffect(() => {
    const load = async () => {
      if (isAdmin) {
        dispatch(fetchDashboardSummary({ days: '90' }));
        const [customers, extinguishers, inspections] = await Promise.all([
          customerService.list({ page: 1, limit: 1 }),
          extinguisherService.listAll({ page: 1, limit: 1 }),
          extinguisherService.listInspections({
            page: 1,
            limit: 8,
            status: 'COMPLETED_PENDING_ADMIN_REVIEW',
          }),
        ]);
        setInspectionRequests(inspections.data);
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
  const pendingCount = inspectionRequests.filter((request) => request.status === 'PENDING').length;
  const inProgressCount = inspectionRequests.filter((request) => request.status === 'IN_PROGRESS').length;
  const reviewCount = inspectionRequests.filter((request) => request.status === 'COMPLETED_PENDING_ADMIN_REVIEW').length;
  const reloadInspectionRequests = async () => {
    const inspections = await extinguisherService.listInspections({
      page: 1,
      limit: 8,
      status: isAdmin ? 'COMPLETED_PENDING_ADMIN_REVIEW' : undefined,
    });
    setInspectionRequests(inspections.data);
  };
  const openReport = (row: ExtinguisherInspection) => {
    setReportTarget(row);
    setReportCondition('');
    setReportNotes('');
    setReportActions('');
    setReportResult('PASS');
    setReportDate(new Date().toISOString().slice(0, 10));
  };
  const submitReport = async () => {
    if (!reportTarget) return;
    await extinguisherService.submitInspectionReport(reportTarget.id, {
      condition: reportCondition,
      notes: reportNotes || undefined,
      actionsTaken: reportActions,
      result: reportResult,
      inspectionDate: reportDate,
    });
    setReportTarget(null);
    await reloadInspectionRequests();
  };
  const openReview = (row: ExtinguisherInspection) => {
    setReviewTarget(row);
    setReviewStatus('APPROVED');
    setReviewNotes('');
  };
  const openMaintenance = (row: ExtinguisherInspection) => {
    setMaintenanceTarget(row);
    setMaintenanceActionsTaken('');
    setMaintenanceActionDate(new Date().toISOString().slice(0, 10));
    setMaintenanceConditionsNoted('');
    setMaintenanceError('');
  };
  const loadMaintenanceLogs = async (row: ExtinguisherInspection) => {
    setMaintenanceLogsLoading(true);
    try {
      const result = await extinguisherService.listMaintenance(row.extinguisherId, { page: 1, limit: 5 });
      setMaintenanceLogs(result.data);
    } finally {
      setMaintenanceLogsLoading(false);
    }
  };
  const openDetails = async (row: ExtinguisherInspection) => {
    setDetailsTarget(row);
    setMaintenanceLogs([]);
    await loadMaintenanceLogs(row);
  };
  const submitMaintenance = async () => {
    if (!maintenanceTarget) return;
    if (!maintenanceActionsTaken.trim() || !maintenanceActionDate || !maintenanceConditionsNoted.trim()) {
      setMaintenanceError('Enter actions taken, date of action, and conditions noted during maintenance.');
      return;
    }
    await extinguisherService.logMaintenance(maintenanceTarget.extinguisherId, {
      actionsTaken: maintenanceActionsTaken.trim(),
      actionDate: maintenanceActionDate,
      conditionsNoted: maintenanceConditionsNoted.trim(),
    });
    if (detailsTarget?.extinguisherId === maintenanceTarget.extinguisherId) {
      await loadMaintenanceLogs(detailsTarget);
    }
    setMaintenanceTarget(null);
  };
  const submitReview = async () => {
    if (!reviewTarget) return;
    await extinguisherService.reviewInspection(reviewTarget.id, {
      status: reviewStatus,
      notes: reviewNotes || undefined,
    });
    setReviewTarget(null);
    await reloadInspectionRequests();
  };
  const inspectionStatusTone = (status: ExtinguisherInspection['status']) => {
    if (status === 'APPROVED') return 'success';
    if (status === 'REJECTED' || status === 'REQUIRES_MAINTENANCE') return 'danger';
    if (status === 'IN_PROGRESS' || status === 'COMPLETED_PENDING_ADMIN_REVIEW') return 'info';
    return 'warning';
  };
  const inspectionColumns: Column<ExtinguisherInspection>[] = [
    {
      key: 'extinguisher',
      header: 'Extinguisher',
      render: (row) => (
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            {row.extinguisher?.serialNumber ?? row.extinguisherId.slice(0, 8)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {row.extinguisher
              ? `${row.extinguisher.type} - ${row.extinguisher.location}`
              : 'Details unavailable'}
          </p>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {row.customer?.fullName ?? (row.extinguisher?.customerId ? 'Assigned customer' : 'Unassigned')}
          </p>
          {row.customer?.email && <p className="text-xs text-zinc-500">{row.customer.email}</p>}
        </div>
      ),
    },
    {
      key: 'expiry',
      header: 'Expiry',
      render: (row) => (
        <div>
          <p className="font-mono text-xs">{formatDate(row.extinguisher?.expiryDate)}</p>
          {row.extinguisher?.status && (
            <p className="mt-1 text-[11px] font-semibold text-zinc-500">{row.extinguisher.status}</p>
          )}
        </div>
      ),
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
        <Badge tone={inspectionStatusTone(row.status)}>
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
          <Button size="sm" variant="secondary" onClick={() => openDetails(row)}>
            Details
          </Button>
          {isInspector && row.status === 'PENDING' && (
            <Button
              size="sm"
              onClick={async () => {
                await extinguisherService.startInspection(row.id);
                await reloadInspectionRequests();
              }}
            >
              Start Inspection
            </Button>
          )}
          {isInspector && row.status === 'IN_PROGRESS' && (
            <Button size="sm" onClick={() => openReport(row)}>
              Submit Report
            </Button>
          )}
          {isInspector &&
            ['IN_PROGRESS', 'COMPLETED_PENDING_ADMIN_REVIEW', 'REQUIRES_MAINTENANCE'].includes(row.status) && (
              <Button size="sm" variant="secondary" onClick={() => openMaintenance(row)}>
                Add Maintenance
              </Button>
            )}
          {isAdmin && row.status === 'COMPLETED_PENDING_ADMIN_REVIEW' && (
            <Button size="sm" onClick={() => openReview(row)}>
              Review
            </Button>
          )}
        </div>
      ),
    },
  ];
  void inspectionColumns;

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
            <StatCard
              label="Reports Awaiting Review"
              value={reviewCount}
              accent="blue"
            />
          </>
        ) : isInspector ? (
          <>
            <StatCard label="Pending Requests" value={pendingCount} accent="amber" />
            <StatCard label="In Progress" value={inProgressCount} accent="blue" />
            <StatCard label="Monitoring" value="Active" accent="green" />
          </>
        ) : (
          <>
            <StatCard label="My Extinguishers" value={totalExtinguishers} accent="fire" />
            <StatCard label="Monitoring" value="Active" accent="green" />
          </>
        )}
      </div>

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

      <Modal
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
        title="Submit Inspection Report"
        description={reportTarget ? `Request ${reportTarget.id.slice(0, 8)}` : undefined}
        footer={
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <Button variant="secondary" onClick={() => setReportTarget(null)}>
              Cancel
            </Button>
            <Button onClick={submitReport}>
              Submit for admin review
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <TextArea
            label="Condition"
            value={reportCondition}
            onChange={(e) => setReportCondition(e.target.value)}
            placeholder="Cylinder body is intact, pressure gauge is within operating range"
            required
          />
          <TextArea
            label="Notes"
            value={reportNotes}
            onChange={(e) => setReportNotes(e.target.value)}
            placeholder="Access, placement, signage, or other observations"
          />
          <TextArea
            label="Actions taken"
            value={reportActions}
            onChange={(e) => setReportActions(e.target.value)}
            placeholder="Checked pressure, verified pin and seal, cleaned nozzle"
            required
          />
          <Select
            label="Result"
            value={reportResult}
            onChange={(e) => setReportResult(e.target.value)}
            options={[
              { value: 'PASS', label: 'Pass' },
              { value: 'FAIL', label: 'Fail' },
              { value: 'NEEDS_MAINTENANCE', label: 'Needs maintenance' },
            ]}
          />
          <Input
            label="Inspection date"
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            required
          />
        </div>
      </Modal>

      <Modal
        open={!!detailsTarget}
        onClose={() => setDetailsTarget(null)}
        title="Inspection Request Details"
        description={detailsTarget?.extinguisher?.serialNumber ?? detailsTarget?.id.slice(0, 8)}
        size="lg"
      >
        {detailsTarget && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Serial number" value={detailsTarget.extinguisher?.serialNumber ?? '—'} />
              <Detail label="Type" value={detailsTarget.extinguisher?.type ?? '—'} />
              <Detail label="Location" value={detailsTarget.extinguisher?.location ?? '—'} />
              <Detail label="Size" value={detailsTarget.extinguisher?.size ?? '—'} />
              <Detail label="Expiry date" value={formatDate(detailsTarget.extinguisher?.expiryDate)} />
              <Detail label="Current status" value={detailsTarget.extinguisher?.status ?? '—'} />
              <Detail label="Owner/customer" value={detailsTarget.customer?.fullName ?? 'Unassigned'} />
              <Detail label="Owner email" value={detailsTarget.customer?.email ?? '—'} />
              <Detail label="Requested date/time" value={formatDateTime(detailsTarget.scheduledAt)} />
              <Detail label="Request status" value={detailsTarget.status} />
            </div>
            {detailsTarget.notes && (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/50">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Request notes</p>
                <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{detailsTarget.notes}</p>
              </div>
            )}
            <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Maintenance logs
                </p>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {maintenanceLogsLoading ? (
                  <p className="px-3 py-4 text-sm text-zinc-500">Loading maintenance logs...</p>
                ) : maintenanceLogs.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-zinc-500">
                    No maintenance logs recorded for this extinguisher yet.
                  </p>
                ) : (
                  maintenanceLogs.map((log) => (
                    <div key={log.id} className="px-3 py-3">
                      <p className="font-mono text-xs text-zinc-500">{formatDate(log.actionDate)}</p>
                      <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {log.actionsTaken}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        {log.conditionsNoted}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!maintenanceTarget}
        onClose={() => setMaintenanceTarget(null)}
        title="Log Maintenance"
        description={maintenanceTarget?.extinguisher?.serialNumber ?? undefined}
        footer={
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <Button variant="secondary" onClick={() => setMaintenanceTarget(null)}>
              Cancel
            </Button>
            <Button onClick={submitMaintenance}>
              Save maintenance log
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {maintenanceError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              {maintenanceError}
            </p>
          )}
          <TextArea
            label="Actions taken"
            value={maintenanceActionsTaken}
            onChange={(e) => {
              setMaintenanceActionsTaken(e.target.value);
              setMaintenanceError('');
            }}
            placeholder="Replaced pressure gauge and resealed cylinder"
            required
          />
          <Input
            label="Date of the action"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={maintenanceActionDate}
            onChange={(e) => {
              setMaintenanceActionDate(e.target.value);
              setMaintenanceError('');
            }}
            required
          />
          <TextArea
            label="Conditions noted during maintenance"
            value={maintenanceConditionsNoted}
            onChange={(e) => {
              setMaintenanceConditionsNoted(e.target.value);
              setMaintenanceError('');
            }}
            placeholder="Pressure was below acceptable range"
            required
          />
        </div>
      </Modal>

      <Modal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title="Review Inspection Report"
        description={reviewTarget ? `Request ${reviewTarget.id.slice(0, 8)}` : undefined}
        footer={
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <Button variant="secondary" onClick={() => setReviewTarget(null)}>
              Cancel
            </Button>
            <Button onClick={submitReview}>
              Save review
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {reviewTarget && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/50">
              <p><strong>Condition:</strong> {reviewTarget.reportCondition ?? '—'}</p>
              <p><strong>Actions:</strong> {reviewTarget.actionsTaken ?? '—'}</p>
              <p><strong>Result:</strong> {reviewTarget.result ?? '—'}</p>
              <p><strong>Date:</strong> {reviewTarget.inspectionDate ?? '—'}</p>
              {reviewTarget.reportNotes && <p><strong>Notes:</strong> {reviewTarget.reportNotes}</p>}
            </div>
          )}
          <Select
            label="Decision"
            value={reviewStatus}
            onChange={(e) => setReviewStatus(e.target.value as typeof reviewStatus)}
            options={[
              { value: 'APPROVED', label: 'Approve' },
              { value: 'REJECTED', label: 'Reject' },
              { value: 'REQUIRES_MAINTENANCE', label: 'Requires follow-up/maintenance' },
            ]}
          />
          <TextArea
            label="Admin review notes"
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Reason for decision or required follow-up"
          />
        </div>
      </Modal>
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
