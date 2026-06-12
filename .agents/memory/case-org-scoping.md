---
name: Case org-scoping & moving cases between organisations
description: How a case's organisation link gates visibility, and what must move with a case when its organisation changes.
---

# Case organisation scoping

Cases belong to one organisation (`cases.organisationId`). A non-admin user can see a
case only if its `organisationId` is one of the user's assigned orgs. Admins bypass org
filtering. This is the single source of truth for case access.

## Moving a case to another organisation

When a case's `organisationId` changes, org-scoped CHILD tables must be updated in
lockstep, or data leaks to the old org / disappears for the new org:

- `documents` — has its own `organisationId` (NOT NULL). MUST be updated to the new org
  (org-level document listing filters by `documents.organisationId`).
- `payments` — has its own `organisationId` (NOT NULL). MUST be updated.
- `messages`, `case_activities`, `muted_cases`, `case_access_restrictions` — caseId-scoped,
  NO own org column → they follow the case automatically. Do NOT add org updates for these.

Do the case + documents + payments updates inside `db.transaction(...)` (driver is
`drizzle-orm/node-postgres` Pool, which supports real interactive transactions — the rest
of the codebase historically used none, but transactions ARE available).

**Why:** `getDocumentsForOrganisation` / payment reports filter by the row's own
`organisationId`, so stale child rows stay visible to the *old* org's users after a move.

## Message visibility is org-gated for case-linked messages

`getMessagesForUser` (server/storage.ts) splits visibility into two branches:
- **General messages (`caseId IS NULL`)**: visible via sender/recipient rules
  (senderId=user, recipientId=user, or recipientType='organization' with recipientId in
  user's orgs).
- **Case-linked messages (`caseId IS NOT NULL`)**: ALWAYS gated by
  `cases.organisationId IN user's orgs` — recipient/sender rules do NOT apply.

**Why:** case messages are stored with `recipientType='organization'` and
`recipientId` = the case's org *at send time*. If you let the org-recipient rule apply to
case messages, moving a case to a new org leaves old-org users still matching the stale
`recipientId` → cross-org leak. Keep case-message visibility tied to the case's CURRENT
org only. Any future change to message visibility must preserve this split.
