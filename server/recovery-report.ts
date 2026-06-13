import { storage } from "./storage";

export interface RecoveryFilters {
  organisationId?: number | null;
  debtorType?: string | null;
  openedFrom?: Date | null; // filter on the case-opened date
  openedTo?: Date | null;
}

export interface RecoveryMetric {
  mean: number | null;
  median: number | null;
  count: number;
}

export interface RecoveryCaseRow {
  caseId: number;
  accountNumber: string;
  caseName: string;
  organisationName: string | null;
  openDate: string;
  usedFallbackStart: boolean;
  unreliableStart: boolean;
  timeToFirstPaymentDays: number | null;
  weightedRecoveryDays: number | null;
  settled: boolean;
  timeToFullRecoveryDays: number | null;
}

export interface RecoveryReportResult {
  summary: {
    totalCases: number;
    casesWithPayments: number;
    casesNoPayments: number;
    settledCases: number;
    fallbackStartUsed: number;
    unreliableStartCases: number;
    timeToFirstPayment: RecoveryMetric;
    weightedRecovery: RecoveryMetric;
    timeToFullRecovery: RecoveryMetric;
  };
  cases: RecoveryCaseRow[];
}

const MS_PER_DAY = 86_400_000;

// Matches the SOS "case opened" code TL0001 as a standalone code: it must sit on an
// alphanumeric boundary on both sides so it is not part of a longer code (e.g. TL00010
// or TL0001A).
const TL0001_REGEX = /(?:^|[^A-Za-z0-9])TL0001(?![A-Za-z0-9])/i;

