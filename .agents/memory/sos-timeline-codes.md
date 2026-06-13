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
When a TL0001 entry is absent, fall back to `cases.createdAt` (and count fallbacks so the report
can disclose how many start dates were estimated).
