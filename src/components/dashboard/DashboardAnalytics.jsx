import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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

const DONUT_PIPELINE = ['Applied', 'Phone Screen', 'Interview', 'Offer'];
const DONUT_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#7c3aed'];
const OTHER_COLOR = '#94a3b8';

const CHART_PRIMARY = '#6366f1';
const CHART_GRID = '#e2e8f0';
const CHART_AXIS = '#64748b';

function formatWeekShort(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function ChartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[1, 2].map((i) => (
        <Card key={i} className="p-5">
          <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 h-[280px] animate-pulse rounded-xl bg-slate-100" />
        </Card>
      ))}
    </div>
  );
}

const chartTooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  fontSize: '12px',
  fontWeight: 600,
  boxShadow: '0 8px 24px rgb(15 23 42 / 8%)',
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

  const donutData = useMemo(() => {
    if (!data?.applicationsByStatus) return [];
    const byStatus = data.applicationsByStatus;
    const rows = DONUT_PIPELINE.map((status, i) => ({
      name: status,
      value: Number(byStatus[status] ?? 0),
      color: DONUT_COLORS[i],
    }));
    const pipelineSum = rows.reduce((s, r) => s + r.value, 0);
    const other = Math.max(0, totalApplications - pipelineSum);
    if (other > 0) {
      rows.push({ name: 'Other stages', value: other, color: OTHER_COLOR });
    }
    return rows.filter((r) => r.value > 0);
  }, [data, totalApplications]);

  const responseRate = data?.responseRate ?? 0;
  const avgDays = data?.avgResponseTime ?? 0;

  if (loading) {
    return (
      <section className="space-y-4" aria-busy="true" aria-label="Loading analytics">
        <div className="h-7 w-56 animate-pulse rounded bg-slate-200" />
        <ChartSkeleton />
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Analytics</h2>
        <Card className="border-red-100 bg-red-50/80 p-4">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-indigo-600 underline"
            onClick={() => void load()}
          >
            Try again
          </button>
        </Card>
      </section>
    );
  }

  const isEmpty = totalApplications === 0;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Analytics</h2>
        <p className="mt-1 text-sm text-slate-600">
          Activity over recent weeks and how applications are spread across your pipeline.
        </p>
        <p className="mt-2 text-xs font-semibold text-slate-500">
          <span className="text-slate-700">{totalApplications}</span> total ·{' '}
          <span className="text-slate-700">{responseRate}%</span> response rate · Avg response{' '}
          <span className="text-slate-700">{avgDays > 0 ? `${avgDays}d` : '—'}</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden rounded-2xl border border-slate-200/90 p-5 shadow-sm lg:p-6">
          <h3 className="text-sm font-bold text-slate-900">Applications over time</h3>
          <p className="mt-0.5 text-xs text-slate-500">New records by week</p>
          <div className="mt-4 h-[280px] w-full min-w-0">
            {isEmpty ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                Add applications to see trends here.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hbAreaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_PRIMARY} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART_GRID} strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: CHART_AXIS, fontSize: 11 }} tickMargin={8} />
                  <YAxis tick={{ fill: CHART_AXIS, fontSize: 11 }} allowDecimals={false} width={36} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [value, 'Applications']} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Applications"
                    stroke={CHART_PRIMARY}
                    strokeWidth={2.5}
                    fill="url(#hbAreaFill)"
                    dot={{ r: 3, fill: CHART_PRIMARY, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-slate-200/90 p-5 shadow-sm lg:p-6">
          <h3 className="text-sm font-bold text-slate-900">Applications by stage</h3>
          <p className="mt-0.5 text-xs text-slate-500">Pipeline mix (key stages + other)</p>
          <div className="mt-4 min-h-[280px] w-full min-w-0">
            {isEmpty ? (
              <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                No data yet — your donut chart will appear here.
              </div>
            ) : (
              <div className="flex flex-col items-stretch gap-6 md:flex-row md:items-center md:gap-4">
                <div className="relative mx-auto h-[260px] w-full max-w-[280px] shrink-0 md:mx-0 md:flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="58%"
                        outerRadius="82%"
                        paddingAngle={2}
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {donutData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        formatter={(value, _n, item) => {
                          const sum = donutData.reduce((s, d) => s + d.value, 0) || 1;
                          const pct = ((Number(value) / sum) * 100).toFixed(1);
                          return [`${value} (${pct}%)`, item?.payload?.name];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold tabular-nums text-slate-900">{totalApplications}</p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
                  </div>
                </div>
                <ul className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 text-xs md:max-w-[200px]">
                  {donutData.map((row) => {
                    const pct = ((row.value / (totalApplications || 1)) * 100).toFixed(1);
                    return (
                      <li key={row.name} className="flex items-start gap-2">
                        <span
                          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: row.color }}
                          aria-hidden
                        />
                        <span className="min-w-0 leading-snug text-slate-600">
                          <span className="font-semibold text-slate-800">{row.name}</span>{' '}
                          <span className="tabular-nums text-slate-500">({pct}%)</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
