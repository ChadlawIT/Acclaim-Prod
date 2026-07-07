import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, Building2, FolderOpen, MessageSquare, FileText,
  Activity, ClipboardList, CreditCard, ArrowLeft,
  TrendingUp, TrendingDown, Minus, BarChart3, LogIn,
  Clock, Paperclip, Star, Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { formatUKDateLong } from "@/lib/dateUtils";

type Period = "week" | "month" | "quarter" | "year" | "all";

interface MetricStat { total: number; current: number; previous: number; }
interface AnalyticsData {
  period: Period;
  dateRange: { startCurrent: string; endCurrent: string; startPrevious: string | null; endPrevious: string | null };
  metrics: {
    users:       MetricStat;
    orgs:        MetricStat;
    cases:       MetricStat & { active: number; closed: number };
    messages:    MetricStat;
    documents:   MetricStat;
    activities:  MetricStat;
    submissions: MetricStat;
    payments:    MetricStat & { totalValue: number };
    logins:      MetricStat;
  };
  engagement: {
    curUniqueLoginUsers: number;
    prevUniqueLoginUsers: number;
    totalReadMsgs: number;
    totalUnreadMsgs: number;
    readRate: number;
    casesActive30d: number;
    msgsWithAttachments: number;
  };
  valueIndicators: {
    avgMsgsPerCase: number;
    avgDocsPerCase: number;
    avgActivitiesPerCase: number;
    submissionConversionRate: number;
    attachmentRate: number;
    readRate: number;
  };
  breakdowns: {
    casesByStatus: { status: string; count: number }[];
    casesByType:   { type: string; count: number }[];
    topOrgs:       { name: string; cases: number }[];
  };
  trend: {
    label: string;
    curActivities: number; prevActivities: number;
    curMessages: number;   prevMessages: number;
    curCases: number;      prevCases: number;
  }[];
}

const TEAL   = "#0d9488";
const NAVY   = "#1e3a5f";

const METRIC_COLORS = {
  activities: "#f59e0b",
  messages:   "#0ea5e9",
  cases:      "#7c3aed",
};

const PIE_PALETTE = ["#0d9488","#0ea5e9","#7c3aed","#f59e0b","#f97316","#ec4899","#10b981","#6366f1"];

