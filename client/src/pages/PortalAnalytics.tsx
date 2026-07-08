import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, Building2, FolderOpen, MessageSquare, FileText,
  Activity, ClipboardList, CreditCard, ArrowLeft,
  TrendingUp, TrendingDown, Minus, BarChart3, LogIn,
  Clock, Paperclip, Star, Zap, Telescope, FileOutput,
  AlertTriangle, CheckCircle2, Timer,
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
  messageResponseHealth: {
    periodUserMessages: number;
    unansweredTotal: number;
    unansweredOver7Days: number;
    unanswered2to7Days: number;
    unansweredUnder2Days: number;
  };
  trend: {
    label: string;
    curActivities: number; prevActivities: number;
    curMessages: number;   prevMessages: number;
    curCases: number;      prevCases: number;
  }[];
}

const TEAL  = "#0d9488";
const NAVY  = "#1e3a5f";
const PIE_PALETTE = ["#0d9488","#0ea5e9","#7c3aed","#f59e0b","#f97316","#ec4899","#10b981","#6366f1"];
const METRIC_COLORS = { activities: "#f59e0b", messages: "#0ea5e9", cases: "#7c3aed" };

const PERIODS: { value: Period; label: string }[] = [
  { value: "week",    label: "This Week" },
  { value: "month",   label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year",    label: "This Year" },
  { value: "all",     label: "All Time" },
];

const PERIOD_WEEKS: Record<Period, number> = { week: 1, month: 4.33, quarter: 13, year: 52, all: 52 };

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

function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

function changeSentence(cur: number, prev: number, noun: string, prevPeriodName: string): string {
  if (prev === 0 && cur === 0) return `No ${noun} were recorded in either period.`;
  if (prev === 0) return `${cur} ${noun} were recorded — no data from ${prevPeriodName} to compare.`;
  const pct = Math.abs(Math.round(((cur - prev) / prev) * 100));
  const dir = cur > prev ? "up" : cur < prev ? "down" : "unchanged";
  if (dir === "unchanged") return `${cur} ${noun} were recorded, unchanged from ${prevPeriodName}.`;
  return `${cur.toLocaleString()} ${noun} — ${dir} ${pct}% from ${prev.toLocaleString()} ${prevPeriodName}.`;
}

function buildProjection(data: AnalyticsData, period: Period) {
  const m = data.metrics;
  const weeksIn = PERIOD_WEEKS[period];
  const Q = 13; // next quarter = 13 weeks

  const rate = (n: number) => n / weeksIn;
  const grow = (cur: number, prev: number) => prev > 0 ? Math.min(Math.max(cur / prev, 0.4), 3) : 1;

  const caseGrowth  = grow(m.cases.current, m.cases.previous);
  const msgGrowth   = grow(m.messages.current, m.messages.previous);
  const actGrowth   = grow(m.activities.current, m.activities.previous);

  return {
    projCases:      Math.round(rate(m.cases.current)      * Q * caseGrowth),
    projMessages:   Math.round(rate(m.messages.current)   * Q * msgGrowth),
    projActivities: Math.round(rate(m.activities.current) * Q * actGrowth),
    caseGrowth, msgGrowth, actGrowth,
  };
}

function NarrativeSummary({ data, period }: { data: AnalyticsData; period: Period }) {
  const m  = data.metrics;
  const isAllTime = period === "all";
  const prev = periodLabel[period].prev.toLowerCase();

  if (isAllTime) {
    return (
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
        The Acclaim portal has been used by <strong>{m.orgs.total} client {m.orgs.total === 1 ? "organisation" : "organisations"}</strong> across{" "}
        <strong>{m.users.total} registered {m.users.total === 1 ? "user" : "users"}</strong> since it was established.
        A total of <strong>{m.cases.total.toLocaleString()} {m.cases.total === 1 ? "case" : "cases"}</strong> have been managed through the portal —{" "}
        <strong>{m.cases.active} currently active</strong> and <strong>{m.cases.closed} concluded</strong>.
        Clients and the recovery team have exchanged <strong>{m.messages.total.toLocaleString()} messages</strong>,
        with <strong>{m.documents.total.toLocaleString()} documents</strong> uploaded in support of case work.
        <strong>{m.logins.total.toLocaleString()} login sessions</strong> have been recorded in total,
        demonstrating consistent engagement with the platform.
      </p>
    );
  }

  const casePct  = pctChange(m.cases.current,      m.cases.previous);
  const msgPct   = pctChange(m.messages.current,   m.messages.previous);
  const loginPct = pctChange(m.logins.current,     m.logins.previous);
  const docPct   = pctChange(m.documents.current,  m.documents.previous);

  const badge = (pct: number | null, value: number) => {
    if (pct === null) return <strong>{value.toLocaleString()}</strong>;
    const up   = pct > 0;
    const flat = pct === 0;
    const col  = flat ? "text-gray-500" : up ? "text-emerald-600" : "text-rose-500";
    return (
      <>
        <strong>{value.toLocaleString()}</strong>{" "}
        <span className={`text-xs font-semibold ${col}`}>
          ({up ? "+" : ""}{pct}% vs {prev})
        </span>
      </>
    );
  };

  const proj = buildProjection(data, period);
  const quarterDir = proj.caseGrowth >= 1.05 ? "growing" : proj.caseGrowth <= 0.95 ? "slowing" : "stable";

  return (
    <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
      <p>
        The Acclaim portal is the central hub through which <strong>{m.orgs.total} client {m.orgs.total === 1 ? "organisation" : "organisations"}</strong> and{" "}
        <strong>{m.users.total} registered {m.users.total === 1 ? "user" : "users"}</strong> instruct, monitor, and communicate about debt recovery matters.
        The figures below cover <strong>{periodLabel[period].cur.toLowerCase()}</strong>, compared against the equivalent period prior.
      </p>
      <ul className="space-y-1.5 pl-4 list-disc marker:text-teal-400">
        <li>
          <strong>New cases:</strong> {badge(casePct, m.cases.current)}.{" "}
          {m.cases.active > 0 && <span>{m.cases.active} {m.cases.active === 1 ? "case remains" : "cases remain"} active in total.</span>}
        </li>
        <li>
          <strong>Messages exchanged:</strong> {badge(msgPct, m.messages.current)}.{" "}
          Secure messaging keeps clients informed without needing to pick up the phone.
        </li>
        <li>
          <strong>Staff and client logins:</strong> {badge(loginPct, m.logins.current)}.{" "}
          {data.engagement.curUniqueLoginUsers > 0 && <span>{data.engagement.curUniqueLoginUsers} unique {data.engagement.curUniqueLoginUsers === 1 ? "individual" : "individuals"} accessed the portal.</span>}
        </li>
        <li>
          <strong>Documents uploaded:</strong> {badge(docPct, m.documents.current)}.{" "}
          Files are stored securely and linked directly to each case.
        </li>
        {m.payments.current > 0 && (
          <li>
            <strong>Payments recorded:</strong> <strong>{m.payments.current.toLocaleString()}</strong> payment{m.payments.current === 1 ? "" : "s"} worth <strong>{fmtCurrency(m.payments.totalValue)}</strong> in total.
          </li>
        )}
      </ul>
      <p className="text-gray-500 dark:text-gray-400 italic">
        Based on current activity, the next quarter is estimated to see approximately{" "}
        <strong className="text-gray-700 dark:text-gray-300">{proj.projCases.toLocaleString()} new cases</strong>,{" "}
        <strong className="text-gray-700 dark:text-gray-300">{proj.projMessages.toLocaleString()} messages</strong>, and{" "}
        <strong className="text-gray-700 dark:text-gray-300">{proj.projActivities.toLocaleString()} case interactions</strong>.{" "}
        Volume is currently <strong>{quarterDir}</strong>
        {quarterDir === "growing" ? ", reflecting increased demand and platform adoption." :
         quarterDir === "slowing" ? ", which may warrant a review of case flow and client engagement." :
         ", with consistent throughput across the period."}
      </p>
    </div>
  );
}

function Delta({ current, previous, isAllTime }: { current: number; previous: number; isAllTime: boolean }) {
  if (isAllTime) return null;
  const delta = current - previous;
  const pct = previous === 0 ? (current > 0 ? 100 : 0) : Math.round((delta / previous) * 100);
  if (delta === 0 && previous === 0) return <span className="flex items-center gap-1 text-xs text-gray-400"><Minus className="h-3 w-3" /> No data yet</span>;
  if (delta > 0) return <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><TrendingUp className="h-3 w-3" /> +{fmt(delta)} ({pct}%)</span>;
  if (delta < 0) return <span className="flex items-center gap-1 text-xs font-semibold text-rose-500"><TrendingDown className="h-3 w-3" /> {fmt(delta)} ({pct}%)</span>;
  return <span className="flex items-center gap-1 text-xs text-gray-400"><Minus className="h-3 w-3" /> No change</span>;
}

function KpiCard({ icon: Icon, label, description, total, current, previous, isAllTime, accent, sub }: {
  icon: any; label: string; description: string; total: number; current: number; previous: number;
  isAllTime: boolean; accent: string; sub?: string;
}) {
  return (
    <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="rounded-lg p-2" style={{ background: `${accent}15` }}>
            <Icon className="h-5 w-5" style={{ color: accent }} />
          </div>
          {!isAllTime && <Delta current={current} previous={previous} isAllTime={isAllTime} />}
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-0.5 tabular-nums">{fmt(total)}</div>
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</div>
        <div className="text-xs text-gray-400 leading-snug">{description}</div>
        {sub && <div className="text-xs text-teal-600 dark:text-teal-400 mt-1.5 font-medium">{sub}</div>}
        {!isAllTime && (
          <div className="border-t mt-3 pt-2 flex items-center justify-between text-xs">
            <span className="text-gray-400">This period:</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">{fmt(current)} <span className="text-gray-400 font-normal">vs</span> {fmt(previous)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-xs min-w-[150px]">
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
      <span className="font-bold text-gray-800 dark:text-gray-100">{p.value}</span>
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

function SectionHeader({ icon: Icon, iconColor, title, description }: {
  icon: any; iconColor: string; title: string; description: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
        {title}
      </h2>
      <p className="text-xs text-gray-400 mt-0.5 ml-6">{description}</p>
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

function openHtmlReport(data: AnalyticsData, period: Period, dateRangeLabel: string, prevDateLabel: string) {
  const m = data.metrics;
  const vi = data.valueIndicators;
  const eng = data.engagement;
  const isAllTime = period === "all";
  const prev = periodLabel[period].prev;
  const now = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const proj = !isAllTime ? buildProjection(data, period) : null;

  const pctBadge = (cur: number, pre: number) => {
    if (pre === 0) return "";
    const p = Math.round(((cur - pre) / pre) * 100);
    const col = p > 0 ? "#10b981" : p < 0 ? "#ef4444" : "#6b7280";
    const arrow = p > 0 ? "▲" : p < 0 ? "▼" : "—";
    return `<span style="color:${col};font-size:11px;font-weight:600"> ${arrow} ${p > 0 ? "+" : ""}${p}%</span>`;
  };

  const metricRow = (label: string, total: number, cur: number, pre: number, note = "") => `
    <tr>
      <td>${label}${note ? `<br><span style="font-size:11px;color:#6b7280">${note}</span>` : ""}</td>
      <td style="text-align:right;font-weight:600">${total.toLocaleString()}</td>
      ${isAllTime ? "" : `<td style="text-align:right">${cur.toLocaleString()}</td><td style="text-align:right">${pre.toLocaleString()}</td><td style="text-align:right">${pctBadge(cur, pre)}</td>`}
    </tr>`;

  const statusBar = (status: string, count: number, total: number, color: string) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return `<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px">
        <span>${status}</span><span style="font-weight:600">${count} (${pct}%)</span>
      </div>
      <div style="background:#e5e7eb;border-radius:4px;height:10px;overflow:hidden">
        <div style="background:${color};width:${pct}%;height:100%;border-radius:4px"></div>
      </div>
    </div>`;
  };

  const totalCases = data.breakdowns.casesByStatus.reduce((a, b) => a + b.count, 0);

  const narrativeAllTime = `
    The Acclaim portal has been used by ${m.orgs.total} client ${m.orgs.total === 1 ? "organisation" : "organisations"}
    across ${m.users.total} registered ${m.users.total === 1 ? "user" : "users"} since it was established.
    A total of ${m.cases.total.toLocaleString()} ${m.cases.total === 1 ? "case" : "cases"} have been managed
    — ${m.cases.active} currently active and ${m.cases.closed} concluded.
    Clients and the recovery team have exchanged ${m.messages.total.toLocaleString()} messages,
    with ${m.documents.total.toLocaleString()} documents uploaded in support of case work.`;

  const narrativePeriod = !isAllTime ? `
    The Acclaim portal is the central hub through which ${m.orgs.total} client ${m.orgs.total === 1 ? "organisation" : "organisations"}
    and ${m.users.total} registered ${m.users.total === 1 ? "user" : "users"} instruct, monitor, and communicate about debt recovery matters.
    The figures below cover <strong>${periodLabel[period].cur}</strong> (${dateRangeLabel})${prevDateLabel ? `, compared against ${prevDateLabel}.` : "."}
    <br><br>
    ${changeSentence(m.cases.current, m.cases.previous, m.cases.current === 1 ? "new case was" : "new cases were", prev.toLowerCase())}
    ${changeSentence(m.messages.current, m.messages.previous, m.messages.current === 1 ? "message was" : "messages were", prev.toLowerCase())}
    ${changeSentence(m.logins.current, m.logins.previous, m.logins.current === 1 ? "login session was" : "login sessions were", prev.toLowerCase())}
    ${m.payments.current > 0 ? `${m.payments.current.toLocaleString()} payment${m.payments.current === 1 ? "" : "s"} worth ${fmtCurrency(m.payments.totalValue)} were recorded.` : ""}` : "";

  const projectionSection = proj ? `
    <div class="section">
      <h2>&#128300; Projected Outlook — Next Quarter</h2>
      <p style="color:#6b7280;font-size:13px;margin-bottom:16px">
        Estimates are based on the current period's activity rate, adjusted for the observed growth or decline trend compared to the previous period.
        These are indicative projections, not guarantees.
      </p>
      <table>
        <thead><tr><th>Metric</th><th style="text-align:right">Projected (Next Quarter)</th><th style="text-align:right">Trend factor</th></tr></thead>
        <tbody>
          <tr><td>New Cases</td><td style="text-align:right;font-weight:600;color:#7c3aed">${proj.projCases.toLocaleString()}</td><td style="text-align:right">${proj.caseGrowth > 1.05 ? "📈 Growing" : proj.caseGrowth < 0.95 ? "📉 Declining" : "➡ Stable"}</td></tr>
          <tr><td>Messages Exchanged</td><td style="text-align:right;font-weight:600;color:#0ea5e9">${proj.projMessages.toLocaleString()}</td><td style="text-align:right">${proj.msgGrowth > 1.05 ? "📈 Growing" : proj.msgGrowth < 0.95 ? "📉 Declining" : "➡ Stable"}</td></tr>
          <tr><td>Case Interactions</td><td style="text-align:right;font-weight:600;color:#f59e0b">${proj.projActivities.toLocaleString()}</td><td style="text-align:right">${proj.actGrowth > 1.05 ? "📈 Growing" : proj.actGrowth < 0.95 ? "📉 Declining" : "➡ Stable"}</td></tr>
        </tbody>
      </table>
    </div>` : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acclaim Portal — Performance Overview — ${now}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; color: #1f2937; background: #f9fafb; font-size: 14px; }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #0d9488 100%); color: white; padding: 36px 48px; }
    .header h1 { margin: 0 0 4px; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
    .header .subtitle { font-size: 14px; opacity: 0.75; margin: 0 0 10px; }
    .header .meta { font-size: 12px; opacity: 0.55; }
    .no-print { position: fixed; top: 16px; right: 16px; z-index: 100; }
    .print-btn { background: #0d9488; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .print-btn:hover { background: #0f766e; }
    .content { max-width: 1100px; margin: 0 auto; padding: 32px 48px 48px; }
    .section { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px; margin-bottom: 24px; }
    .section h2 { font-size: 16px; font-weight: 700; color: #1e3a5f; margin: 0 0 16px; padding-bottom: 12px; border-bottom: 2px solid #f0fdf4; display: flex; align-items: center; gap: 8px; }
    .section .desc { font-size: 12px; color: #6b7280; margin-top: -10px; margin-bottom: 16px; }
    .narrative { background: linear-gradient(135deg, #f0fdfa, #eff6ff); border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px 24px; font-size: 14px; line-height: 1.7; color: #374151; }
    .narrative strong { color: #1e3a5f; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .kpi-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px; }
    .kpi-icon { width: 36px; height: 36px; border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .kpi-value { font-size: 28px; font-weight: 800; color: #1e3a5f; letter-spacing: -1px; }
    .kpi-label { font-size: 12px; font-weight: 600; color: #374151; margin: 2px 0; }
    .kpi-desc { font-size: 11px; color: #6b7280; line-height: 1.4; }
    .kpi-sub { font-size: 11px; color: #0d9488; font-weight: 600; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f3f4f6; color: #374151; font-weight: 600; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
    td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f9fafb; }
    .delta-pos { color: #10b981; font-size: 11px; font-weight: 600; }
    .delta-neg { color: #ef4444; font-size: 11px; font-weight: 600; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .vi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #e5e7eb; }
    .vi-cell { background: white; padding: 20px; text-align: center; }
    .vi-value { font-size: 28px; font-weight: 800; margin-bottom: 4px; letter-spacing: -1px; }
    .vi-label { font-size: 12px; font-weight: 600; color: #374151; }
    .vi-desc { font-size: 11px; color: #9ca3af; margin-top: 3px; }
    .highlight-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px 20px; font-size: 13px; color: #92400e; line-height: 1.6; }
    .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    @media print {
      body { background: white; font-size: 12px; }
      .no-print { display: none !important; }
      .section { break-inside: avoid; box-shadow: none; border: 1px solid #d1d5db; }
      .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .narrative { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    @media (max-width: 768px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .three-col { grid-template-columns: 1fr; }
      .vi-grid { grid-template-columns: repeat(2, 1fr); }
      .content { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
  </div>

  <div class="header">
    <h1>Acclaim Credit Management Portal</h1>
    <div class="subtitle">Performance Overview &mdash; ${dateRangeLabel}</div>
    <div class="meta">Generated on ${now}${!isAllTime && prevDateLabel ? ` &nbsp;·&nbsp; Compared against: ${prevDateLabel}` : ""}</div>
  </div>

  <div class="content">

    <div class="section">
      <h2>&#128196; Summary</h2>
      <p class="desc">An overview of what happened during the selected period.</p>
      <div class="narrative">
        ${isAllTime ? narrativeAllTime : narrativePeriod}
      </div>
    </div>

    <div class="section">
      <h2>&#128202; Key Metrics</h2>
      <p class="desc">All figures are totals since the portal began. "This period" and "Previous period" columns show activity within the selected date range only.</p>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th style="text-align:right">All Time Total</th>
            ${isAllTime ? "" : `<th style="text-align:right">This Period</th><th style="text-align:right">Previous Period</th><th style="text-align:right">Change</th>`}
          </tr>
        </thead>
        <tbody>
          ${metricRow("Cases Opened", m.cases.total, m.cases.current, m.cases.previous, `${m.cases.active} active · ${m.cases.closed} concluded`)}
          ${metricRow("Messages Exchanged", m.messages.total, m.messages.current, m.messages.previous, "Secure messages between clients and the recovery team")}
          ${metricRow("Documents Uploaded", m.documents.total, m.documents.current, m.documents.previous, "Supporting files attached to cases")}
          ${metricRow("Login Sessions", m.logins.total, m.logins.current, m.logins.previous, !isAllTime && eng.curUniqueLoginUsers ? `${eng.curUniqueLoginUsers} unique individuals this period` : "")}
          ${metricRow("Case Interactions", m.activities.total, m.activities.current, m.activities.previous, "Updates, notes, and actions recorded on cases")}
          ${metricRow("Payments Recorded", m.payments.total, m.payments.current, m.payments.previous, `${fmtCurrency(m.payments.totalValue)} total value`)}
          ${metricRow("Case Submissions", m.submissions.total, m.submissions.current, m.submissions.previous, "New cases submitted by clients via the portal")}
          ${metricRow("Registered Users", m.users.total, m.users.current, m.users.previous)}
          ${metricRow("Client Organisations", m.orgs.total, m.orgs.current, m.orgs.previous)}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>&#128194; Case Breakdown</h2>
      <p class="desc">How the total case portfolio is distributed across statuses and debtor types.</p>
      <div class="two-col">
        <div>
          <strong style="font-size:13px;color:#374151;display:block;margin-bottom:12px">By Status</strong>
          ${data.breakdowns.casesByStatus.sort((a,b) => b.count - a.count).map((s,i) =>
            statusBar(s.status, s.count, totalCases, PIE_PALETTE[i % PIE_PALETTE.length])
          ).join("")}
        </div>
        <div>
          <strong style="font-size:13px;color:#374151;display:block;margin-bottom:12px">By Debtor Type</strong>
          ${(() => {
            const typeTotal = data.breakdowns.casesByType.reduce((a,b) => a + b.count, 0);
            return data.breakdowns.casesByType.sort((a,b) => b.count - a.count).map((t,i) =>
              statusBar(t.type, t.count, typeTotal, PIE_PALETTE[(i+3) % PIE_PALETTE.length])
            ).join("");
          })()}
        </div>
      </div>
    </div>

    <div class="section">
      <h2>&#127942; Client Organisations</h2>
      <p class="desc">Organisations with the most cases on the portal.</p>
      <table>
        <thead><tr><th>Organisation</th><th style="text-align:right">Cases</th></tr></thead>
        <tbody>
          ${data.breakdowns.topOrgs.map(o => `<tr><td>${o.name}</td><td style="text-align:right;font-weight:600">${o.cases}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>&#9889; Engagement &amp; Usage</h2>
      <p class="desc">How actively clients and staff are using the portal day-to-day.</p>
      <table>
        <thead><tr><th>Measure</th><th style="text-align:right">Value</th><th>What it means</th></tr></thead>
        <tbody>
          <tr><td>Cases active in the last 30 days</td><td style="text-align:right;font-weight:600">${eng.casesActive30d}</td><td style="color:#6b7280;font-size:12px">Cases with recent activity, showing live workload</td></tr>
          <tr><td>Messages with attachments</td><td style="text-align:right;font-weight:600">${eng.msgsWithAttachments}</td><td style="color:#6b7280;font-size:12px">Messages that included supporting documents</td></tr>
          ${!isAllTime ? `<tr><td>Unique users logged in (this period)</td><td style="text-align:right;font-weight:600">${eng.curUniqueLoginUsers}</td><td style="color:#6b7280;font-size:12px">Individual people who accessed the portal</td></tr>` : ""}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>&#11088; Value Indicators</h2>
      <p class="desc">Metrics that show how deeply the portal is being used, and how efficiently cases are being handled.</p>
      <div class="vi-grid">
        <div class="vi-cell">
          <div class="vi-value" style="color:#0ea5e9">${vi.avgMsgsPerCase}</div>
          <div class="vi-label">Avg messages per case</div>
          <div class="vi-desc">Depth of client communication per matter</div>
        </div>
        <div class="vi-cell">
          <div class="vi-value" style="color:#f59e0b">${vi.avgActivitiesPerCase}</div>
          <div class="vi-label">Avg interactions per case</div>
          <div class="vi-desc">Updates and actions logged per matter</div>
        </div>
        <div class="vi-cell">
          <div class="vi-value" style="color:#7c3aed">${vi.submissionConversionRate}%</div>
          <div class="vi-label">Submission conversion rate</div>
          <div class="vi-desc">New submissions that became active cases</div>
        </div>
        <div class="vi-cell">
          <div class="vi-value" style="color:#6366f1">${vi.attachmentRate}%</div>
          <div class="vi-label">Messages with files</div>
          <div class="vi-desc">Digital document exchange via messaging</div>
        </div>
      </div>
    </div>

    ${projectionSection}

    <div class="section">
      <h2>&#128233; Message Response Health</h2>
      <p class="desc">
        Tracks whether client messages are being replied to. A message is considered unanswered when it is the most recent message on an active case and no reply from the recovery team has followed.
        ${!isAllTime ? `During this period, <strong>${data.messageResponseHealth.periodUserMessages.toLocaleString()}</strong> messages were sent by clients.` : ""}
      </p>
      ${data.messageResponseHealth.unansweredTotal === 0
        ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;color:#166534;font-size:13px">
            ✅ &nbsp;<strong>All client messages have been replied to.</strong> No unanswered messages were found on any active case.
           </div>`
        : `<table>
            <thead><tr><th>Category</th><th style="text-align:right">Count</th><th>What this means</th></tr></thead>
            <tbody>
              <tr>
                <td><strong>Total unanswered messages</strong></td>
                <td style="text-align:right;font-weight:700;color:#dc2626">${data.messageResponseHealth.unansweredTotal}</td>
                <td style="color:#6b7280;font-size:12px">Active cases where the last message is from a client with no reply yet</td>
              </tr>
              <tr>
                <td style="padding-left:24px">⟶ Waiting over 7 days</td>
                <td style="text-align:right;font-weight:600;color:#b91c1c">${data.messageResponseHealth.unansweredOver7Days}</td>
                <td style="color:#6b7280;font-size:12px">Longest outstanding — these require urgent attention</td>
              </tr>
              <tr>
                <td style="padding-left:24px">⟶ Waiting 2 – 7 days</td>
                <td style="text-align:right;font-weight:600;color:#f59e0b">${data.messageResponseHealth.unanswered2to7Days}</td>
                <td style="color:#6b7280;font-size:12px">Approaching escalation threshold</td>
              </tr>
              <tr>
                <td style="padding-left:24px">⟶ Waiting under 2 days</td>
                <td style="text-align:right;font-weight:600;color:#10b981">${data.messageResponseHealth.unansweredUnder2Days}</td>
                <td style="color:#6b7280;font-size:12px">Within normal response window</td>
              </tr>
            </tbody>
           </table>`
      }
    </div>

    <div class="highlight-box">
      &#9432; &nbsp;<strong>About these figures:</strong> All data is drawn directly from live portal records.
      Projections are estimates based on observed activity rates and period-on-period trends — they are intended as a planning guide only.
      For a full case-by-case breakdown, please refer to the detailed case reports available within the portal.
    </div>

    <div class="footer">
      Acclaim Credit Management Portal &nbsp;·&nbsp; Performance Overview &nbsp;·&nbsp; Generated ${now}
      <br>Confidential — for internal use only
    </div>

  </div>

  <script>
    document.querySelectorAll('table').forEach(t => {
      t.querySelectorAll('tr').forEach((row, i) => {
        if (i % 2 === 1) row.style.background = '#f9fafb';
      });
    });
  </script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

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
    if (isAllTime) return "All recorded data";
    const s = new Date(data.dateRange.startCurrent);
    const e = new Date(data.dateRange.endCurrent);
    return `${formatUKDateLong(s.toISOString())} – ${formatUKDateLong(e.toISOString())}`;
  })() : "";

  const prevDateLabel = data?.dateRange.startPrevious ? (() => {
    const s = new Date(data.dateRange.startPrevious!);
    const e = new Date(data.dateRange.endPrevious!);
    return `${formatUKDateLong(s.toISOString())} – ${formatUKDateLong(e.toISOString())}`;
  })() : "";

  const trendData = data?.trend ?? [];
  const proj = data && !isAllTime ? buildProjection(data, period) : null;

  const kpis = m ? [
    { icon: FolderOpen,    label: "Total Cases",        description: "All cases ever opened on the portal, regardless of status.", total: m.cases.total,       current: m.cases.current,      previous: m.cases.previous,      accent: "#7c3aed", sub: `${m.cases.active} active · ${m.cases.closed} concluded` },
    { icon: MessageSquare, label: "Messages Sent",      description: "Secure messages exchanged between clients and the recovery team.", total: m.messages.total,    current: m.messages.current,   previous: m.messages.previous,   accent: "#0ea5e9" },
    { icon: Activity,      label: "Case Interactions",  description: "Every update, note, or action recorded on a case.", total: m.activities.total,  current: m.activities.current, previous: m.activities.previous, accent: "#f59e0b" },
    { icon: LogIn,         label: "Login Sessions",     description: "Times a user has signed into the portal.", total: m.logins.total,      current: m.logins.current,     previous: m.logins.previous,     accent: "#10b981" },
    { icon: FileText,      label: "Documents Uploaded", description: "Supporting files and evidence attached to cases.", total: m.documents.total,   current: m.documents.current,  previous: m.documents.previous,  accent: "#f97316" },
    { icon: CreditCard,    label: "Payments Recorded",  description: "Payments logged against cases on the portal.", total: m.payments.total,    current: m.payments.current,   previous: m.payments.previous,   accent: "#6366f1", sub: fmtCurrency(m.payments.totalValue) },
    { icon: Users,         label: "Registered Users",   description: "Individuals with active access to the portal.", total: m.users.total,       current: m.users.current,      previous: m.users.previous,      accent: TEAL },
    { icon: Building2,     label: "Organisations",      description: "Client organisations with cases on the portal.", total: m.orgs.total,        current: m.orgs.current,       previous: m.orgs.previous,       accent: NAVY },
  ] : [];

  const statusData = (data?.breakdowns.casesByStatus ?? []).sort((a,b) => b.count - a.count).map(r => ({ name: r.status, value: r.count }));
  const caseTypeData = (data?.breakdowns.casesByType ?? []).sort((a,b) => b.count - a.count).map(r => ({ name: r.type, value: r.count }));
  const topOrgsData = (data?.breakdowns.topOrgs ?? []).map(r => ({ name: r.name.length > 18 ? r.name.slice(0,16) + "…" : r.name, value: r.cases }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">

      {/* Header */}
      <div className="text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${TEAL} 100%)` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="pt-4">
            <button onClick={() => setLocation("/admin")}
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Admin Panel
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-6 w-6 text-white/80" />
                <h1 className="text-2xl font-bold tracking-tight">Portal Analytics</h1>
              </div>
              <p className="text-white/70 text-sm">Performance overview of the Acclaim debt recovery portal</p>
              {data && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/60">
                  <span>{dateRangeLabel}</span>
                  {!isAllTime && prevDateLabel && <span className="text-white/40">vs {prevDateLabel}</span>}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {data && (
                <button
                  onClick={() => openHtmlReport(data, period, dateRangeLabel, prevDateLabel)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-all border border-white/20"
                  data-testid="button-open-report"
                >
                  <FileOutput className="h-4 w-4" />
                  Open as Report
                </button>
              )}
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Executive Summary ── */}
        {data && !isLoading && (
          <div>
            <SectionHeader
              icon={FileOutput} iconColor={TEAL}
              title="Summary"
              description="An overview of what happened during the selected period."
            />
            <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm overflow-hidden">
              <CardContent className="p-6 bg-gradient-to-br from-teal-50/50 to-blue-50/30 dark:from-teal-950/20 dark:to-blue-950/10">
                <NarrativeSummary data={data} period={period} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── KPI Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-44 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : m ? (
          <div>
            <SectionHeader
              icon={BarChart3} iconColor="#64748b"
              title="Key Figures"
              description="Total figures across all time, with this period vs last period shown on each card."
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {kpis.map(k => (
                <KpiCard key={k.label} icon={k.icon} label={k.label} description={k.description}
                  total={k.total} current={k.current} previous={k.previous}
                  isAllTime={isAllTime} accent={k.accent} sub={k.sub} />
              ))}
            </div>
          </div>
        ) : null}

        {/* ── Combined Activity Trend ── */}
        {!isAllTime && (
          <div>
            <SectionHeader
              icon={Activity} iconColor={TEAL}
              title="Activity Over Time"
              description={`How case interactions, messages, and new cases have evolved across ${periodLabel[period].cur.toLowerCase()}. Solid lines = current period, dashed = previous.`}
            />
            <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm overflow-hidden">
              <CardContent className="pt-6 pb-4">
                {isLoading || !trendData.length ? (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                    {isLoading ? "Loading…" : "No trend data available for this period."}
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
                      <Line dataKey="prevActivities" name="Interactions (prev)"     stroke={METRIC_COLORS.activities} strokeWidth={1.5} dot={false} strokeDasharray="5 4" strokeOpacity={0.4} />
                      <Line dataKey="prevMessages"   name="Messages (prev)"         stroke={METRIC_COLORS.messages}   strokeWidth={1.5} dot={false} strokeDasharray="5 4" strokeOpacity={0.4} />
                      <Line dataKey="prevCases"      name="New Cases (prev)"        stroke={METRIC_COLORS.cases}      strokeWidth={1.5} dot={false} strokeDasharray="5 4" strokeOpacity={0.4} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Case Breakdowns ── */}
        {data && (
          <div>
            <SectionHeader
              icon={FolderOpen} iconColor="#7c3aed"
              title="Case Breakdown"
              description="How the total case portfolio is split by status (e.g. Active, Closed) and by the type of debtor involved."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>By Status</CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">Where each case sits in the recovery process</p>
                </CardHeader>
                <CardContent className="pt-2 pb-4">
                  {statusData.length === 0 ? <p className="text-sm text-gray-400 p-4">No case data.</p> : (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                            innerRadius={55} outerRadius={85} labelLine={false} label={renderCustomLabel}>
                            {statusData.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}
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

              <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>By Debtor Type</CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">Whether money is owed by a business or individual</p>
                </CardHeader>
                <CardContent className="pt-4 pb-4">
                  {caseTypeData.length === 0 ? <p className="text-sm text-gray-400">No case data.</p> : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={caseTypeData} layout="vertical" margin={{ left: 0, right: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={80} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="value" name="Cases" radius={[0,4,4,0]}>
                          {caseTypeData.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-sm font-semibold" style={{ color: NAVY }}>Top Organisations</CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">Which clients have the most cases on the portal</p>
                </CardHeader>
                <CardContent className="pt-4 pb-4">
                  {topOrgsData.length === 0 ? <p className="text-sm text-gray-400">No data.</p> : (
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

        {/* ── Projected Outlook ── */}
        {!isAllTime && proj && m && (
          <div>
            <SectionHeader
              icon={Telescope} iconColor="#7c3aed"
              title="Projected Outlook — Next Quarter"
              description="Estimates for the next 13 weeks based on current activity rates and observed growth or decline trends. These are indicative planning figures."
            />
            <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-800">
                  {[
                    { label: "New Cases",          value: proj.projCases,       growth: proj.caseGrowth,  color: "#7c3aed", current: m.cases.current },
                    { label: "Messages Exchanged", value: proj.projMessages,    growth: proj.msgGrowth,   color: "#0ea5e9", current: m.messages.current },
                    { label: "Case Interactions",  value: proj.projActivities,  growth: proj.actGrowth,   color: "#f59e0b", current: m.activities.current },
                  ].map(item => {
                    const up   = item.growth > 1.05;
                    const down = item.growth < 0.95;
                    return (
                      <div key={item.label} className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</span>
                          {up   && <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><TrendingUp className="h-3 w-3" /> Growing</span>}
                          {down && <span className="flex items-center gap-1 text-xs font-semibold text-rose-500"><TrendingDown className="h-3 w-3" /> Declining</span>}
                          {!up && !down && <span className="flex items-center gap-1 text-xs text-gray-400"><Minus className="h-3 w-3" /> Stable</span>}
                        </div>
                        <div className="text-4xl font-bold tabular-nums mb-1" style={{ color: item.color }}>{item.value.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">estimated next quarter</div>
                        <div className="text-xs text-gray-500 mt-2">Current period: <strong>{item.current.toLocaleString()}</strong></div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Engagement & Adoption ── */}
        {data && eng && m && (
          <div>
            <SectionHeader
              icon={Zap} iconColor="#f59e0b"
              title="Engagement & Usage"
              description="How actively clients and staff are using the portal — logins, messaging, and live case activity."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: "#10b981" }}>
                    <LogIn className="h-4 w-4" /> Login Activity
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">How often people are signing in and who's actively using the portal</p>
                </CardHeader>
                <CardContent className="pt-4 grid grid-cols-2 gap-3">
                  <StatPill label="Total login sessions (all time)" value={fmt(m.logins.total)} icon={LogIn} color="#10b981" />
                  {!isAllTime && <StatPill label={`Sessions ${periodLabel[period].cur.toLowerCase()}`} value={fmt(m.logins.current)} icon={LogIn} color="#10b981" />}
                  {!isAllTime && <StatPill label="Unique individuals this period" value={fmt(eng.curUniqueLoginUsers)} icon={Users} color="#0ea5e9" />}
                  <StatPill label="Cases with recent activity (30d)" value={fmt(eng.casesActive30d)} icon={Clock} color="#f59e0b" />
                  {!isAllTime && <div className="col-span-2 pt-1"><Delta current={m.logins.current} previous={m.logins.previous} isAllTime={isAllTime} /></div>}
                </CardContent>
              </Card>

              <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: "#0ea5e9" }}>
                    <MessageSquare className="h-4 w-4" /> Messaging Activity
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">Secure messages keep clients and the team connected without phone calls or emails</p>
                </CardHeader>
                <CardContent className="pt-4 grid grid-cols-2 gap-3">
                  <StatPill label="Total messages (all time)" value={fmt(m.messages.total)} icon={MessageSquare} color="#0ea5e9" />
                  {!isAllTime && <StatPill label={`Messages ${periodLabel[period].cur.toLowerCase()}`} value={fmt(m.messages.current)} icon={MessageSquare} color="#0ea5e9" />}
                  <StatPill label="Messages with attached files" value={fmt(eng.msgsWithAttachments)} icon={Paperclip} color="#6366f1" />
                  <StatPill label="Case submissions (all time)" value={fmt(m.submissions.total)} icon={ClipboardList} color="#ec4899" />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── Message Response Health ── */}
        {data && data.messageResponseHealth && (
          <div>
            <SectionHeader
              icon={MessageSquare} iconColor="#0ea5e9"
              title="Message Response Health"
              description="Shows whether client messages on active cases have been replied to. An unanswered message is one where a client sent the last message with no follow-up reply from the team."
            />
            <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                {(() => {
                  const mrh = data.messageResponseHealth;
                  const answered = mrh.periodUserMessages > 0 ? mrh.periodUserMessages - mrh.unansweredTotal : 0;
                  const answeredPct = mrh.periodUserMessages > 0 ? Math.round((answered / mrh.periodUserMessages) * 100) : 100;
                  const allGood = mrh.unansweredTotal === 0;

                  return (
                    <div className="space-y-5">
                      {/* Top-line overview */}
                      {!isAllTime && mrh.periodUserMessages > 0 && (
                        <div className="flex flex-wrap gap-3">
                          <div className="flex-1 min-w-[200px] bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 flex items-center gap-3">
                            <div className="rounded-lg p-2" style={{ background: "#0ea5e915" }}>
                              <MessageSquare className="h-5 w-5" style={{ color: "#0ea5e9" }} />
                            </div>
                            <div>
                              <div className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{mrh.periodUserMessages.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">Client messages received this period</div>
                            </div>
                          </div>
                          <div className="flex-1 min-w-[200px] bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 flex items-center gap-3">
                            <div className="rounded-lg p-2" style={{ background: allGood ? "#10b98115" : "#dc262615" }}>
                              {allGood
                                ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                : <AlertTriangle className="h-5 w-5 text-red-500" />}
                            </div>
                            <div>
                              <div className="text-2xl font-bold tabular-nums" style={{ color: allGood ? "#10b981" : "#dc2626" }}>
                                {mrh.unansweredTotal}
                              </div>
                              <div className="text-xs text-gray-500">Currently unanswered{!allGood && ` (${100 - answeredPct}% of period messages)`}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* All-good banner */}
                      {allGood ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">All client messages have been replied to</p>
                            <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-0.5">No active cases have an unanswered client message outstanding.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Unanswered messages by age</p>

                          {/* Over 7 days */}
                          <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between">
                                <span className="text-sm font-semibold text-red-700 dark:text-red-400">Waiting over 7 days</span>
                                <span className="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">{mrh.unansweredOver7Days}</span>
                              </div>
                              <p className="text-xs text-red-500/80 mt-0.5">These have exceeded the escalation threshold and require urgent attention.</p>
                            </div>
                          </div>

                          {/* 2–7 days */}
                          <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                            <Timer className="h-5 w-5 text-amber-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between">
                                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Waiting 2 – 7 days</span>
                                <span className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{mrh.unanswered2to7Days}</span>
                              </div>
                              <p className="text-xs text-amber-500/80 mt-0.5">Approaching the escalation window — a response should be prioritised.</p>
                            </div>
                          </div>

                          {/* Under 2 days */}
                          <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                            <Clock className="h-5 w-5 text-blue-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between">
                                <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">Waiting under 2 days</span>
                                <span className="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">{mrh.unansweredUnder2Days}</span>
                              </div>
                              <p className="text-xs text-blue-500/80 mt-0.5">Within the normal response window — no action required yet.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-gray-400 border-t pt-3">
                        "Unanswered" means the most recent message on an active case was sent by a client, with no subsequent reply from the recovery team. Archived cases and cases with no messages are excluded.
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Value Indicators ── */}
        {data && vi && (
          <div>
            <SectionHeader
              icon={Star} iconColor="#f59e0b"
              title="Quality & Depth Indicators"
              description="These figures show how thoroughly the portal is being used per case — the higher, the more value it's delivering."
            />
            <Card className="border-0 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-gray-800">
                  {[
                    { value: vi.avgMsgsPerCase,           label: "Avg messages per case",   sub: "How much ongoing dialogue each case generates. Higher = more client involvement.", color: "#0ea5e9" },
                    { value: vi.avgActivitiesPerCase,      label: "Avg interactions per case", sub: "Updates and actions logged per matter. A healthy figure shows active case management.", color: "#f59e0b" },
                    { value: `${vi.submissionConversionRate}%`, label: "Submission conversion", sub: "Of cases submitted by clients, the % that became active instructions.", color: "#7c3aed" },
                    { value: `${vi.attachmentRate}%`,     label: "Messages with files",     sub: "How often supporting documents are shared via messaging rather than email.", color: "#6366f1" },
                  ].map((item, i) => (
                    <div key={i} className="p-5 text-center">
                      <div className="text-3xl font-bold tabular-nums mb-1.5" style={{ color: item.color }}>{item.value}</div>
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{item.label}</div>
                      <div className="text-xs text-gray-400 leading-snug">{item.sub}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="pb-8" />
      </div>
    </div>
  );
}
