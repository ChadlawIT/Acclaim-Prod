---
name: Case access restriction temporary lift/restore
description: How admins temporarily lift a user's case-access restrictions and reliably re-block the same cases, reconstructed from the audit log (no schema change)
---

# Temporary lift of case access restrictions

Admins can temporarily LIFT some/all of a user's case-access restrictions and later RESTORE the same set. The user chose a **no-schema-change** design: lifting **deletes** the `case_access_restrictions` rows; the "previously blocked" list is **reconstructed from `audit_log`**.

## Reconstruction convention
Lift/restore endpoints write `audit_log` rows with:
- `tableName='case_access_restrictions'`, `recordId=String(caseId)`, `newValue=<blockedUserId>`
- `operation='DELETE'` for a lift, `'INSERT'` for a restore.

"Previously lifted" for a user = group those audit rows by caseId, take the latest by timestamp, keep those whose latest op is `DELETE`, **and exclude any caseId currently in the live restrictions table** (the currentSet filter). That filter is the key safeguard against desync with the older per-case endpoint (`POST /api/admin/cases/:id/access-restrictions`), which does NOT write audit rows.

## Ordering invariant (why it matters)
There are no DB transactions around the per-item loops, so ordering guarantees the core requirement "re-block without missing any case":
- **Lift:** write the DELETE audit entry **before** deleting the row. If the audit write fails, the row stays restricted → case is never lost from history.
- **Restore:** add the row **before** writing the INSERT audit entry. If the audit write fails, the case is already restricted again (shows under "currently restricted").

**Why:** if a lift deleted the row but failed to record the DELETE audit, that case would silently vanish from the "previously lifted" list and the admin would miss re-blocking it. Audit-before-delete prevents this.

## Gotcha
`client/src/pages/AdminEnhanced.tsx` contains multiple components (`CaseManagementTab`, `AdminEnhanced` default export, etc.). Hooks/state for a feature must be declared inside the SAME component that renders its UI — placing a query in `CaseManagementTab` while the state lives in `AdminEnhanced` yields "Cannot find name" errors.
