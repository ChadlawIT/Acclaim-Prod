---
name: SOS timeline codes
description: How SOS-fed case_activities encode action codes and dates; how to match a specific code (e.g. TL0001 = case opened).
---

# SOS timeline codes in case_activities

SOS-fed `case_activities` rows carry an action code (format `[A-Z]{2}\d{4}`, e.g. `TL0001`,
`TL0016`, `AC0123`) **inside the `description` text**, not in a dedicated column. The wording
around the code can change; the code itself is the stable identifier.

- `TL0001` = the "case opened" timeline entry. Earliest TL0001 date = the true case start (t0).
- Match by code with alphanumeric boundaries on **both** sides so a longer code does not match:
  `/(?:^|[^A-Za-z0-9])TL0001(?![A-Za-z0-9])/i`. (Excluding only trailing digits still wrongly
  matches `TL0001A`; exclude letters too.)
- For DB efficiency, pre-filter with `description ILIKE '%TL0001%'`, then apply the strict regex
  in JS — the ILIKE alone over-matches (e.g. `TL00010`).

**Why:** these activities come only from SOS; the code is the contract, the surrounding text is not.

## Activity dates
The external API stores the SOS-provided activity date **into `case_activities.createdAt`**, so
`createdAt` is the real action date, not an ingest timestamp. Use it directly for timelines.
When a TL0001 entry is absent, the recovery/payment-performance report's case-opened date is
resolved in reliability order: (1) earliest TL0001 entry, (2) **earliest timeline activity of any
code** (e.g. an older "Case created" entry), (3) `cases.createdAt` (only this last one is flagged
`usedFallback`/estimated). The earliest-activity step exists because the timeline contains **only**
SOS-pushed `case_activities` (portal actions never create activities), so its earliest entry is a far
better start date than the portal ingest date — and TL0001 is NOT present on every case's opener.
The TL0001 code can sit in `description` OR `activity_type`, so match/regex-test **both** fields.

**Ingest must set createdAt explicitly.** Both external activity endpoints (single
`POST /api/external/cases/:externalRef/activities` and bulk `POST /api/external/activities/bulk`)
must pass `createdAt: activityDate ? new Date(activityDate) : new Date()`. The column defaults to
`now()`, so if an endpoint omits it the row silently gets the **ingest timestamp** (≈ portal-creation
date), not the SOS action date. The bulk endpoint had this bug for a long time (the assignment was
commented out, the author having wrongly tried a non-existent `activityDate` key instead of
`createdAt`). Symptom in the recovery/payment-performance report: a case shows its portal date as
"Date Opened" and is flagged "No start date" (unreliableStart, open date after first payment) even
though the timeline shows a TL0001 entry — because that TL0001 row carries the ingest date.
**Why:** rows already ingested keep the wrong date; only re-pushed activities get corrected.
