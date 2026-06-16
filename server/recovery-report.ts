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
  concluded: boolean;
  timeToConclusionDays: number | null;
}

export interface RecoveryReportResult {
  summary: {
    totalCases: number;
    casesWithPayments: number;
    casesNoPayments: number;
    concludedCases: number;
    fallbackStartUsed: number;
    unreliableStartCases: number;
    timeToFirstPayment: RecoveryMetric;
    weightedRecovery: RecoveryMetric;
    timeToConclusion: RecoveryMetric;
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
  const { cases, payments, openActivities, earliestActivities } = await storage.getRecoveryReportData();

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

  // Earliest TL0001 timeline entry per case = the "case opened" date. The code may sit in
  // the description or the activity_type, so check both.
  const openDateByCase = new Map<number, Date>();
  for (const a of openActivities) {
    if (!a.createdAt) continue;
    const hasCode = TL0001_REGEX.test(a.description || "") || TL0001_REGEX.test(a.activityType || "");
    if (!hasCode) continue;
    const date = new Date(a.createdAt);
    const existing = openDateByCase.get(a.caseId);
    if (!existing || date < existing) openDateByCase.set(a.caseId, date);
  }

  // Earliest timeline activity per case (any SOS entry). Used as the case-opened date when
  // no explicit TL0001 entry exists, since the timeline only ever contains SOS-pushed
  // events — its earliest entry is a far better start date than the portal ingest date.
  const earliestActivityByCase = new Map<number, Date>();
  for (const a of earliestActivities) {
    if (!a.createdAt) continue;
    earliestActivityByCase.set(a.caseId, new Date(a.createdAt));
  }

  const ttfDays: number[] = [];
  const weightedDays: number[] = [];
  const ttcDays: number[] = [];

  let totalCases = 0;
  let casesWithPayments = 0;
  let casesNoPayments = 0;
  let concludedCases = 0;
  let fallbackStartUsed = 0;
  let unreliableStartCases = 0;

  const caseRows: RecoveryCaseRow[] = [];

  for (const c of cases) {
    if (filters.organisationId && c.organisationId !== filters.organisationId) continue;
    if (filters.debtorType && c.debtorType !== filters.debtorType) continue;

    // Determine the case-opened date, in order of reliability:
    //   1. The explicit TL0001 "case opened" timeline entry.
    //   2. The earliest timeline activity (any SOS entry, e.g. an older "Case created").
    //   3. Fall back to the portal createdAt date (flagged as an estimate).
    let openDate = openDateByCase.get(c.id) || earliestActivityByCase.get(c.id) || null;
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

    // A case is "concluded" once it has been closed (paid in full, settled for less, or
    // aborted). We do not need a recorded close date: recovery timing is taken from the
    // payments themselves (see below), and a case with no payments simply has no recovery
    // time to measure.
    const isClosed = (c.status || "").trim().toLowerCase() === "closed";
    if (isClosed) concludedCases++;

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
        concluded: isClosed,
        timeToConclusionDays: null,
      });
      continue;
    }
    casesWithPayments++;

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
        concluded: isClosed,
        timeToConclusionDays: null,
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

    // Time to conclusion: for closed cases, recovery concludes at the LAST payment. This
    // treats paid-in-full and settled-for-less identically, and needs no close date.
    let ttc: number | null = null;
    if (isClosed) {
      const lastPayment = casePayments[casePayments.length - 1].date;
      ttc = Math.max(0, dayDiff(lastPayment, openDate));
      ttcDays.push(ttc);
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
      concluded: isClosed,
      timeToConclusionDays: ttc,
    });
  }

  return {
    summary: {
      totalCases,
      casesWithPayments,
      casesNoPayments,
      concludedCases,
      fallbackStartUsed,
      unreliableStartCases,
      timeToFirstPayment: { mean: mean(ttfDays), median: median(ttfDays), count: ttfDays.length },
      weightedRecovery: { mean: mean(weightedDays), median: median(weightedDays), count: weightedDays.length },
      timeToConclusion: { mean: mean(ttcDays), median: median(ttcDays), count: ttcDays.length },
    },
    cases: caseRows,
  };
}
