---
name: Recovery report "time to conclusion" metric
description: How the recovery performance report measures a case's conclusion/recovery time.
---

# Recovery report "time to conclusion" metric

The recovery performance report (server/recovery-report.ts, shown in AdminEnhanced.tsx)
measures a case's recovery duration as **time to conclusion**, not "time to full recovery".

- A case is **concluded** when `cases.status` (case-insensitive) === `closed` — this covers
  paid-in-full, settled-for-less, and aborted alike.
- **Time to conclusion = open date → the case's LAST payment date.** No close/conclusion date
  is used at all.
- Closed case with no payments (aborted) = concluded but `timeToConclusionDays: null` (no
  recovery time to measure). Non-closed cases = not concluded ("Open").

**Why:** The old logic only counted a case "settled" once cumulative payments reached the
ORIGINAL debt, so settlements for less than the full debt were silently excluded. The client
decided: judge conclusion by closed status and take timing from the payments themselves —
"if there are no payments there's no recovery time anyway, so we don't need a close date."
Critically, **status changes are NOT recorded anywhere** (the external/SOS status endpoint
`PUT /api/external/cases/:externalRef/status` and admin paths write no audit/log entry, and
`updateCase` doesn't either), so there is no historical close-date to derive — payments are
the only reliable timing signal without adding logging or a schema column.

**How to apply:** Response field names are `concluded`, `timeToConclusionDays`,
`concludedCases`, `timeToConclusion` (metric). The earlier open-date resolution (TL0001 →
earliest timeline activity → portal createdAt) is unchanged and still gates out
unreliable-start cases (start after first payment).