const PERIODS: { value: Period; label: string }[] = [
  { value: "week",    label: "This Week" },
  { value: "month",   label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year",    label: "This Year" },
  { value: "all",     label: "All Time" },
];

const periodLabel: Record<Period, { cur: string; prev: string }> = {
  week:    { cur: "This week",    prev: "Last week" },
  month:   { cur: "This month",   prev: "Last month" },
  quarter: { cur: "This quarter", prev: "Last quarter" },
  year:    { cur: "This year",    prev: "Last year" },
  all:     { cur: "All time",     prev: "" },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

function Delta({ current, previous, isAllTime }: { current: number; previous: number; isAllTime: boolean }) {
  if (isAllTime) return null;
  const delta = current - previous;
  const pct = previous === 0 ? (current > 0 ? 100 : 0) : Math.round((delta / previous) * 100);
  if (delta === 0 && previous === 0) return (
    <span className="flex items-center gap-1 text-xs text-gray-400"><Minus className="h-3 w-3" /> No data yet</span>
  );
  if (delta > 0) return (
    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><TrendingUp className="h-3 w-3" /> +{fmt(delta)} ({pct}%)</span>
  );
  if (delta < 0) return (
    <span className="flex items-center gap-1 text-xs font-semibold text-rose-500"><TrendingDown className="h-3 w-3" /> {fmt(delta)} ({pct}%)</span>
  );
  return <span className="flex items-center gap-1 text-xs text-gray-400"><Minus className="h-3 w-3" /> No change</span>;
}

function KpiCard({ icon: Icon, label, total, current, previous, isAllTime, accent, sub }: {
  icon: any; label: string; total: number; current: number; previous: number;
  isAllTime: boolean; accent: string; sub?: string;
}) {
  return (
    <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="rounded-lg p-2" style={{ background: `${accent}15` }}>
            <Icon className="h-5 w-5" style={{ color: accent }} />
          </div>
          {!isAllTime && (
            <span className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">vs last</span>
          )}
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-0.5 tabular-nums">{fmt(total)}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-2">{label}</div>
        {sub && <div className="text-xs text-gray-400 mb-2">{sub}</div>}
        {!isAllTime && (
          <div className="border-t pt-2 mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">This period:</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{fmt(current)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Previous:</span>
              <span className="font-semibold text-gray-500">{fmt(previous)}</span>
            </div>
            <Delta current={current} previous={previous} isAllTime={isAllTime} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-xs min-w-[140px]">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-gray-500">{p.name}</span>
          </div>
          <span className="font-semibold text-gray-800 dark:text-gray-200">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <span className="font-semibold" style={{ color: p.payload.fill }}>{p.name}: </span>
      <span className="font-bold text-gray-800">{p.value}</span>
    </div>
  );
};

function StatPill({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
      <div className="rounded-lg p-1.5 flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight tabular-nums">{value}</div>
        <div className="text-xs text-gray-500 leading-tight">{label}</div>
      </div>
    </div>
  );
}

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function PortalAnalytics() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<Period>("month");

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/portal-analytics", period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/portal-analytics?period=${period}`, {
        credentials: "include", cache: "no-store",
      });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
  });

  if (!user?.isAdmin) {
    return <div className="p-8 text-center text-gray-500">You do not have permission to view this page.</div>;
  }

  const m = data?.metrics;
  const eng = data?.engagement;
  const vi = data?.valueIndicators;
  const isAllTime = period === "all";

  const dateRangeLabel = data ? (() => {
    const s = new Date(data.dateRange.startCurrent);
    const e = new Date(data.dateRange.endCurrent);
    if (isAllTime) return "All recorded data";
    return `${formatUKDateLong(s.toISOString())} – ${formatUKDateLong(e.toISOString())}`;
  })() : "";

  const prevDateLabel = data?.dateRange.startPrevious ? (() => {
    const s = new Date(data.dateRange.startPrevious!);
    const e = new Date(data.dateRange.endPrevious!);
    return `${formatUKDateLong(s.toISOString())} – ${formatUKDateLong(e.toISOString())}`;
  })() : "";

  const trendData = data?.trend ?? [];

  const kpis = m ? [
    { icon: Users,         label: "Total Users",         total: m.users.total,       current: m.users.current,       previous: m.users.previous,       accent: TEAL,      sub: undefined },
    { icon: Building2,     label: "Organisations",       total: m.orgs.total,        current: m.orgs.current,        previous: m.orgs.previous,        accent: NAVY,      sub: undefined },
    { icon: FolderOpen,    label: "Total Cases",         total: m.cases.total,       current: m.cases.current,       previous: m.cases.previous,       accent: "#7c3aed", sub: `${m.cases.active} active · ${m.cases.closed} closed` },
    { icon: MessageSquare, label: "Messages Sent",       total: m.messages.total,    current: m.messages.current,    previous: m.messages.previous,    accent: "#0ea5e9", sub: undefined },
    { icon: Activity,      label: "Case Interactions",   total: m.activities.total,  current: m.activities.current,  previous: m.activities.previous,  accent: "#f59e0b", sub: "Activities logged on cases" },
    { icon: LogIn,         label: "Login Sessions",      total: m.logins.total,      current: m.logins.current,      previous: m.logins.previous,      accent: "#10b981", sub: undefined },
    { icon: FileText,      label: "Documents Uploaded",  total: m.documents.total,   current: m.documents.current,  previous: m.documents.previous,   accent: "#f97316", sub: undefined },
    { icon: CreditCard,    label: "Payments Recorded",   total: m.payments.total,    current: m.payments.current,    previous: m.payments.previous,    accent: "#6366f1", sub: `${fmtCurrency(m.payments.totalValue)} total value` },
  ] : [];

  // Horizontal bar chart data for case types
  const caseTypeData = (data?.breakdowns.casesByType ?? [])
    .sort((a, b) => b.count - a.count)
    .map(r => ({ name: r.type, value: r.count }));

  const topOrgsData = (data?.breakdowns.topOrgs ?? [])
    .map(r => ({ name: r.name.length > 18 ? r.name.slice(0, 16) + "…" : r.name, value: r.cases }));

  const statusData = (data?.breakdowns.casesByStatus ?? [])
    .sort((a, b) => b.count - a.count)
    .map(r => ({ name: r.status, value: r.count }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">

      {/* Header */}
      <div className="text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${TEAL} 100%)` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="pt-4">
            <button
              onClick={() => setLocation("/admin")}
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin Panel
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-6 w-6 text-white/80" />
                <h1 className="text-2xl font-bold tracking-tight">Portal Analytics</h1>
              </div>
              <p className="text-white/70 text-sm">Board-level overview of portal usage, engagement, and value</p>
              {data && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/60">
                  <span>{dateRangeLabel}</span>
                  {!isAllTime && prevDateLabel && <span className="text-white/40">vs {prevDateLabel}</span>}
                </div>
              )}
            </div>
            <div className="flex gap-1 bg-white/10 rounded-xl p-1 flex-wrap">
              {PERIODS.map(p => (
                <button key={p.value} onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    period === p.value ? "bg-white text-gray-900 shadow" : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                  data-testid={`button-period-${p.value}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── KPI Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {kpis.map(k => (
              <KpiCard key={k.label} icon={k.icon} label={k.label} total={k.total}
                current={k.current} previous={k.previous} isAllTime={isAllTime}
                accent={k.accent} sub={k.sub} />
            ))}
          </div>
        )}

        {/* ── Combined Activity Trend ── */}
        {!isAllTime && (
          <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm overflow-hidden">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-base flex items-center gap-2" style={{ color: NAVY }}>
                <Activity className="h-4 w-4" />
                Activity Trend
                <span className="text-xs font-normal text-gray-400 ml-1">
                  — interactions, messages &amp; new cases · solid = {periodLabel[period].cur.toLowerCase()} · dashed = {periodLabel[period].prev.toLowerCase()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-4">
              {isLoading || !trendData.length ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                  {isLoading ? "Loading…" : "No data for this period yet."}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 14 }} />
                    <Line dataKey="curActivities"  name="Interactions (current)"  stroke={METRIC_COLORS.activities} strokeWidth={2.5} dot={false} />
                    <Line dataKey="curMessages"    name="Messages (current)"      stroke={METRIC_COLORS.messages}   strokeWidth={2.5} dot={false} />
                    <Line dataKey="curCases"       name="New Cases (current)"     stroke={METRIC_COLORS.cases}      strokeWidth={2.5} dot={false} />
                    <Line dataKey="prevActivities" name="Interactions (prev)"     stroke={METRIC_COLORS.activities} strokeWidth={1.5} dot={false} strokeDasharray="5 4" strokeOpacity={0.45} />
                    <Line dataKey="prevMessages"   name="Messages (prev)"         stroke={METRIC_COLORS.messages}   strokeWidth={1.5} dot={false} strokeDasharray="5 4" strokeOpacity={0.45} />
                    <Line dataKey="prevCases"      name="New Cases (prev)"        stroke={METRIC_COLORS.cases}      strokeWidth={1.5} dot={false} strokeDasharray="5 4" strokeOpacity={0.45} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Case Breakdowns: Donut + Horizontal Bars ── */}
        {data && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              Case Breakdowns
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Cases by Status — Donut */}
              <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Cases by Status</CardTitle>
                </CardHeader>
                <CardContent className="pt-2 pb-4">
                  {statusData.length === 0 ? (
                    <p className="text-sm text-gray-400 p-4">No case data.</p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                            innerRadius={55} outerRadius={85} labelLine={false} label={renderCustomLabel}>
                            {statusData.map((_, i) => (
                              <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1">
                        {statusData.map((d, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_PALETTE[i % PIE_PALETTE.length] }} />
                            {d.name} ({d.value})
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Cases by Debtor Type — Horizontal Bar */}
              <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Cases by Debtor Type</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 pb-4">
                  {caseTypeData.length === 0 ? (
                    <p className="text-sm text-gray-400">No case data.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={caseTypeData} layout="vertical" margin={{ left: 0, right: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={80} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="value" name="Cases" fill="#7c3aed" radius={[0,4,4,0]}>
                          {caseTypeData.map((_, i) => (
                            <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top Organisations — Horizontal Bar */}
              <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Top Organisations by Cases</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 pb-4">
                  {topOrgsData.length === 0 ? (
                    <p className="text-sm text-gray-400">No data.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={topOrgsData} layout="vertical" margin={{ left: 0, right: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={80} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="value" name="Cases" fill={NAVY} radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── Engagement & Adoption ── */}
        {data && eng && m && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              User Engagement &amp; Adoption
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Login Activity */}
              <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: "#10b981" }}>
                    <LogIn className="h-4 w-4" />
                    Login Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 grid grid-cols-2 gap-3">
                  <StatPill label="Total login sessions" value={fmt(m.logins.total)} icon={LogIn} color="#10b981" />
                  {!isAllTime && (
                    <StatPill label={`Sessions ${periodLabel[period].cur.toLowerCase()}`} value={fmt(m.logins.current)} icon={LogIn} color="#10b981" />
                  )}
                  {!isAllTime && (
                    <StatPill label="Unique users logged in" value={fmt(eng.curUniqueLoginUsers)} icon={Users} color="#0ea5e9" />
                  )}
                  <StatPill label="Cases active last 30 days" value={fmt(eng.casesActive30d)} icon={Clock} color="#f59e0b" />
                  {!isAllTime && (
                    <div className="col-span-2 pt-1">
                      <Delta current={m.logins.current} previous={m.logins.previous} isAllTime={isAllTime} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Messaging Activity */}
              <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: "#0ea5e9" }}>
                    <MessageSquare className="h-4 w-4" />
                    Messaging Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 grid grid-cols-2 gap-3">
                  <StatPill label="Total messages sent" value={fmt(m.messages.total)} icon={MessageSquare} color="#0ea5e9" />
                  {!isAllTime && (
                    <StatPill label={`Messages ${periodLabel[period].cur.toLowerCase()}`} value={fmt(m.messages.current)} icon={MessageSquare} color="#0ea5e9" />
                  )}
                  <StatPill label="Messages with attachments" value={fmt(eng.msgsWithAttachments)} icon={Paperclip} color="#6366f1" />
                  <StatPill label="Case submissions" value={fmt(m.submissions.total)} icon={ClipboardList} color="#ec4899" />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── Value Indicators ── */}
        {data && vi && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" />
              Portal Value Indicators
            </h2>
            <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-gray-800">
                  {[
                    { value: vi.avgMsgsPerCase,          label: "Avg messages per case",   sub: "Ongoing dialogue depth",       color: "#0ea5e9" },
                    { value: vi.avgActivitiesPerCase,     label: "Avg interactions per case", sub: "Touchpoints per matter",     color: "#f59e0b" },
                    { value: `${vi.submissionConversionRate}%`, label: "Submission conversion", sub: "Submissions becoming cases", color: "#7c3aed" },
                    { value: `${vi.attachmentRate}%`,    label: "Messages with files",     sub: "Digital document exchange",    color: "#6366f1" },
                  ].map((item, i) => (
                    <div key={i} className="p-5 text-center">
                      <div className="text-2xl font-bold tabular-nums mb-1" style={{ color: item.color }}>{item.value}</div>
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{item.label}</div>
                      <div className="text-xs text-gray-400 leading-tight">{item.sub}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── At a Glance ── */}
        {data && !isLoading && m && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-slate-400" />
              At a Glance
            </h2>
            <div className="rounded-xl border-0 ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-card shadow-sm p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {[
                  { label: "Active Cases",              value: m.cases.active,                   color: "#7c3aed" },
                  { label: "Cases Active (Last 30d)",   value: eng?.casesActive30d ?? 0,          color: "#f59e0b" },
                  { label: "Total Portal Interactions", value: m.activities.total,                color: TEAL },
                  { label: "Total Payments Value",      value: fmtCurrency(m.payments.totalValue), color: "#6366f1", isText: true },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="text-2xl font-bold tabular-nums" style={{ color: s.color }}>
                      {(s as any).isText ? s.value : fmt(s.value as number)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="pb-8" />
      </div>
    </div>
  );
}
