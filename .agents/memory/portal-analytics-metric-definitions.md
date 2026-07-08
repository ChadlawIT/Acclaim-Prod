---
name: Portal Analytics metric definitions
description: Non-obvious rules for status/type breakdown grouping and the submission conversion rate metric in the Portal Analytics dashboard.
---

## Case-insensitive breakdown grouping
`casesByStatus` / `casesByType` in the portal-analytics endpoint must group by `LOWER(status)` / `LOWER(debtorType)` in SQL, not the raw column, then title-case the label for display.

**Why:** Production data has mixed-case values (e.g. "Active" and "active" both exist), so a naive `groupBy(cases.status)` splits one real category into duplicate rows in the chart/legend.

**How to apply:** Any new breakdown/grouping query over `cases.status` or `cases.debtorType` (or similarly free-text-ish enum columns) should normalize case in SQL before grouping, then re-capitalize once for the label.

## Submission conversion rate
`submissionConversionRate` = `processedSubmissions / totalSubmissions * 100`, where `processedSubmissions` = count of `caseSubmissions` rows with `LOWER(status) = 'processed'`.

**Why:** It used to be `totalCases / totalSubmissions`, which is conceptually wrong — `totalCases` includes cases created via the external/SOS API that have nothing to do with client-submitted case submissions, so the ratio could exceed 100% (seen as 19900% in production). `caseSubmissions.status` is the only true signal of "did this submission become a case."

**How to apply:** Never derive conversion/funnel metrics for `caseSubmissions` from `cases` counts directly — always key off `caseSubmissions.status` ('pending'/'processed'/'rejected').
