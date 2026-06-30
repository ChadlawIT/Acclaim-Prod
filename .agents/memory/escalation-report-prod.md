---
name: Escalation report production fixes
description: Three root causes found when escalation report returned zero results in Azure production.
---

## Bug 1: Case status case mismatch
Production database stores case status as `Active` (capital A). All escalation queries used `c.status = 'active'` (lowercase) — excluded every case.
**Fix:** Use `LOWER(c.status) = 'active'` in all three storage functions: `getEscalatedCaseMessages`, `getInactiveCases`, `getCasesStuckAtActivity`.

## Bug 2: email@acclaim.law has is_admin = false in production
The system user `email@acclaim.law` (used by SOS/external API to post case update messages) has `is_admin = false` in the Azure database, despite code comments assuming it was `true`. This caused outbound Acclaim→client updates to appear as unanswered client messages.
**Fix:** In `getEscalatedCaseMessages`, additionally exclude senders matching `%@acclaim.law` and `%@chadlaw.co.uk` domains, regardless of is_admin flag. Belt-and-braces — once the account is set to is_admin=true in prod, domain check still serves as fallback.

## Bug 3: Admin domain restriction excluded @acclaim.law staff
Admin/super-admin privileges were restricted to `@chadlaw.co.uk` only. Acclaim also has `@acclaim.law` accounts that need admin access.
**Fix:** All enforcement points updated to accept both domains: user creation, make-admin endpoint, super-admin toggle (server/routes.ts); button disabled state, alert, help text, super admin toggle visibility, stat card filter (AdminEnhanced.tsx).

## Diagnostic tool added
`GET /api/admin/reports/escalation/debug?days=N` (super-admin only) — returns every case with messages and a `result` field explaining inclusion/exclusion. Also surfaced in the UI as a collapsible "Diagnose" panel in the Unanswered Messages card (EscalationReportsTrigger.tsx).
