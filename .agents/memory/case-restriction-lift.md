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

## SOS API can push restrictions at case creation
`POST /api/external/cases` accepts `hideFromUsers` (array) / `hide_from_user` / `hideFromUser` (single or comma-separated) to block specific users from a case. Identifiers resolve to a portal user in order: external ref → email → user id. Matched users get a `case_access_restrictions` row + an audit INSERT (`userId=null`, `userEmail='SOS API'`); unmatched identifiers are returned as `unmatchedRestrictionIdentifiers`. No schema change — reuses the existing table.

**Why create-only:** restrictions are applied ONLY in the new-case branch, never on the case update/sync branch. SOS re-syncs hit the update branch repeatedly; reapplying there would silently undo an admin's temporary lift. So once a case exists, restriction changes belong to the portal (lift/restore UI), not the routine SOS sync.

**Dedicated post-create endpoint:** SOS pushes the hide-from-user list shortly AFTER creation as a separate one-shot call to `POST /api/external/cases/:externalRef/restrictions` — deliberately NOT part of the periodic sync, so re-syncs never touch restrictions. Both this and the create branch share one helper `applyExternalCaseRestrictions()` in routes.ts. The helper de-dupes by resolved user id and is idempotent-aware: `storage.addCaseAccessRestriction` returns a boolean (true=new row), so repeated pushes only audit/`restrictedUserIds` real inserts and bucket no-ops into `alreadyRestrictedUserIds`. Unmatched identifiers come back in `unmatchedRestrictionIdentifiers`.

**Note:** the "small/large" classification driving this lives entirely in SOS, not in the portal (not derivable from amount or any portal field) — that's why it must be pushed in rather than computed.

## Gotcha
`client/src/pages/AdminEnhanced.tsx` contains multiple components (`CaseManagementTab`, `AdminEnhanced` default export, etc.). Hooks/state for a feature must be declared inside the SAME component that renders its UI — placing a query in `CaseManagementTab` while the state lives in `AdminEnhanced` yields "Cannot find name" errors.
