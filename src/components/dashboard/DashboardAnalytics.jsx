import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Card from '../ui/Card';
import { api, getApiErrorMessage } from '../../lib/api';

const STATUS_ORDER = [
  'Saved',
  'Applied',
  'Phone Screen',
  'Interview',
  'Offer',
  'Rejected',
  'Ghosted',
];

const CHART_PRIMARY = '#4f46e5';
const CHART_GRID = '#e5e7eb';
const CHART_AXIS = '#6b7280';

function formatWeekShort(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-5">
          <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
          <div className="mt-4 h-8 w-16 animate-pulse rounded bg-gray-200" />
        </Card>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[1, 2].map((i) => (
        <Card key={i} className="p-5">
          <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
          <div className="mt-6 h-[260px] animate-pulse rounded-xl bg-gray-100" />
        </Card>
      ))}
    </div>
  );
}

function KpiCard({ label, value, hint }) {
  return (
    <Card className="p-5 transition-shadow duration-200 hover:shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide hb-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--color-text-primary)]">{value}</p>
      {hint ? <p className="mt-1 text-xs hb-muted">{hint}</p> : null}
    </Card>
  );
}

const chartTooltipStyle = {
  borderRadius: '12px',
  border: '1px solid var(--color-border, #e5e7eb)',
  fontSize: '12px',
  fontWeight: 600,
};

export default function DashboardAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.get('/stats/overview');
      setData(res.data?.data ?? null);
    } catch (err) {
      setData(null);
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const barData = useMemo(() => {
    if (!data?.applicationsByStatus) return [];
    return STATUS_ORDER.map((status) => ({
      status,
      count: Number(data.applicationsByStatus[status] ?? 0),
    }));
  }, [data]);

  const lineData = useMemo(() => {
    if (!data?.applicationsPerWeek?.length) return [];
    return data.applicationsPerWeek.map((row) => ({
      week: formatWeekShort(row.weekStart),
      count: Number(row.count ?? 0),
    }));
  }, [data]);

  const totalApplications = useMemo(() => {
    if (!data?.applicationsByStatus) return 0;
    return STATUS_ORDER.reduce((sum, s) => sum + Number(data.applicationsByStatus[s] ?? 0), 0);
  }, [data]);

  if (loading) {
    return (
      <section className="space-y-6" aria-busy="true" aria-label="Loading analytics">
        <div>
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-gray-100" />
        </div>
        <KpiSkeleton />
        <ChartSkeleton />
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Overview</h2>
        <Card className="border-red-100 bg-red-50/80 p-4">
          <p className="text-sm font-semibold text-[var(--color-danger)]">{error}</p>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-[var(--color-primary)] underline"
            onClick={() => void load()}
          >
            Try again
          </button>
        </Card>
      </section>
    );
  }

  const responseRate = data?.responseRate ?? 0;
  const avgDays = data?.avgResponseTime ?? 0;
  const isEmpty = totalApplications === 0;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Overview</h2>
        <p className="mt-1 text-sm hb-muted">Pipeline health and activity for the last eight weeks.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total applications" value={totalApplications} hint="Across all statuses" />
        <KpiCard
          label="Response rate"
          value={`${responseRate}%`}
          hint="Interview or offer vs. moved-past-Saved applications"
        />
        <KpiCard
          label="Avg response time"
          value={avgDays > 0 ? `${avgDays} days` : '—'}
          hint="Applied date → last update (where dates exist)"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 lg:p-6">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Applications by status</h3>
          <p className="mt-0.5 text-xs hb-muted">Count per stage in your pipeline</p>
          <div className="mt-4 h-[280px] w-full min-w-0">
            {isEmpty ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] text-sm hb-muted">
                No applications yet — add one to see this chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
                  <CartesianGrid stroke={CHART_GRID} vertical={false} strokeDasharray="4 4" />
                  <XAxis
                    dataKey="status"
                    tick={{ fill: CHART_AXIS, fontSize: 11 }}
                    interval={0}
                    angle={-32}
                    textAnchor="end"
                    height={56}
                  />
                  <YAxis tick={{ fill: CHART_AXIS, fontSize: 11 }} allowDecimals={false} width={36} />
                  <Tooltip
                    cursor={{ fill: 'rgb(79 70 229 / 6%)' }}
                    contentStyle={chartTooltipStyle}
                    formatter={(value) => [value, 'Applications']}
                  />
                  <Bar dataKey="count" name="Applications" fill={CHART_PRIMARY} radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-5 lg:p-6">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Applications per week</h3>
          <p className="mt-0.5 text-xs hb-muted">New records by week (created date)</p>
          <div className="mt-4 h-[280px] w-full min-w-0">
            {isEmpty ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] text-sm hb-muted">
                No data for this period yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={CHART_GRID} strokeDasharray="4 4" />
                  <XAxis dataKey="week" tick={{ fill: CHART_AXIS, fontSize: 11 }} tickMargin={8} />
                  <YAxis tick={{ fill: CHART_AXIS, fontSize: 11 }} allowDecimals={false} width={36} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [value, 'Count']} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Applications"
                    stroke={CHART_PRIMARY}
                    strokeWidth={2}
                    dot={{ r: 3, fill: CHART_PRIMARY }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