// Whole-day difference (later - earlier), ignoring the time of day.
function dayDiff(later: Date, earlier: Date): number {
  const a = Date.UTC(later.getFullYear(), later.getMonth(), later.getDate());
  const b = Date.UTC(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
  return Math.round((a - b) / MS_PER_DAY);
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export async function computeRecoveryPerformance(
  filters: RecoveryFilters = {},
): Promise<RecoveryReportResult> {
  const { cases, payments, openActivities } = await storage.getRecoveryReportData();

  // Index payments by case (valid amount + date only)
  const paymentsByCase = new Map<number, { amount: number; date: Date }[]>();
  for (const p of payments) {
    if (!p.paymentDate) continue;
    const amount = parseFloat(p.amount || "0");
    if (isNaN(amount)) continue;
    const list = paymentsByCase.get(p.caseId) || [];
    list.push({ amount, date: new Date(p.paymentDate) });
    paymentsByCase.set(p.caseId, list);
  }

  // Earliest TL0001 timeline entry per case = the "case opened" date
  const openDateByCase = new Map<number, Date>();
  for (const a of openActivities) {
    if (!a.createdAt || !a.description) continue;
    if (!TL0001_REGEX.test(a.description)) continue;
    const date = new Date(a.createdAt);
    const existing = openDateByCase.get(a.caseId);
    if (!existing || date < existing) openDateByCase.set(a.caseId, date);
  }

  const ttfDays: number[] = [];
  const weightedDays: number[] = [];
  const ttrDays: number[] = [];

  let totalCases = 0;
  let casesWithPayments = 0;
  let casesNoPayments = 0;
  let settledCases = 0;
  let fallbackStartUsed = 0;
  let unreliableStartCases = 0;

  const caseRows: RecoveryCaseRow[] = [];

  for (const c of cases) {
    if (filters.organisationId && c.organisationId !== filters.organisationId) continue;
    if (filters.debtorType && c.debtorType !== filters.debtorType) continue;

    // Determine the case-opened date: TL0001 entry, else fall back to portal createdAt
    let openDate = openDateByCase.get(c.id) || null;
    let usedFallback = false;
    if (!openDate) {
      if (!c.createdAt) continue; // no usable start date at all
      openDate = new Date(c.createdAt);
      usedFallback = true;
    }

    if (filters.openedFrom && openDate < filters.openedFrom) continue;
    if (filters.openedTo && openDate > filters.openedTo) continue;

    totalCases++;
    if (usedFallback) fallbackStartUsed++;

    const casePayments = (paymentsByCase.get(c.id) || [])
      .slice()
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (casePayments.length === 0) {
      casesNoPayments++;
      caseRows.push({
        caseId: c.id,
        accountNumber: c.accountNumber,
        caseName: c.caseName,
        organisationName: c.organisationName,
        openDate: openDate.toISOString(),
        usedFallbackStart: usedFallback,
        unreliableStart: false,
        timeToFirstPaymentDays: null,
        weightedRecoveryDays: null,
        settled: false,
        timeToFullRecoveryDays: null,
      });
      continue;
    }
    casesWithPayments++;

    // Full recovery is judged on ORIGINAL debt vs payments only (costs/interest/fees
    // are ignored, as they can be negotiated). Settled when cumulative payments first
    // cover the original amount. This status is independent of the start date.
    const original = parseFloat(c.originalAmount || "0");
    let settled = false;
    let settleDate: Date | null = null;
    if (original > 0) {
      let cumulative = 0;
      for (const p of casePayments) {
        cumulative += p.amount;
        if (cumulative >= original) {
          settled = true;
          settleDate = p.date;
          break;
        }
      }
    }
    if (settled) settledCases++;

    // A start date that lands AFTER the first payment is impossible in reality and means
    // the recorded "opened" date is unreliable (common with migrated data, where the
    // import date post-dates historical payments). Excluding these from the timing
    // averages is far more honest than flooring the negative durations to 0, which would
    // drag every average down towards zero.
    const firstPaymentGap = dayDiff(casePayments[0].date, openDate);
    if (firstPaymentGap < 0) {
      unreliableStartCases++;
      caseRows.push({
        caseId: c.id,
        accountNumber: c.accountNumber,
        caseName: c.caseName,
        organisationName: c.organisationName,
        openDate: openDate.toISOString(),
        usedFallbackStart: usedFallback,
        unreliableStart: true,
        timeToFirstPaymentDays: null,
        weightedRecoveryDays: null,
        settled,
        timeToFullRecoveryDays: null,
      });
      continue;
    }

    // Time to first payment
    const ttf = firstPaymentGap;
    ttfDays.push(ttf);

    // Amount-weighted recovery time: each £ weighted by how long it took to arrive
    let weightedSum = 0;
    let amountSum = 0;
    for (const p of casePayments) {
      const days = Math.max(0, dayDiff(p.date, openDate));
      weightedSum += p.amount * days;
      amountSum += p.amount;
    }
    const weighted = amountSum > 0 ? weightedSum / amountSum : null;
    if (weighted !== null) weightedDays.push(weighted);

    let ttr: number | null = null;
    if (settled && settleDate) {
      ttr = Math.max(0, dayDiff(settleDate, openDate));
      ttrDays.push(ttr);
    }

    caseRows.push({
      caseId: c.id,
      accountNumber: c.accountNumber,
      caseName: c.caseName,
      organisationName: c.organisationName,
      openDate: openDate.toISOString(),
      usedFallbackStart: usedFallback,
      unreliableStart: false,
      timeToFirstPaymentDays: ttf,
      weightedRecoveryDays: weighted,
      settled,
      timeToFullRecoveryDays: ttr,
    });
  }

  return {
    summary: {
      totalCases,
      casesWithPayments,
      casesNoPayments,
      settledCases,
      fallbackStartUsed,
      unreliableStartCases,
      timeToFirstPayment: { mean: mean(ttfDays), median: median(ttfDays), count: ttfDays.length },
      weightedRecovery: { mean: mean(weightedDays), median: median(weightedDays), count: weightedDays.length },
      timeToFullRecovery: { mean: mean(ttrDays), median: median(ttrDays), count: ttrDays.length },
    },
    cases: caseRows,
  };
}
