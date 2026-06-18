---
name: Notification email gating (documents & messages)
description: Conditions for a user to receive document-upload and message notification emails; SSO gate history
---

**Document-upload notifications** (in-portal Documents, OrgDocuments, Case Documents, external/SOS push) send to a user when ALL hold:
- `!isAdmin`, `email` set, `documentNotifications !== false`, case not muted (`isCaseMuted`), user not blocked (`isUserBlockedFromCase`).

**Message notifications** (admin→user, admin→organisation) send when:
- admin→user: `email` set, `!isAdmin`, `emailNotifications !== false`, not muted, not blocked.
- admin→org: `!isAdmin`, `email` set, `emailNotifications !== false`.

There is intentionally **no `azureId` (Microsoft SSO) requirement** on either document or message notifications. Local username/password users must receive both.

**Scheduled email reports** (`server/scheduled-reports.ts`) send when the user exists, has an email, and at least one of their organisations has scheduled reports enabled (plus frequency/lastSent throttling). No `azureId` gate.

**Why:** all these flows originally also required `azureId`, which silently skipped users who had never signed in via Microsoft SSO — so local-auth users never heard about new documents/messages or received scheduled reports even when configured. The SSO gate was removed from **document** notifications, then **message** notifications, then **scheduled reports**, all on 16 June 2026 at the user's request. No notification/report flow requires SSO any more.

**How to apply:** do NOT reintroduce an `azureId` gate on any document, message, or scheduled-report flow. Recipient eligibility is now toggle/config + non-admin + email + mute/block only.
